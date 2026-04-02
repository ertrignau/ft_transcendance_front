/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Login.jsx                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 13:17:00 by eric              #+#    #+#             */
/*   Updated: 2026/04/01 16:35:52 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input, Button } from "../../utils";
import { validateEmail, validatePassword } from "../../utils/validation";
import { authAPI } from "../../services/api";
import { useAppContext } from "../../context/AppContext";

export default function Login() 
{
	const [login, setLogin] = useState(""); // Peut être un email ou username
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { setUser, setTheme } = useAppContext();
	const [searchParams] = useSearchParams();

	// Vérifier le paramètre d'erreur depuis OAuth 42
	useEffect(() => {
		const errorParam = searchParams.get('error');
		if (errorParam === 'login_cancelled') {
			setError('Connexion annulée. Veuillez réessayer.');
		}
	}, [searchParams]);

	const handleSubmit = async (e) => 
	{
		e.preventDefault();
		setError("");

		// Validation email ou username
		if (!validateEmail(login) && login.length < 3) {
			setError("Email ou username invalide");
			return;
		}

		// Validation password
		if (!validatePassword(password)) {
			setError("Password invalide (3-10 caractères, pas d'espaces)");
			return;
		}

		setLoading(true);

		try {
			const response = await authAPI.login(login, password);
			
			// Stocker les tokens
			localStorage.setItem('access_token', response.access_token);
			localStorage.setItem('user_id', response.id || response.userId);
			console.log('📝 user_id save:', response.id || response.userId);
			if (response.refresh_token) {
				localStorage.setItem('refresh_token', response.refresh_token);
			}

			// Charger et stocker l'utilisateur dans le contexte
			const userData = await authAPI.getCurrentUser();
			setUser(userData);
			
			// Appliquer le theme du user
			if (userData.theme) {
				setTheme(userData.theme);
			}

			// Rediriger vers le feed
			navigate('/feed');
		} catch (err) {
			setError(err.message || "Erreur lors de la connexion");
			console.error("Login error:", err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-80"
			>
				<h1 className="text-2xl font-bold text-center mb-6">
    				<span className="text-black dark:text-white">42</span>
    				<span className="text-blue-600">Hub</span>
				</h1>

				{error && (
					<div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
						{error}
					</div>
				)}

				<Input
					label="Login"
					type="text"
					value={login}
					onChange={(e) => setLogin(e.target.value)}
					placeholder="login42"
					required
					disabled={loading}
				/>

			<Input
				label="Mot de passe"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="••••••••"
				required
				disabled={loading}
			/>

			<div className="relative flex justify-center text-sm mt-4">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">ou</span>
				</div>
			</div>

				{/* BOUTON 42 OAUTH */}
				<a
					href={authAPI.getOAuth42Url()}
					className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition mb-4 no-underline"
				>
					Se connecter avec
					<img 
						src="/42_logo.png" 
						alt="42 Logo" 
						className="w-6 h-6 object-contain invert brightness-0 invert dark:invert"
					/>
				</a>
				
				<p className="text-center text-sm text-gray-600 dark:text-gray-400">
					Pas encore de compte ?{" "}
					<Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
						S'inscrire
					</Link>
				</p>
			</form>
		</div>
	);
}
