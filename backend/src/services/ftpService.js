/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ftpService.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/24 18:00:00 by eric              #+#    #+#             */
/*   Updated: 2026/03/24 14:26:17 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Client } from 'basic-ftp';

class FTPService {
    constructor(config) {
        this.config = {
            host: config.FTP_HOST || 'localhost',
            port: config.FTP_PORT || 21,
            user: config.FTP_USER || 'anonymous',
            password: config.FTP_PASSWORD || '',
            secure: config.FTP_SECURE === 'true' || false,
        };
        this.avatarDir = config.FTP_AVATAR_DIR || '/uploads/avatars';
        this.client = null;
        this.connected = false;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Connexion au serveur FTP avec retry logic
     */
    async connect() {
        if (this.connected && this.client) {
            console.log('✅ FTP déjà connecté');
            return this.client;
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔗 Tentative FTP #${attempt}/${this.maxRetries}: ${this.config.host}:${this.config.port}`);
                
                this.client = new Client();
                await this.client.access({
                    host: this.config.host,
                    port: this.config.port,
                    user: this.config.user,
                    password: this.config.password,
                    secure: this.config.secure,
                });

                this.connected = true;
                console.log(`✅ FTP connecté: ${this.config.host}`);
                return this.client;
            } catch (error) {
                console.error(`❌ Erreur connexion FTP (tentative ${attempt}):`, error.message);
                this.client = null;
                
                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                } else {
                    throw new Error(`Impossible de se connecter au serveur FTP après ${this.maxRetries} tentatives`);
                }
            }
        }
    }

    /**
     * Créer le répertoire d'avatars s'il n'existe pas
     */
    async ensureAvatarDir() {
        try {
            const client = await this.connect();
            
            // Essayer de naviguer dans le répertoire
            try {
                await client.cd(this.avatarDir);
                console.log(`✅ Répertoire FTP existe: ${this.avatarDir}`);
            } catch (error) {
                // Répertoire n'existe pas, le créer
                try {
                    await client.mkdir(this.avatarDir, true);
                    console.log(`✅ Répertoire FTP créé: ${this.avatarDir}`);
                } catch (mkdirError) {
                    console.warn(`⚠️ Impossible de créer le répertoire: ${mkdirError.message}`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du répertoire FTP:', error);
            throw error;
        }
    }

    /**
     * Upload un avatar en base64
     * @param {string} base64Data - Données base64 (format: data:image/...;base64,...)
     * @param {string} userId - ID utilisateur
     * @returns {Promise<string>} Nom du fichier
     */
    async uploadAvatar(base64Data, userId) {
        try {
            // Valider le format base64
            if (!base64Data.startsWith('data:image/')) {
                throw new Error('Format d\'image invalide');
            }

            // Extraire le type MIME et les données
            const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Format base64 invalide');
            }

            const [, fileExtension, base64Content] = matches;

            // Générer un nom de fichier unique
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 10);
            const filename = `${randomStr}_${timestamp}.${fileExtension}`;

            // Convertir base64 en buffer
            const buffer = Buffer.from(base64Content, 'base64');

            // Valider la taille (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (buffer.length > maxSize) {
                throw new Error(`Fichier trop volumineux (max 5MB, reçu: ${Math.round(buffer.length / 1024 / 1024)}MB)`);
            }

            console.log(`📤 Upload avatar FTP: ${filename} (${Math.round(buffer.length / 1024)}KB) pour user ${userId}`);

            // Connecter et naviger dans le répertoire d'avatars
            const client = await this.connect();
            await client.cd(this.avatarDir);

            // Upload le fichier
            await client.uploadFrom(buffer, filename);

            console.log(`✅ Avatar uploadé FTP: ${filename}`);
            return filename;
        } catch (error) {
            console.error('❌ Erreur upload FTP:', error.message);
            throw error;
        }
    }

    /**
     * Télécharger un avatar
     * @param {string} filename - Nom du fichier
     * @returns {Promise<Buffer>} Contenu du fichier
     */
    async downloadAvatar(filename) {
        try {
            // Validation: empêcher la traversée de répertoire
            if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                throw new Error('Nom de fichier invalide');
            }

            console.log(`📥 Download avatar FTP: ${filename}`);

            const client = await this.connect();
            await client.cd(this.avatarDir);

            // Vérifier que le fichier existe
            const fileList = await client.list();
            const fileExists = fileList.some(file => file.name === filename);
            
            if (!fileExists) {
                throw new Error(`Fichier non trouvé: ${filename}`);
            }

            // Télécharger le fichier
            const buffer = await client.downloadTo(Buffer.allocUnsafe(0), filename);

            console.log(`✅ Avatar téléchargé FTP: ${filename}`);
            return buffer;
        } catch (error) {
            console.error('❌ Erreur download FTP:', error.message);
            throw error;
        }
    }

    /**
     * Supprimer un avatar
     * @param {string} filename - Nom du fichier
     */
    async deleteAvatar(filename) {
        try {
            // Validation
            if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                throw new Error('Nom de fichier invalide');
            }

            console.log(`🗑️  Suppression avatar FTP: ${filename}`);

            const client = await this.connect();
            await client.cd(this.avatarDir);
            await client.remove(filename);

            console.log(`✅ Avatar supprimé FTP: ${filename}`);
        } catch (error) {
            console.error('❌ Erreur suppression FTP:', error.message);
            throw error;
        }
    }

    /**
     * Lister tous les avatars
     */
    async listAvatars() {
        try {
            const client = await this.connect();
            await client.cd(this.avatarDir);
            const files = await client.list();
            
            console.log(`📋 Avatars FTP (${files.length} fichiers):`, files.map(f => f.name));
            return files;
        } catch (error) {
            console.error('❌ Erreur listage FTP:', error.message);
            return [];
        }
    }

    /**
     * Déconnecter du serveur FTP
     */
    async disconnect() {
        if (this.client && this.connected) {
            try {
                await this.client.close();
                this.connected = false;
                this.client = null;
                console.log('👋 FTP déconnecté');
            } catch (error) {
                console.error('❌ Erreur déconnexion FTP:', error.message);
            }
        }
    }

    /**
     * Vérifier l'état de la connexion
     */
    isConnected() {
        return this.connected && this.client !== null;
    }
}

// Instance globale du service FTP
let ftpServiceInstance = null;

/**
 * Obtenir ou créer l'instance du service FTP
 */
export const getFTPService = (config) => {
    if (!ftpServiceInstance) {
        ftpServiceInstance = new FTPService(config);
    }
    return ftpServiceInstance;
};

export default FTPService;
