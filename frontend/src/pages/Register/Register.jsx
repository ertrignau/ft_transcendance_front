/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Register.jsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 13:11:40 by eric              #+#    #+#             */
/*   Updated: 2026/04/03 14:35:56 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button } from "../../utils/index";
import { validateUsername, validateEmail, validatePassword } from "../../utils/validation";
import { authAPI } from "../../services/api";
import { useAppContext } from "../../context/AppContext";

export default function Register()
{
	const [username, setUsername] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [tosAccepted, setTosAccepted] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { setUser, setTheme } = useAppContext();

	// Handle OAuth 42 registration
	const handleRegister42OAuth = async () => {
		try {
			console.log('🟠 [REGISTER] Clic sur "S\'inscrire avec 42"');
			setLoading(true);
			console.log('🟠 [REGISTER] Appel authAPI.getRegister42OAuth()');
			const authUrl = await authAPI.getRegister42OAuth();
			console.log('🟠 [REGISTER] Redirection vers:', authUrl);
			window.location.href = authUrl;  // Redirect to 42 OAuth
		} catch (err) {
			console.error('❌ [REGISTER] Erreur OAuth 42:', err);
			setError('Erreur : impossible de rediriger vers 42 OAuth');
			setLoading(false);
		}
	};

	const handleSubmit = async (e) =>
	{
		e.preventDefault();
		setError("");
		
		// Validation username
		if (!validateUsername(username)) {
			setError("Username invalide (3-12 caractères, alphanumériques avec - ou ')");
			return;
		}

		// Validation firstName
		if (!firstName || firstName.length < 2) {
			setError("Prénom invalide (minimum 2 caractères)");
			return;
		}

		// Validation lastName
		if (!lastName || lastName.length < 2) {
			setError("Nom invalide (minimum 2 caractères)");
			return;
		}

		// Validation email
		if (!validateEmail(email)) {
			setError("Email invalide");
			return;
		}

		// Validation password
		if (!validatePassword(password)) {
			setError("Password invalide (3-10 caractères, pas d'espaces)");
			return;
		}

		if (password !== confirmPassword)
		{
			setError("Les mots de passe ne correspondent pas !");
			return ;
		}

		if (!tosAccepted)
		{
			setError("Vous devez accepter les conditions d'utilisation");
			return ;
		}

		setLoading(true);

		try {
			const response = await authAPI.register({
				username,
				firstName,
				lastName,
				email,
				password,
			});

			// Register returns 201 with no user data, so we just store empty token
			// The user will need to login after registration
			console.log('✅ Inscription réussie, redirection vers login');
			
			// Afficher un message de succes et rediriger
			navigate('/login', { state: { message: 'Inscription réussie! Veuillez vous connecter.' } });
		} catch (err) {
			setError(err.message || "Erreur lors de l'inscription");
			console.error("Register error:", err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96"
			>
				<h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
					Créer un compte
				</h1>

				{error && (
					<div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
						{error}
					</div>
				)}

				<Input
					label="Nom d'utilisateur"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="Votre pseudo"
					required
					disabled={loading}
					hint="3-12 caractères, alphanumériques avec - ou '"
				/>
				<Input
					label="Prénom"
					type="text"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					placeholder="Votre prénom"
					required
					disabled={loading}
					hint="Minimum 2 caractères"
				/>
				<Input
					label="Nom"
					type="text"
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					placeholder="Votre nom"
					required
					disabled={loading}
					hint="Minimum 2 caractères"
				/>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="email@example.com"
					required
					disabled={loading}
					hint="Format: user@domain.com"
				/>
				<Input
					label="Mot de passe"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					required
					disabled={loading}
					hint="3-10 caractères, pas d'espaces"
				/>
				<Input
					label="Confirmer le mot de passe"
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					placeholder="••••••••"
					required
					disabled={loading}
					hint="Doit correspondre au mot de passe ci-dessus"
				/>

				{/* TERMS OF SERVICE CHECKBOX */}
				<div className="mb-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={tosAccepted}
							onChange={(e) => setTosAccepted(e.target.checked)}
							disabled={loading}
							className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600"
						/>
						<span className="text-sm text-gray-700 dark:text-gray-300">
							J'accepte les{" "}
							<Link 
								to="/terms" 
								target="_blank"
								className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
							>
								conditions d'utilisation
							</Link>
						</span>
					</label>
				</div>

				<Button type="submit" variant="green" disabled={loading || !tosAccepted}>
					{loading ? "Inscription..." : "S'inscrire"}
				</Button>

				{/* SEPARATEUR */}
				<div className="relative my-6">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">ou</span>
					</div>
				</div>

				{/* BOUTON 42 OAUTH */}
			<button
				type="button"
				onClick={handleRegister42OAuth}
				disabled={loading}
				className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? 'Redirection...' : 'S\'inscrire avec'}
				<img 
					src="/42_logo.png" 
					alt="42 Logo" 
					className="w-6 h-6 object-contain invert brightness-0 invert dark:invert"
				/>
			</button>
				<p className="text-center text-sm text-gray-600 dark:text-gray-400">
					Déjà un compte ?{" "}
					<Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
						Se Connecter
					</Link>
				</p>
			</form>
		</div>
	);
}