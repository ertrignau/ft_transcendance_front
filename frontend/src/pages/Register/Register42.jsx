/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Register42.jsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/16 16:12:07 by eric              #+#    #+#             */
/*   Updated: 2026/03/27 17:22:42 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext  } from "../../context/AppContext";
import { authAPI, uploadAPI } from "../../services/api"

export default function Register42() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login, setTheme } = useAppContext();
	
	const [form, setForm] = useState({
		username:	"",
		email: 		"",
		firstName:	"",
		lastName:	"",
		avatar:		"",
		password:	"",
		confirmPassword: "",
		campus:		"",
		cursus:		"",
		level:		0,
	});
	
	const [errors, setErrors] = useState({})
	const [loading, setLoading] = useState(false);
	const [tempToken, setTempToken] = useState(null);

	// Au chargement, on decodes le JWT tempToken pour récupérer les données API 42
	useEffect(() => {
		const token = searchParams.get("tempToken");

		if (!token) {
			navigate("/login");
			return;
		}

		try {
			// Décoder le JWT (sans vérifier la signature, juste pour lire les données)
			const parts = token.split('.');
			if (parts.length !== 3) throw new Error('Invalid JWT');
			
			const decoded = JSON.parse(atob(parts[1]));
			const { username, email, firstName, lastName, avatar, campus, cursus, level, intraId } = decoded;
			
			if (!username || !email || !firstName || !lastName || !intraId)
				throw new Error('Missing required data in token');
			
			setForm({
				username:	username || "",
				email:		email || "",
				firstName:	firstName || "",
				lastName:	lastName || "",
				avatar:		avatar || "",
				password:	"",
				confirmPassword: "",
				campus:		campus || "",
				cursus:		cursus || "",
				level:		level || 0,
			});
			setTempToken(token);
		} catch (err) {
			console.error('Erreur décodage token:', err);
			navigate("/login");
		}
	}, [searchParams, navigate]);

	const validate = () => {
		const newErrors = {};
		
		// Vérifie que les deux mots de passe sont identiques
		if (form.password !== form.confirmPassword) {
			newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
		}

		// (Tu peux ajouter d'autres validations ici si besoin, ex: longueur minimale, regex, etc)

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // ⚠️ Envoyer ONLY password et confirmPassword (les données API 42 viennent du backend)
            const response = await authAPI.confirm42({
                password: form.password,
                confirmPassword: form.confirmPassword,
                tempToken,
            });

            // Stocker le token JWT et l'utilisateur
            localStorage.setItem('access_token', response.token);
            if (response.user) {
                setUser(response.user);
            }

            // Appliquer le theme du user
            if (response.user && response.user.theme) {
                setTheme(response.user.theme);
            }

            // Upload avatar custom si l'utilisateur en a changé
            if (form.avatar && form.avatar.startsWith('data:image/')) {
                try {
                    await uploadAPI.uploadAvatar(form.avatar);
                    console.log('✅ Avatar uploadé avec succès');
                } catch (uploadErr) {
                    console.error('❌ Erreur upload avatar:', uploadErr);
                    // On continue quand même vers le feed même si l'upload échoue
                    setErrors({ global: 'Avatar non uploadé mais compte créé: ' + uploadErr.message });
                    // Continuer après 2 secondes
                    setTimeout(() => navigate("/feed"), 2000);
                    return;
                }
            }

            navigate("/feed");
        } catch (err) {
            // Si compte déjà existant → rediriger vers login
            if (err.status === 409) {
                navigate("/login?error=account_exists");
                return;
            }
            setErrors({ global: err.message });
        } finally {
            setLoading(false);
        }
	};

	const handleAvatarChange = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setForm({ ...form, avatar: event.target.result });
			};
			reader.readAsDataURL(file);
		}
	};

	return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 w-full max-w-md">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <img src="/42_logo.png" alt="42" className="w-10 h-10 dark:invert" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Finaliser mon inscription
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Les données 42 sont verrouillées. Définis ton mot de passe pour continuer.
                        </p>
                    </div>
                </div>

				{/* Avatar preview */}
                {form.avatar && (
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <img
                            src={form.avatar}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                        />
                        <label className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                            Changer l'avatar
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Erreur globale */}
                {errors.global && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {errors.global}
                    </div>
                )}

				<form onSubmit={handleSubmit} className="space-y-4">

                    {/* Username (API 42 - Disabled) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Nom d'utilisateur (42)
                        </label>
                        <input
                            type="text"
                            value={form.username}
                            disabled={true}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
                        />
                    </div>
					
					{/* Email (API 42 - Disabled) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email (42)
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            disabled={true}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
                        />
                    </div>
					
{/* Prénom / Nom (API 42 - Disabled) */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Prénom (42)
                            </label>
                            <input
                                type="text"
                                value={form.firstName}
                                disabled={true}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Nom (42)
                            </label>
                            <input
                                type="text"
                                value={form.lastName}
                                disabled={true}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-60"
                            />
                        </div>
					</div>

                    {/* Mot de passe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                            placeholder="••••••••"
                            required
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirmer mot de passe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                            placeholder="••••••••"
                            required
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-2"
                    >
                        {loading ? "Création du compte..." : "Confirmer mon compte"}
                    </button>
                </form>
            </div>
        </div>
    );
}
