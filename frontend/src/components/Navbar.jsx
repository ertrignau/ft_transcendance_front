/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Navbar.jsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 13:47:42 by eric              #+#    #+#             */
/*   Updated: 2026/03/27 15:20:56 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
import { FiHome, FiMessageCircle, FiUser, FiSettings, FiLogOut, FiBell, FiSearch } from "react-icons/fi";
import SearchModal from "./SearchModal";

export default function Navbar()
{
	const { t } = useTranslation();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const { getUnreadCount, setUser, setPosts, setNotifications } = useAppContext();
	
	const unreadCount = getUnreadCount();

	const isActive = (path) => location.pathname === path;

	const handleLogout = () => {
		// Supprimer les données du localStorage
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('user');
		localStorage.removeItem('posts');
		localStorage.removeItem('notifications');
		
		// Réinitialiser le contexte
		setUser(null);
		setPosts([]);
		setNotifications([]);
		
		// Rediriger vers la page de login
		navigate('/login');
	};

	const navLinkClasses = (path) => `flex items-center justify-center px-4 py-3 rounded-lg transition ${
		isActive(path)
			? 'bg-blue-600 text-white'
			: 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
	}`;

	return (
		<>
			{/* MOBILE TOP NAVBAR - xs screens only */}
			<nav className="sm:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-40">
				<div className="flex items-center justify-between px-4 py-3 h-16">
					{/* Logo */}
					<Link to="/feed" className="flex items-center justify-center">
						<img 
							src="/42_logo.png" 
							alt="42 Logo" 
							className="w-8 h-8 object-contain dark:invert"
						/>
					</Link>

					{/* Mobile Nav Links - compact horizontal layout */}
					<div className="flex items-center space-x-2 flex-1 justify-center">
						<button
							onClick={() => setIsSearchOpen(true)}
							className="flex items-center justify-center px-2 py-2 rounded-lg transition text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
							title={t('navbar.search')}
						>
							<FiSearch className="text-xl" />
						</button>

						<Link
							to="/feed"
							className={`flex items-center justify-center px-2 py-2 rounded-lg transition ${
								isActive('/feed')
									? 'bg-blue-600 text-white'
									: 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
							}`}
							title={t('navbar.feed')}
						>
							<FiHome className="text-xl" />
						</Link>

						<Link
							to="/messages"
							className={`flex items-center justify-center px-2 py-2 rounded-lg transition ${
								isActive('/messages')
									? 'bg-blue-600 text-white'
									: 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
							}`}
							title={t('navbar.messages')}
						>
							<FiMessageCircle className="text-xl" />
						</Link>

						<Link
							to="/notifications"
							className={`relative flex items-center justify-center px-2 py-2 rounded-lg transition ${
								isActive('/notifications')
									? 'bg-blue-600 text-white'
									: 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
							}`}
							title={t('navbar.notifications')}
						>
							<FiBell className="text-xl" />
							{unreadCount > 0 && (
								<span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
									{unreadCount > 9 ? '9+' : unreadCount}
								</span>
							)}
						</Link>

						<Link
							to="/profile"
							className={`flex items-center justify-center px-2 py-2 rounded-lg transition ${
								isActive('/profile')
									? 'bg-blue-600 text-white'
									: 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
							}`}
							title={t('navbar.profile')}
						>
							<FiUser className="text-xl" />
						</Link>
					</div>

					{/* Logout button */}
					<button
						className="flex items-center justify-center bg-red-500 text-white px-2 py-2 rounded-lg hover:bg-red-600 transition"
						onClick={handleLogout}
						title={t('navbar.logout')}
					>
						<FiLogOut className="text-xl" />
					</button>
				</div>
			</nav>

			{/* DESKTOP SIDEBAR - sm screens and above */}
			<nav className="hidden sm:flex sm:fixed sm:left-0 sm:top-0 sm:h-screen sm:w-20 bg-white dark:bg-gray-800 shadow-lg flex-col transition-colors z-30">
				{/* LOGO */}
				<div className="p-4 border-b dark:border-gray-700 flex justify-center">
					<Link to="/feed" className="flex items-center justify-center">
						<img 
							src="/42_logo.png" 
							alt="42 Logo" 
						className="w-12 h-12 object-contain dark:invert"
					/>
				</Link>
			</div>

			{/* NAV LINKS */}
			<div className="flex-1 py-6 px-4 space-y-2">
					<button
						onClick={() => setIsSearchOpen(true)}
						className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 ${
							isSearchOpen ? 'bg-blue-600 text-white' : ''
						}`}
						title={t('navbar.search')}
					>
						<FiSearch className="text-2xl" />
					</button>

					<Link
						to="/feed"
						className={navLinkClasses('/feed')}
						title={t('navbar.feed')}
					>
						<FiHome className="text-2xl" />
					</Link>

					{/* Lien Messages - Navigation vers la page Messages */}
					<Link
						to="/messages"
						className={navLinkClasses('/messages')}
						title={t('navbar.messages')}
					>
						<FiMessageCircle className="text-2xl" />
					</Link>

					<Link
						to="/notifications"
						className={`relative flex items-center justify-center px-4 py-3 rounded-lg transition ${
							isActive('/notifications')
								? 'bg-blue-600 text-white'
								: 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
						}`}
						title={t('navbar.notifications')}
					>
						<FiBell className="text-2xl" />
						{/* Badge de compteur - affiché seulement s'il y a des notifications */}
						{unreadCount > 0 && (
							<span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
								{unreadCount > 9 ? '9+' : unreadCount}
							</span>
						)}
					</Link>

					<Link
						to="/profile"
						className={navLinkClasses('/profile')}
						title={t('navbar.profile')}
					>
						<FiUser className="text-2xl" />
					</Link>

					<Link
						to="/settings"
						className={navLinkClasses('/settings')}
						title={t('navbar.settings')}
					>
						<FiSettings className="text-2xl" />
					</Link>
				</div>

				{/* LOGOUT BUTTON */}
				<div className="p-4 border-t dark:border-gray-700">
					<button
						className="w-full flex items-center justify-center bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition"
						onClick={handleLogout}
						title={t('navbar.logout')}
					>
						<FiLogOut className="text-2xl" />
					</button>
				</div>
			</nav>

			{/* MODAL DE RECHERCHE */}
			<SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
		</>
	);
}
