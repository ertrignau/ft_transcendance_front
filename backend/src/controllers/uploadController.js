/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   uploadController.js                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/24 17:00:00 by eric              #+#    #+#             */
/*   Updated: 2026/03/24 14:26:15 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import prisma from '../config/database.js';
import ftpService from '../config/ftp.js';

// ===================================
// UPLOAD AVATAR
// ===================================
export const uploadAvatar = async (req, res) => {
    try {
        const { avatarData } = req.body;
        const userId = req.user.id;

        if (!avatarData) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Valider que c'est du base64
        if (!avatarData.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Format d\'image invalide' });
        }

        // Upload via FTP
        const filename = await ftpService.uploadAvatar(avatarData, userId);

        // Mettre à jour le profil utilisateur avec le nom du fichier
        await prisma.user.update({
            where: { id: userId },
            data: { avatar: filename }
        });

        console.log(`✅ Avatar FTP uploadé: ${filename} pour user ${userId}`);
        res.json({ 
            message: 'Avatar uploadé avec succès',
            avatar: filename 
        });
    } catch (error) {
        console.error('❌ Erreur upload avatar:', error.message);
        res.status(500).json({ error: error.message || 'Erreur lors de l\'upload' });
    }
};

// ===================================
// DOWNLOAD/SERVE AVATAR
// ===================================
export const getAvatar = async (req, res) => {
    try {
        const { filename } = req.params;
        const userId = req.user?.id;

        console.log(`📥 GET avatar: ${filename} par user ${userId}`);

        // Validation: empêcher la traversée de répertoire
        if (!filename || filename.includes('..') || filename.includes('/')) {
            console.warn(`⚠️ Filename invalide: ${filename}`);
            return res.status(400).json({ error: 'Nom de fichier invalide' });
        }

        // Télécharger le fichier depuis FTP
        const buffer = await ftpService.downloadAvatar(filename);

        // Déterminer le type MIME basé sur l'extension
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
        };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        console.log(`✅ Envoi avatar FTP: ${filename}`);
        res.type(mimeType);
        res.send(buffer);
    } catch (error) {
        console.error('❌ Erreur download avatar:', error.message);
        
        // Vérifier si c'est un fichier pas trouvé
        if (error.message.includes('non trouvé')) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération du fichier' });
    }
};
