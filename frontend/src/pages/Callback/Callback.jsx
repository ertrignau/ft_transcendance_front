/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Callback.jsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/12 11:48:31 by eric              #+#    #+#             */
/*   Updated: 2026/04/02 13:37:59 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAppContext } from "../../context/AppContext";

export default function Callback() 
{
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useAppContext();

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError("Authentification annulée ou refusée");
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        if (!code) {
            setError("Code d'authentification manquant");
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        // Envoyer le code au backend
        const authenticate = async () => {
            try {
                console.log("🔐 Callback - Début authentification avec code:", code);
                
                const response = await authAPI.handleAuth42Callback(code);
                console.log("✅ Callback - Response reçue:", response);
                
                // Stocker les tokens dans localStorage
                localStorage.setItem('access_token', response.access_token || response.token);
                localStorage.setItem('user_id', response.id || response.userId);
                if (response.refresh_token) {
                    localStorage.setItem('refresh_token', response.refresh_token);
                }

                // Récupérer les infos de l'utilisateur connecté
                console.log("👤 Callback - Récupération des infos utilisateur...");
                const userData = await authAPI.getCurrentUser();
                console.log("✅ Callback - Utilisateur reçu:", userData);
                
                setUser(userData);

                // Rediriger vers le feed
                navigate('/feed');
            } catch (err) {
                console.error("❌ Callback error:", err);
                setError(err.message || "Erreur lors de l'authentification");
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        authenticate();
    }, [searchParams, navigate, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
                {error ? (
                    <>
                        <div className="text-red-500 text-5xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
                    </>
                ) : (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connexion en cours...</h2>
                        <p className="text-gray-600">Veuillez patienter</p>
                    </>
                )}
            </div>
        </div>
    );
}
