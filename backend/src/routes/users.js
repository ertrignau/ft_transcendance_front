/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   users.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 12:34:11 by eric              #+#    #+#             */
/*   Updated: 2026/03/12 17:27:23 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
	getUsers,
	getUserByUsername,
	updateProfile,
	getUserPosts,
	followUserByUsername,
	unfollowUserByUsername,
} from '../controllers/userController.js';

const router = express.Router();

// GET /api/users - Liste tous les utilisateurs (recherche + pagination)
router.get('/', optionalAuth, getUsers);

// PATCH /api/users/me - Met à jour le profil (protégé) — AVANT /:username
router.patch('/me', authenticateToken, updateProfile);

// GET /api/users/:username - Récupère un profil par username
router.get('/:username', optionalAuth, getUserByUsername);

// GET /api/users/:username/posts - Posts d'un utilisateur
router.get('/:username/posts', optionalAuth, getUserPosts);

// POST /api/users/:username/follow - Suivre un utilisateur (protégé)
router.post('/:username/follow', authenticateToken, followUserByUsername);

// DELETE /api/users/:username/follow - Unfollow un utilisateur (protégé)
router.delete('/:username/follow', authenticateToken, unfollowUserByUsername);

export default router;