/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   uploads.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/24 17:00:00 by eric              #+#    #+#             */
/*   Updated: 2026/03/24 13:35:41 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import express from 'express';
import { uploadAvatar, getAvatar } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/uploads/avatar - Upload un avatar (protégé)
router.post('/avatar', authenticateToken, uploadAvatar);

// GET /api/uploads/avatars/:filename - Récupère un avatar (protégé)
router.get('/avatars/:filename', authenticateToken, getAvatar);

export default router;
