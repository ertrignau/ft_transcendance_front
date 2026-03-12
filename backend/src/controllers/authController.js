/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   authController.js                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 12:33:49 by eric              #+#    #+#             */
/*   Updated: 2026/03/12 17:12:52 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const generateToken = (user) => {
	return jwt.sign (
		{
			id: user.id,
			username: user.username,
			email: user.email,
		},
		process.env.JWT_SECRET,
		{ expiresIn: '7d' } // Token sera valide pendant 7 jours
	);
};

export const handleOAuthCallback = (req, res) => {
	try {
		const token = generateToken(req.user);
		res.redirect(`${process.env.FRONTEND_URL}/callback?token=${token}`);
	} catch (error) {
		console.error('Erreur callback OAuth:', error);
		res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
			id: true,
			username: true,
			email: true,
			firstName: true,
			lastName: true,
			avatar: true,
			bio: true,
			campus: true,
			cursus: true,
			level: true,
			createdAt: true,
			_count: {
				select: {
					posts: true,
					followers: true,
					following: true,
				}
			}
		}
	});

	if (!user) {
		return res.status(404).json({ error: 'Utilisateur non trouvé'});
	}
	res.json(user);
	} catch (error) {
		console.error('Erreur getMe:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

export const logout = (req, res) => {
	res.json({message: 'Déconnexion réussie'})
};
