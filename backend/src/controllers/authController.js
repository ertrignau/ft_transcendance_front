/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   authController.js                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 12:33:49 by eric              #+#    #+#             */
/*   Updated: 2026/03/16 17:00:59 by eric             ###   ########.fr       */
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
        const { login, password } = req.body;

        if (!login || !password)
            return res.status(400).json({ error: 'Login et mot de passe requis' });

        // Chercher par username OU email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: login },
                    { email: login },
                ]
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
        const tempToken = jwt.sign(
            { intraId: user.intraId || user.ftId.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        const data = Buffer.from(JSON.stringify({
            username:  user.username,
            email:     user.email,
            firstName: user.firstName,
            lastName:  user.lastName,
            avatar:    user.avatar,
        })).toString('base64');

        res.redirect(`${process.env.FRONTEND_URL}/register/42?tempToken=${tempToken}&data=${data}`);
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
        const { username, email, firstName, lastName, avatar, tempToken } = req.body;

        if (!tempToken)
            return res.status(401).json({ error: 'Token manquant' });

        // Vérifier le tempToken
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        if (!decoded.intraId)
            return res.status(401).json({ error: 'Token invalide' });

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

        // Créer l'user en DB
        const user = await prisma.user.create({
            data: {
                username,
                email,
                firstName,
                lastName,
                avatar:    avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=3b82f6&color=fff`,
                intraId:   decoded.intraId.toString(),
                password:  null,
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