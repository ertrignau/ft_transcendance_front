#!/usr/bin/env node

/* ************************************************************************** */
/*                                                                            */
/*                                testFtp.js                                 */
/*                         Test script for FTP Service                       */
/*                                                                            */
/* Usage: node testFtp.js                                                    */
/*                                                                            */
/* ************************************************************************** */

import FTPService from './src/services/ftpService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const ftpConfig = {
    FTP_HOST: process.env.FTP_HOST || 'localhost',
    FTP_PORT: parseInt(process.env.FTP_PORT || '21', 10),
    FTP_USER: process.env.FTP_USER || 'anonymous',
    FTP_PASSWORD: process.env.FTP_PASSWORD || '',
    FTP_SECURE: process.env.FTP_SECURE === 'true' || false,
    FTP_AVATAR_DIR: process.env.FTP_AVATAR_DIR || '/uploads/avatars',
};

console.log('\n🧪 FTP Service Test Script');
console.log('============================\n');
console.log('📋 Configuration:');
console.log(`   Host: ${ftpConfig.FTP_HOST}`);
console.log(`   Port: ${ftpConfig.FTP_PORT}`);
console.log(`   User: ${ftpConfig.FTP_USER}`);
console.log(`   Secure: ${ftpConfig.FTP_SECURE}`);
console.log(`   Avatar Dir: ${ftpConfig.FTP_AVATAR_DIR}\n`);

// Create FTP Service instance
const ftpService = new FTPService(ftpConfig);

/**
 * Test 1: Connection
 */
async function testConnection() {
    console.log('📌 Test 1: Connection');
    try {
        await ftpService.connect();
        console.log('✅ Connexion réussie au serveur FTP\n');
        return true;
    } catch (error) {
        console.error(`❌ Erreur connexion: ${error.message}\n`);
        return false;
    }
}

/**
 * Test 2: Avatar Directory Creation
 */
async function testAvatarDir() {
    console.log('📌 Test 2: Avatar Directory Initialization');
    try {
        await ftpService.ensureAvatarDir();
        console.log('✅ Répertoire d\'avatars initialisé\n');
        return true;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        return false;
    }
}

/**
 * Test 3: List Avatars
 */
async function testListAvatars() {
    console.log('📌 Test 3: List Avatars');
    try {
        const files = await ftpService.listAvatars();
        console.log(`✅ ${files.length} fichiers trouvés`);
        files.forEach(file => console.log(`   - ${file.name}`));
        console.log();
        return true;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        return false;
    }
}

/**
 * Test 4: Upload Avatar
 */
async function testUploadAvatar() {
    console.log('📌 Test 4: Upload Avatar');
    try {
        // Small test PNG (1x1 pixel)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const filename = await ftpService.uploadAvatar(testImage, 'test-user-123');
        console.log(`✅ Avatar uploadé: ${filename}`);
        console.log(`   Nom du fichier: ${filename}\n`);
        
        window.testFilename = filename; // Store for Test 5
        return filename;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        return null;
    }
}

/**
 * Test 5: Download Avatar
 */
async function testDownloadAvatar(filename) {
    if (!filename) {
        console.log('📌 Test 5: Download Avatar');
        console.warn('⚠️  Skipped (no filename from Test 4)\n');
        return false;
    }

    console.log('📌 Test 5: Download Avatar');
    try {
        const buffer = await ftpService.downloadAvatar(filename);
        console.log(`✅ Avatar téléchargé: ${filename}`);
        console.log(`   Taille: ${buffer.length} bytes\n`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        return false;
    }
}

/**
 * Test 6: Path Traversal Prevention
 */
async function testPathTraversalPrevention() {
    console.log('📌 Test 6: Path Traversal Prevention');
    try {
        await ftpService.downloadAvatar('../../../etc/passwd');
        console.error('❌ Path traversal NOT prevented!\n');
        return false;
    } catch (error) {
        if (error.message.includes('invalide')) {
            console.log('✅ Path traversal attempt bloquée');
            console.log(`   Erreur: ${error.message}\n`);
            return true;
        }
        throw error;
    }
}

/**
 * Test 7: Delete Avatar
 */
async function testDeleteAvatar(filename) {
    if (!filename) {
        console.log('📌 Test 7: Delete Avatar');
        console.warn('⚠️  Skipped (no filename from Test 4)\n');
        return false;
    }

    console.log('📌 Test 7: Delete Avatar');
    try {
        await ftpService.deleteAvatar(filename);
        console.log(`✅ Avatar supprimé: ${filename}\n`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        return false;
    }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1
    const test1 = await testConnection();
    results.tests.push({ name: 'Connection', passed: test1 });
    if (test1) results.passed++; else results.failed++;

    if (!test1) {
        console.error('❌ Cannot continue - FTP connection failed\n');
        printSummary(results);
        process.exit(1);
    }

    // Test 2
    const test2 = await testAvatarDir();
    results.tests.push({ name: 'Avatar Directory', passed: test2 });
    if (test2) results.passed++; else results.failed++;

    // Test 3
    const test3 = await testListAvatars();
    results.tests.push({ name: 'List Avatars', passed: test3 });
    if (test3) results.passed++; else results.failed++;

    // Test 4
    const filename = await testUploadAvatar();
    results.tests.push({ name: 'Upload Avatar', passed: !!filename });
    if (filename) results.passed++; else results.failed++;

    // Test 5
    const test5 = await testDownloadAvatar(filename);
    results.tests.push({ name: 'Download Avatar', passed: test5 });
    if (test5) results.passed++; else results.failed++;

    // Test 6
    const test6 = await testPathTraversalPrevention();
    results.tests.push({ name: 'Path Traversal Prevention', passed: test6 });
    if (test6) results.passed++; else results.failed++;

    // Test 7
    const test7 = await testDeleteAvatar(filename);
    results.tests.push({ name: 'Delete Avatar', passed: test7 });
    if (test7) results.passed++; else results.failed++;

    // Cleanup
    try {
        await ftpService.disconnect();
        console.log('👋 Déconnecté du serveur FTP\n');
    } catch (err) {
        console.warn('⚠️  Erreur déconnexion:', err.message);
    }

    printSummary(results);
}

/**
 * Print Test Summary
 */
function printSummary(results) {
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('===================\n');
    
    results.tests.forEach(test => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test.name}`);
    });

    console.log(`\n📈 Total: ${results.passed}/${results.tests.length} passed`);
    
    if (results.failed === 0) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log(`⚠️  ${results.failed} test(s) failed\n`);
        process.exit(1);
    }
}

// Run tests
console.log('🚀 Démarrage des tests...\n');
runAllTests().catch(error => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
});
