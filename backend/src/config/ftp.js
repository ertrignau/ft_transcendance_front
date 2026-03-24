/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ftp.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/24 18:00:00 by eric              #+#    #+#             */
/*   Updated: 2026/03/24 14:25:43 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getFTPService } from '../services/ftpService.js';

const ftpConfig = {
    FTP_HOST: process.env.FTP_HOST || 'localhost',
    FTP_PORT: parseInt(process.env.FTP_PORT || '21', 10),
    FTP_USER: process.env.FTP_USER || 'anonymous',
    FTP_PASSWORD: process.env.FTP_PASSWORD || '',
    FTP_SECURE: process.env.FTP_SECURE || 'false',
    FTP_AVATAR_DIR: process.env.FTP_AVATAR_DIR || '/uploads/avatars',
};

// Initialiser le service FTP avec la configuration
const ftpService = getFTPService(ftpConfig);

// Initialiser le répertoire d'avatars au démarrage
(async () => {
    try {
        await ftpService.ensureAvatarDir();
        console.log('✅ Configuration FTP initialisée');
    } catch (error) {
        console.error('❌ Erreur initialisation FTP:', error.message);
    }
})();

export default ftpService;
