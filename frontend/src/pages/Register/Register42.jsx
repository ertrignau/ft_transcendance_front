/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Register42.jsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/16 16:12:07 by eric              #+#    #+#             */
/*   Updated: 2026/03/16 16:47:43 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext  } from "../../context/AppContext";
import { authAPI } from "../../services/api"

export default function Register42() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login } = useAppContext();
	
	const [form, setForm] = useState({
		username:	"",
		email: 		"",
		firstName:	"",
		lastName:	"",
		avatar:		"",
	});
	
	const [errors, setErrors] = useState({})
	const [loading, setLoading] = useState(false);
	const [tempToken, setTempToken] = useState(null);

	// Au chargement, on recupere les donnees 42 et ont pre-remplies
	useEffect(() => {
		const data 		= searchParams.get("data");
		const token		= searchParams.get("tempToken");

		if (!data || !token) {
			navigate("/login");
			return;
		}

		try {
			const parsed = JSON.parse(atob(data));
			setForm({
				username:	parsed.username 	|| "",
				email:		parsed.email 		|| "",
				firstName:	parsed.firstName	|| "",
				lastName:	parsed.lastName		|| "",
				avatar:		parsed.avatar		|| "",
				
			});
			setTempToken(token);
		} catch {
			navigate("/login");
		}
	}, []);

	const validate = () => {
		const newErrors = {};
		
		if (!form.username || form.username.length < 3 || form.username.length > 20)
			newErrors.username = "3 à 20 caractères requis";
		if (!/^[a-zA-Z0-9_-]+$/.test(form.username))	
			newErrors.username = "Uniquement lettres, chiffres, _ et -";
		if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
			newErrors.email = "Email invalide";
		if (!form.firstName)
			newErrors.firstName = "Prénom requis";
		if (!form.lastName)
			newErrors.lastName = "Nom requis";
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		
		setLoading(true);
		try {
			const response = await authAPI.confirm42({
				...form,
				tempToken,
			});
			login(response.user, response.token);
			navigate("/feed");
		} catch (err) {
			setErrors({ global: err.message });
		} finally {
			setLoading(false);
		}
	};

	return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 w-full max-w-md">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <img src="/42_logo.png" alt="42" className="w-10 h-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Finaliser mon inscription
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Vérifie et modifie tes informations si besoin
                        </p>
                    </div>
                </div>

				{/* Avatar preview */}
                {form.avatar && (
                    <div className="flex justify-center mb-6">
                        <img
                            src={form.avatar}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                        />
                    </div>
                )}

                {/* Erreur globale */}
                {errors.global && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {errors.global}
                    </div>
                )}

				<form onSubmit={handleSubmit} className="space-y-4">

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                        )}
                    </div>
					
					{/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                            }`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                    </div>
					
					{/* Prénom / Nom */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Prénom
                            </label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
								className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                    errors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                }`}
                            />
                            {errors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom
                            </label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                    errors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                }`}
                            />
                            {errors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                            )}
                        </div>
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
