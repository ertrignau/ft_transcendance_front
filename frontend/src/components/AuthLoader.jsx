/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   AuthLoader.jsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/04/01 16:23:52 by eric              #+#    #+#             */
/*   Updated: 2026/04/01 16:23:55 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { authAPI } from '../services/api';

export default function AuthLoader({ children }) {
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token');
            
            // Si pas de token et pas sur une page publique, rediriger vers login
            const publicPaths = ['/login', '/register', '/callback', '/register/42'];
            if (!token && !publicPaths.includes(location.pathname)) {
                navigate('/login');
                setLoading(false);
                return;
            }

            // Si on a un token mais pas d'utilisateur dans le contexte, charger les données
            if (token && !user) {
                try {
                    const userData = await authAPI.getCurrentUser();
                    setUser(userData);
                } catch (error) {
                    console.error('Erreur chargement utilisateur:', error);
                    // Token invalide, rediriger vers login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
                }
            }

            setLoading(false);
        };

        loadUser();
    }, [location.pathname, user, setUser, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return children;
}
