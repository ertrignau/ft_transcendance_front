/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Followers.jsx                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/09 14:20:44 by eric              #+#    #+#             */
/*   Updated: 2026/03/12 17:45:01 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiUserPlus, FiUserCheck, FiUserX, FiSearch } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import { followersAPI } from "../../services/api";
import { useAppContext } from "../../context/AppContext";

export default function Followers() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "followers");
	const [searchQuery, setSearchQuery] = useState("");
	const [followers, setFollowers] = useState([]);
	const [following, setFollowing] = useState([]);
	const [loading, setLoading] = useState(true);
	const { user } = useAppContext();

	// Charger les followers et following au démarrage
	useEffect(() => {
		if (user) {
			loadFollowers();
			loadFollowing();
		}
	}, [user]);

	// Synchroniser l'onglet avec le paramètre URL
	useEffect(() => {
		const tab = searchParams.get('tab');
		if (tab === 'followers' || tab === 'following') {
			setActiveTab(tab);
		}
	}, [searchParams]);

	const loadFollowers = async () => {
		try {
			setLoading(true);
			const data = await followersAPI.getFollowers(user.username);
			setFollowers(Array.isArray(data) ? data : (data.followers || []));
		} catch (error) {
			console.error(t('followers.errorLoadingFollowers'), error);
		} finally {
			setLoading(false);
		}
	};

	const loadFollowing = async () => {
		try {
			const data = await followersAPI.getFollowing(user.username);
			setFollowing(Array.isArray(data) ? data : (data.following || []));
		} catch (error) {
			console.error(t('followers.errorLoadingFollowing'), error);
		}
	};
	
	const handleFollow = async (username) => {
		try {
			await followersAPI.follow(username);
			// Recharger les listes
			loadFollowers();
			loadFollowing();
		} catch (error) {
			console.error(t('followers.errorFollow'), error);
			alert(t('followers.errorFollow'));
		}
	};
	
	const handleUnfollow = async (username) => {
		try {
			await followersAPI.unfollow(username);
			// Recharger les listes
			loadFollowers();
			loadFollowing();
		} catch (error) {
			console.error(t('followers.errorUnfollow'), error);
			alert(t('followers.errorUnfollow'));
		}
	};

	const currentList = activeTab === "followers" ? followers : following;
	const filteredList = currentList.filter(user =>
		(user.firstName + ' ' + user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
		user.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
					<p className="text-gray-600 dark:text-gray-400">{t('followers.loading')}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto">
            {/* Header avec stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
                <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{t('followers.network')}</h1>
                <div className="flex space-x-8">
                    <div>
                        <p className="text-3xl font-bold text-blue-600">{followers.length}</p>
                        <p className="text-gray-600 dark:text-gray-400">{t('followers.followers')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-blue-600">{following.length}</p>
                        <p className="text-gray-600 dark:text-gray-400">{t('followers.following')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-green-600">
						{followers.filter(f => f.isFollowingBack).length}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">{t('followers.mutual')}</p>
                    </div>
                </div>
            </div>
			
			 {/* Onglets */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
                <div className="border-b dark:border-gray-700">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("followers")}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === "followers"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            {t('followers.followers')} ({followers.length})
                        </button>
						<button
                            onClick={() => setActiveTab("following")}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === "following"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            {t('followers.following')} ({following.length})
                        </button>
                    </div>
                </div>

				 {/* Barre de recherche */}
                <div className="p-4 border-b dark:border-gray-700">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('followers.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                </div>
				
				 {/* Liste des utilisateurs */}
                <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                    {filteredList.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            {searchQuery 
                                ? t('followers.noResults')
                                : activeTab === "followers"
                                    ? t('followers.noFollowersYet')
                                    : t('followers.notFollowingAnyone')
                            }
                        </div>
					) : (
                        filteredList.map(user => (
                            <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Avatar */}
                                        <Link to={`/profile/${user.username}`}>
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=3b82f6&color=fff`}
                                                alt={user.firstName}
                                                className="w-14 h-14 rounded-full hover:opacity-80 transition"
                                            />
                                        </Link>

										{/* Info utilisateur */}
                                        <div className="flex-1 min-w-0">
                                            <Link 
                                                to={`/profile/${user.username}`}
                                                className="hover:underline"
                                            >
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {user.firstName} {user.lastName}
                                                    {activeTab === "followers" && user.isFollowingBack && (
                                                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                            {t('followers.mutual')}
                                                        </span>
                                                    )}
                                                    {activeTab === "following" && user.followsMe && (
                                                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                            {t('followers.followsYou')}
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                                            </Link>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{user.bio || t('followers.noBio')}</p>
                                        </div>
                                    </div>

									{/* Boutons d'action */}
                                    <div className="flex space-x-2">
                                        {activeTab === "followers" ? (
                                            <>
                                                {!user.isFollowingBack ? (
                                                    <button
                                                        onClick={() => handleFollow(user.username)}
                                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                                    >
                                                        <FiUserPlus />
                                                        <span>{t('followers.follow')}</span>
                                                    </button>
                                                ) : (
                                                    <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-default">
                                                        <FiUserCheck />
                                                        <span>{t('followers.following_label')}</span>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
											<button
                                                onClick={() => handleUnfollow(user.username)}
                                                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                <FiUserX />
                                                <span>{t('followers.unfollow')}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
	);
}
