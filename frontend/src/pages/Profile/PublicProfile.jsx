/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   PublicProfile.jsx                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/12 16:02:01 by eric              #+#    #+#             */
/*   Updated: 2026/03/27 16:41:56 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAvatar } from '../../hooks/useAvatar';
import { profileAPI, followersAPI } from '../../services/api';
import PostCard from '../../components/PostCard';
import { FiX } from 'react-icons/fi';

export default function PublicProfile() {
	const { username } = useParams();
	const { user, toggleLike, deletePost } = useAppContext();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isFollowing, setIsFollowing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('posts');

	// Modale followers/following
	const [modal, setModal] = useState(null); // null | 'followers' | 'following'
	const [modalList, setModalList] = useState([]);
	const [modalLoading, setModalLoading] = useState(false);
	
	// Hook pour charger l'avatar avec JWT - seulement si c'est un filename local
	const isLocalProfileAvatar = profile?.avatar && !profile.avatar.startsWith('http') && !profile.avatar.startsWith('data:');
	const { imageUrl: profileAvatarUrl } = useAvatar(isLocalProfileAvatar ? profile?.avatar : null);

	useEffect(() => {
		const loadProfile = async () => {
			setLoading(true);
			setError(null);
			try {
				console.log('🔍 Chargement du profil:', username);
				const data = await profileAPI.getByUsername(username);
				console.log('📊 Profile complet:', data);
				console.log('📝 Posts retournés:', data.posts);
				console.log('✅ Is registered:', data.isRegistered);
				console.log('🔢 Nombre de posts:', data.posts ? data.posts.length : 0);
				setProfile(data);
				setIsFollowing(data.isFollowing || false);
			} catch (err) {
				console.error('❌ Erreur chargement profil:', err);
				setError('Profil introuvable');
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [username]);

	const handleFollow = async () => {
		if (!user || followLoading) return;
		setFollowLoading(true);

		const wasFollowing = isFollowing;
		setIsFollowing(!wasFollowing);
		setProfile(prev => ({
			...prev,
			_count: {
				...prev._count,
				following: Math.max(0, (prev._count?.following || 0) + (wasFollowing ? -1 : 1)),
			},
		}));

		try {
			if (wasFollowing) {
				await profileAPI.unfollow(username);
			} else {
				await profileAPI.follow(username);
			}
		} catch (err) {
			console.error('❌ Erreur follow/unfollow:', err);
			setIsFollowing(wasFollowing);
			setProfile(prev => ({
				...prev,
				_count: {
					...prev._count,
					following: Math.max(0, (prev._count?.following || 0) + (wasFollowing ? 1 : -1)),
				},
			}));
		} finally {
			setFollowLoading(false);
		}
	};

	const openModal = async (type) => {
		setModal(type);
		setModalLoading(true);
		setModalList([]);
		try {
			const data = type === 'followers'
				? await followersAPI.getFollowers(username)
				: await followersAPI.getFollowing(username);
			// L'API retourne un tableau directement
			setModalList(Array.isArray(data) ? data : (data.followers || data.following || []));
		} catch (err) {
			console.error('❌ Erreur chargement liste:', err);
		} finally {
			setModalLoading(false);
		}
	};

	// Handlers pour like/delete depuis le profil public
	const handleLike = (postId) => {
		toggleLike(postId);
		
		// Mettre aussi à jour le state local du profil
		setProfile(prev => ({
			...prev,
			posts: prev.posts.map(post => {
				if (post.id === postId) {
					return {
						...post,
						isLiked: !post.isLiked,
						_count: {
							...post._count,
							likes: post.isLiked ? (post._count?.likes || 1) - 1 : (post._count?.likes || 0) + 1
						}
					};
				}
				return post;
			})
		}));
	};

	const handleDelete = (postId) => {
		deletePost(postId);
		
		// Supprimer du state local du profil
		setProfile(prev => ({
			...prev,
			posts: prev.posts.filter(post => post.id !== postId)
		}));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="text-center text-gray-500 mt-20">
				{error || 'Profil introuvable'}
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-6">
			{/* Carte profil */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<div className="flex items-start space-x-6">
					<img
						src={profileAvatarUrl || profile.avatar || `https://ui-avatars.com/api/?name=${profile.firstName || profile.username}&background=3b82f6&color=fff`}
						alt={profile.username}
						className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover flex-shrink-0"
					/>
					<div className="flex-1">
						<div className="flex items-center justify-between mb-2">
							<div>
								<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
									{profile.firstName} {profile.lastName}
								</h1>
								<p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
							</div>

							{/* Badge si non inscrit sur 42Hub */}
							{!profile.isRegistered && (
								<span className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
									Profil Intra 42
								</span>
							)}

							{/* Bouton follow — uniquement si inscrit ET pas mon propre profil */}
							{user && user.username !== profile.username && profile.isRegistered && (
								<button
									onClick={handleFollow}
									disabled={followLoading}
									className={`px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
										isFollowing
											? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-500'
											: 'bg-blue-500 text-white hover:bg-blue-600'
									}`}
								>
									{followLoading ? '...' : isFollowing ? 'Ne plus suivre' : 'Suivre'}
								</button>
							)}
						</div>

						{profile.bio && (
							<p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
						)}

						{/* Infos 42 */}
						<div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
							{profile.campus && <span>📍 {profile.campus}</span>}
							{profile.cursus && <span>📚 {profile.cursus}</span>}
							{profile.level && <span>🎯 Niveau {profile.level}</span>}
						</div>

						{/* Stats cliquables */}
						<div className="flex space-x-6">
							<div>
								<span className="font-bold text-gray-900 dark:text-white">
									{profile._count?.posts || 0}
								</span>
								<span className="text-gray-600 dark:text-gray-400 ml-1">posts</span>
							</div>
							<button
								onClick={() => openModal('followers')}
								className="hover:underline text-left"
							>
								<span className="font-bold text-gray-900 dark:text-white">
									{profile._count?.following || 0}
								</span>
								<span className="text-gray-600 dark:text-gray-400 ml-1">followers</span>
							</button>
							<button
								onClick={() => openModal('following')}
								className="hover:underline text-left"
							>
								<span className="font-bold text-gray-900 dark:text-white">
									{profile._count?.followers || 0}
								</span>
								<span className="text-gray-600 dark:text-gray-400 ml-1">following</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Onglets */}
			<div className="mb-6">
				<div className="border-b dark:border-gray-700">
					<button 
						onClick={() => setActiveTab("posts")}
						className={`px-6 py-3 font-semibold ${
							activeTab === "posts" 
								? "text-blue-500 border-b-2 border-blue-500" 
								: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
						}`}
					>
						Posts
					</button>
					<button 
						onClick={() => setActiveTab("media")}
						className={`px-6 py-3 font-semibold ${
							activeTab === "media" 
								? "text-blue-500 border-b-2 border-blue-500" 
								: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
						}`}
					>
						Médias
					</button>
				</div>
			</div>

			{/* Posts de l'utilisateur */}
			{activeTab === "posts" && (
				profile && (profile.posts && profile.posts.length > 0 ? (
					<div className="space-y-4">
						{profile.posts.map(post => {
							// Normaliser la structure du post (API profil vs API feed)
							const normalized = {
								id: post.id,
								content: post.content,
								author: post.user?.username || post.author || profile.username,
								avatar: post.user?.avatar || post.avatar || `https://ui-avatars.com/api/?name=${profile.firstName || profile.username}&background=3b82f6&color=fff`,
								likes: post._count?.likes ?? post.likes ?? 0,
								liked: post.isLiked || post.liked || false,
								date: new Date(post.createdAt).toLocaleDateString('fr-FR'),
								userId: post.userId || post.user?.id,
								createdAt: post.createdAt,
							};
							return <PostCard 
								key={post.id} 
								post={normalized} 
							onLike={() => handleLike(post.id)} 
							onDelete={() => handleDelete(post.id)} 
							/>;
						})}
					</div>
				) : (
					<div className="text-center text-gray-500 dark:text-gray-400 mt-10">
						Aucun post pour le moment.
					</div>
				))
			)}

			{/* Médias de l'utilisateur */}
			{activeTab === "media" && (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div className="col-span-full text-center text-gray-500 dark:text-gray-400">
						Aucun média pour le moment.
					</div>
				</div>
			)}

			{/* Modale followers / following */}
			{modal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
						{/* Header modale */}
						<div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
								{modal === 'followers' ? 'Followers' : 'Following'}
							</h2>
							<button
								onClick={() => setModal(null)}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
							>
								<FiX size={22} />
							</button>
						</div>

						{/* Contenu modale */}
						<div className="overflow-y-auto flex-1 p-4">
							{modalLoading ? (
								<div className="flex justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							) : modalList.length === 0 ? (
								<p className="text-center text-gray-500 dark:text-gray-400 py-8">
									Aucun utilisateur pour le moment.
								</p>
							) : (
								<ul className="space-y-3">
									{modalList.map(u => (
										<li key={u.id}>
											<Link
												to={`/profile/${u.username}`}
												onClick={() => setModal(null)}
												className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
											>
												<img
													src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName || u.username}&background=3b82f6&color=fff`}
													alt={u.username}
													className="w-10 h-10 rounded-full object-cover"
												/>
												<div>
													<p className="font-semibold text-gray-900 dark:text-white">
														{u.firstName} {u.lastName}
													</p>
													<p className="text-sm text-gray-500 dark:text-gray-400">@{u.username}</p>
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}