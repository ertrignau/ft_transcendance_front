/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   authController.js                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 12:33:49 by eric              #+#    #+#             */
/*   Updated: 2026/03/24 13:28:48 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';

export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// ===================================
// LOGIN CLASSIQUE
// ===================================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email et mot de passe requis' });

        // Chercher par email
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user)
            return res.status(401).json({ error: 'Identifiants incorrects' });

        // Vérifier le password
        if (!user.password)
            return res.status(401).json({ error: 'Ce compte utilise la connexion via 42' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Identifiants incorrects' });

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ===================================
// REGISTER CLASSIQUE
// ===================================
export const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, avatar } = req.body;

        if (!username || !email || !password || !firstName || !lastName)
            return res.status(400).json({ error: 'Tous les champs sont requis' });

        // Vérifier si username ou email déjà pris
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email },
                ]
            }
        });

        if (existing?.username === username)
            return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
        if (existing?.email === email)
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });

        // Hasher le password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=3b82f6&color=fff`,
            }
        });

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ===================================
// OAUTH 42 CALLBACK
// ===================================
export const handleOAuthCallback = (req, res) => {
    try {
        const user = req.user;

        // USER EXISTANT → connecter directement avec JWT
        if (!user.isNewUser) {
            const token = generateToken(user);
            return res.redirect(`${process.env.FRONTEND_URL}/callback?token=${token}`);
        }

        // NOUVEL USER → rediriger vers le formulaire de confirmation
        // ⚠️ Encoder TOUTES les données API 42 dans le JWT (pas de base64 exposé en URL)
        const tempToken = jwt.sign(
            {
                intraId:   user.intraId || user.ftId.toString(),
                username:  user.username,
                email:     user.email,
                firstName: user.firstName,
                lastName:  user.lastName,
                avatar:    user.avatar,
                campus:    user.campus,
                cursus:    user.cursus,
                level:     user.level,
            },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/register/42?tempToken=${tempToken}`);
    } catch (error) {
        console.error('Erreur callback OAuth:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

// ===================================
// CONFIRMATION INSCRIPTION OAUTH 42
// ===================================
export const confirmRegister42 = async (req, res) => {
    try {
        // ⚠️ N'accepter que password et confirmPassword du frontend
        // Les données API 42 viennent UNIQUEMENT du token
        const { password, confirmPassword, tempToken } = req.body;

        if (!tempToken)
            return res.status(401).json({ error: 'Token manquant' });

        // Vérifier et décoder le tempToken
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        // Valider que tous les champs API 42 sont présents dans le token
        const { intraId, username, email, firstName, lastName, avatar, campus, cursus, level } = decoded;
        if (!intraId || !username || !email || !firstName || !lastName)
            return res.status(401).json({ error: 'Token invalide - données manquantes' });

        // Valider le mot de passe du frontend
        if (!password || password.length < 6)
            return res.status(400).json({ error: 'Mot de passe: minimum 6 caractères' });
        if (password !== confirmPassword)
            return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });

        // Vérifier si username ou email déjà pris
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email },
                ]
            }
        });

        if (existing?.username === username)
            return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
        if (existing?.email === email)
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'user en DB avec les données du token (pas du frontend!)
        const user = await prisma.user.create({
            data: {
                username,          // Du token (API 42)
                email,             // Du token (API 42)
                firstName,         // Du token (API 42)
                lastName,          // Du token (API 42)
                avatar:    avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=3b82f6&color=fff`,
                intraId:   intraId.toString(),
                password:  hashedPassword,  // Du frontend, hashé
                campus:    campus || null,
                cursus:    cursus || null,
                level:     level || 0,
            }
        });

        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Erreur confirmRegister42:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ===================================
// GET ME
// ===================================
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id:        true,
                username:  true,
                email:     true,
                firstName: true,
                lastName:  true,
                avatar:    true,
                bio:       true,
                campus:    true,
                cursus:    true,
                level:     true,
                intraId:   true,
                createdAt: true,
                theme:     true,
                _count: {
                    select: {
                        posts:     true,
                        followers: true,
                        following: true,
                    }
                }
            }
        });

        if (!user)
            return res.status(404).json({ error: 'Utilisateur non trouvé' });

        res.json(user);
    } catch (error) {
        console.error('Erreur getMe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ===================================
// LOGOUT
// ===================================
export const logout = (req, res) => {
    res.json({ message: 'Déconnexion réussie' });
};

// ===================================
// CHANGE PASSWORD
// ===================================
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // Validations
        if (!newPassword || !confirmPassword)
            return res.status(400).json({ error: 'Nouveau mot de passe et confirmation requis' });

        if (newPassword !== confirmPassword)
            return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });

        if (newPassword.length < 6)
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

        // Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user)
            return res.status(404).json({ error: 'Utilisateur non trouvé' });

        // Si l'utilisateur a déjà un password (inscrit classique), vérifier l'ancien
        if (user.password && currentPassword) {
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid)
                return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        } else if (user.password && !currentPassword) {
            return res.status(400).json({ error: 'Mot de passe actuel requis' });
        }

        // Hasher le nouveau password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json({ message: 'Mot de passe changé avec succès', user: userWithoutPassword });
    } catch (error) {
        console.error('Erreur changePassword:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};