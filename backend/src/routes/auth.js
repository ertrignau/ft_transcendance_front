import express from 'express';
import passport from '../config/passport.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
handleOAuthCallback,
confirmRegister42,
login,
register,
getMe,
logout,
changePassword
} from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login -> connexion classique
router.post('/login', login);

// POST /api/auth/register -> inscription classique
router.post('/register', register);

// GET /api/auth/42 -> redirection vers OAuth 42
router.get('/42', passport.authenticate('42'));

// GET /api/auth/42/callback -> callback OAuth 42
router.get('/42/callback', 
passport.authenticate('42', {
failureRedirect: process.env.FRONTEND_URL + '/?error=login_cancelled',
session: false
}),
handleOAuthCallback
);

// POST /api/auth/42/confirm -> confirmation inscription OAuth 42
router.post('/42/confirm', confirmRegister42);

// POST /api/auth/change-password -> changer le mot de passe (protected)
router.post('/change-password', authenticateToken, changePassword);

// GET /api/auth/me -> recupere l'utilisateur connecté (protected)
router.get('/me', authenticateToken, getMe);

// POST /api/auth/logout -> Deco (protected)
router.post('/logout', authenticateToken, logout);

export default router;
