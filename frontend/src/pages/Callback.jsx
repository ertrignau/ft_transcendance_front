/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Callback.jsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 13:45:00 by eric              #+#    #+#             */
/*   Updated: 2026/04/03 14:35:56 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Callback() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		const token = searchParams.get('token');
		const error = searchParams.get('error');

		console.log('🔵 [CALLBACK] Chargement, token présent:', !!token, 'error présent:', !!error);

		if (error) {
			console.error('❌ [CALLBACK] Erreur OAuth:', error);
			console.log('🔵 [CALLBACK] Redirection vers /login?error=auth_failed');
			navigate('/login?error=auth_failed');
			return;
		}

		if (token) {
			try {
				// Stocke le token JWT
				console.log('🟢 [CALLBACK] Token JWT reçu');
				localStorage.setItem('access_token', token);
				
				// Décoder le JWT pour extraire l'userId
				const parts = token.split('.');
				if (parts.length !== 3) throw new Error('Invalid JWT');
				
				const decoded = JSON.parse(atob(parts[1]));
				const userId = decoded.userId;
				
				if (!userId) throw new Error('userId not found in token');
				
				console.log('🟢 [CALLBACK] userId extrait du token:', userId);
				localStorage.setItem('user_id', userId);
				
				console.log('🟢 [CALLBACK] Connexion réussie !');
				console.log('🟢 [CALLBACK] Redirection vers /feed');
				
				// Redirige vers le feed
				navigate('/feed');
			} catch (err) {
				console.error('❌ [CALLBACK] Erreur décodage token:', err);
				navigate('/login?error=invalid_token');
			}
		} else {
			console.error('❌ [CALLBACK] Aucun token reçu');
			console.log('🔵 [CALLBACK] Redirection vers /login');
			navigate('/login');
		}
	}, [searchParams, navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p className="text-gray-600">Connexion en cours...</p>
			</div>
		</div>
	);
}
