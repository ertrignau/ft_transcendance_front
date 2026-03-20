/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   api.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/12 10:35:59 by eric              #+#    #+#             */
/*   Updated: 2026/03/20 13:36:32 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// ===================================
// CONFIG
// ===================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ===================================
// HELPER POUR LES REQUETES AuTH
// ===================================

// Fonction qui centralise toutes les requetes HTTP
// Ajoute automatiquement le tokent JWT et gere les erreurs

const fetchWithAuth = async (endpoint, options = {}) => {
	//Recup le token stocke dans localstoragre
	const token = localStorage.getItem('access_token');

	const headers = {
		'Content-Type' : 'application/json',
		...options.headers,	
	};
	
	// Add le token si possible
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const url = `${API_BASE_URL}${endpoint}`;
	console.log('📡 Appel API:', url);
	console.log('🔑 Token:', token ? 'Présent' : 'Absent');

	// Faire la requete
	const response = await fetch(url, {
		...options,
		headers,
	});
	
	console.log('📥 Réponse status:', response.status);
	
	// Si token perime ou invalide on redirige vers login
	// SAUF si on est déjà sur la page de login/register
	if (response.status === 401) {
		const currentPath = window.location.pathname;
		const publicPaths = ['/login', '/register', '/callback', '/register/42'];
		
		if (!publicPaths.includes(currentPath)) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			window.location.href = '/login';
		}
		throw new Error('Session expirée ou identifiants incorrects');
	}

	// Erreur HTTP
	if (!response.ok) {
		const error = await response.json().catch(() => ({
			detail: 'Une erreur est survenue'
		}));
		console.error('❌ Erreur API:', error);
		throw new Error(error.detail || error.message || error.error || 'Erreur réseau');
	}

	return response.json();
}

// ===================================
// API AUTH
// ===================================

export const authAPI = {
	// Connexion classique -> (login + password)
	login: async (login, password) => {
		return fetchWithAuth('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ login, password }),
		});
	},

	// Connexion OAuth 42
	// Retourne l'URL de redirection pour OAuth 42
	getOAuth42Url: () => {
    	return `${API_BASE_URL}/auth/42`;
	},
	
	// Callback OAuth 42
	// Backend echange le code contre les infos utilisateur
	callback42: async (code) => {
		return fetchWithAuth('/auth/42/callback', {
			method: 'POST',
			body: JSON.stringify({ code }),
		});
	},

	// Inscription avec 42
	confirm42: async (data) => {
		return fetchWithAuth('/auth/42/confirm', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	// Inscription classique via formulaire
	register: async (userData) => {
		return fetchWithAuth('/auth/register', {
			method: 'POST',
			body: JSON.stringify(userData),
		});
	},

	// Deco
	logout: async () => {
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		window.location.href = '/login';
	},

	// Recup USER actuellement connect
	getCurrentUser: async () => {
		return fetchWithAuth('/auth/me');
	},
};

// ===================================
// API PROFIL
// ===================================

export const profileAPI = {
	// Recup un profil par username
	getProfile: async (username) => {
		return fetchWithAuth(`/users/${username}`);
	},
	
	// Recuperer son profil
	getMyProfile: async () => {
		return fetchWithAuth('/users/me');
	},

	// MAJ son profil (bio, name, ...)
	updateProfile: async (profileData) => {
		return fetchWithAuth('/users/me', {
			method: 'PATCH',
			body: JSON.stringify(profileData),
		});
	},

	// Upload avatar (utilise FormData pour formater le fichier)
	uploadAvatar: async (file) => {
		const formData = new FormData();
		formData.append('avatar', file);

		const token = localStorage.getItem('access_token');
		const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
			method: 'POST',
			headers: {
				'Authorization' : `Bearer ${token}`,
			},
			body: formData,
		});
		
		if (!response.ok) {
			throw new Error('Erreur lors de l\'upload');
		}

		return response.json();
	},

	// Recup post d'un USER avec pagination
	getUserPosts: async (username, page = 1, limit = 10) => {
		return fetchWithAuth(`/users/${username}/posts?page=${page}&limit=${limit}`);
	},

	// Recup media utilisateur (images, PDFS)
	getUserMedia: async (username, page = 1, limit = 20) => {
		return fetchWithAuth(`/users/${username}/media?page=${page}&limit=${limit}`);
	},

	// Recup post like par un USER
	getUserLikes: async (username, page = 1, limit = 10) => {
		return fetchWithAuth(`/users/${username}/likes?page=${page}&limit=${limit}`);
	},

	// Recup profil public par username (alias de getProfile)
	getByUsername: async (username) => {
		return fetchWithAuth(`/users/${username}`);
	},

	// Suivre un utilisateur
	follow: async (username) => {
		return fetchWithAuth(`/users/${username}/follow`, {
			method: 'POST',
		});
	},

	// Ne plus suivre un utilisateur
	unfollow: async (username) => {
		return fetchWithAuth(`/users/${username}/follow`, {
			method: 'DELETE',
		});
	},
};

// ===================================
// API USERS
// ===================================

export const usersAPI = {
	// Récupérer tous les utilisateurs (avec pagination)
	getAllUsers: async (page = 1, limit = 10) => {
		return fetchWithAuth(`/users?page=${page}&limit=${limit}`);
	},

	// Récupérer un utilisateur par ID
	getUserById: async (userId) => {
		return fetchWithAuth(`/users/${userId}`);
	},

	// Rechercher des utilisateurs
	searchUsers: async (query) => {
		return fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`);
	},

	// Mettre à jour un utilisateur
	updateUser: async (userId, userData) => {
		return fetchWithAuth(`/users/${userId}`, {
			method: 'PATCH',
			body: JSON.stringify(userData),
		});
	},

	// Récupérer les posts d'un utilisateur
	getUserPosts: async (userId, page = 1, limit = 10) => {
		return fetchWithAuth(`/users/${userId}/posts?page=${page}&limit=${limit}`);
	},

	// Changer le mot de passe
	changePassword: async (currentPassword, newPassword, confirmPassword) => {
		return fetchWithAuth('/auth/change-password', {
			method: 'POST',
			body: JSON.stringify({
				currentPassword,
				newPassword,
				confirmPassword
			}),
		});
	},
};

// ===================================
// API POST
// ===================================

export const postsAPI = {
	// Récupérer tous les posts (feed principal)
	getFeed: async (page = 1, limit = 10) => {
		return fetchWithAuth(`/posts?page=${page}&limit=${limit}`);
	},

	// Créer un nouveau post (avec ou sans média)
	createPost: async (content, media = null) => {
		if (media) {
			// Si on a un média, utiliser FormData
			const formData = new FormData();
			formData.append('content', content);
			formData.append('media', media);

			const token = localStorage.getItem('access_token');
			const response = await fetch(`${API_BASE_URL}/posts`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la création du post');
			}

			return response.json();
		} else {
			// Sinon, utiliser JSON
			return fetchWithAuth('/posts', {
				method: 'POST',
				body: JSON.stringify({ content }),
			});
		}
	},

	// Supprimer un post (seulement si c'est le sien)
	deletePost: async (postId) => {
		return fetchWithAuth(`/posts/${postId}`, {
			method: 'DELETE',
		});
	},

	// Éditer un post (seulement si c'est le sien)
	updatePost: async (postId, content) => {
		return fetchWithAuth(`/posts/${postId}`, {
			method: 'PATCH',
			body: JSON.stringify({ content }),
		});
	},

	// Liker un post
	likePost: async (postId) => {
		return fetchWithAuth(`/posts/${postId}/like`, {
			method: 'POST',
		});
	},

	// Retirer son like d'un post
	unlikePost: async (postId) => {
        return fetchWithAuth(`/posts/${postId}/like`, {
            method: 'DELETE',
        });
    },
};

// ===================================
// API FOLLOWERS
// ===================================

export const followersAPI = {
	// Récupérer les followers d'un utilisateur (qui le suit)
	getFollowers: async (username) => {
		return fetchWithAuth(`/users/${username}/followers`);
	},

	// Récupérer les abonnements d'un utilisateur (qui il suit)
	getFollowing: async (username) => {
		return fetchWithAuth(`/users/${username}/following`);
	},

	// Follow un USER
	follow: async (username) => {
		return fetchWithAuth(`/users/${username}/follow`, {
			method: 'POST',
		});
	},

    // Unfollow un USER
	unfollow: async (username) => {
		return fetchWithAuth(`/users/${username}/follow`, {
			method: 'DELETE',
		});
	},
};

// ===================================
// API NOTIF
// ===================================

export const notificationsAPI = {
	// Récupérer toutes les notifications
	getNotifications: async () => {
		return fetchWithAuth('/notifications');
	},

	// Marquer une notification comme lue
	markAsRead: async (notificationId) => {
		return fetchWithAuth(`/notifications/${notificationId}/read`, {
			method: 'PATCH',
		});
	},

	// Marquer toutes les notifications comme lues
	markAllAsRead: async () => {
		return fetchWithAuth('/notifications/read-all', {
			method: 'PATCH',
		});
	},
};

// ===================================
// API MSGS
// ===================================

export const messagesAPI = {
	 // Récupérer toutes les conversations
	getConversations: async () => {
		return fetchWithAuth('/messages/conversations');
	},

	// Récupérer les messages d'une conversation
	getMessages: async (conversationId) => {
		return fetchWithAuth(`/messages/conversations/${conversationId}`);
	},

	// Envoyer un message
	sendMessage: async (userId, content) => {
		return fetchWithAuth('/messages', {
			method: 'POST',
			body: JSON.stringify({ recipient_id: userId, content }),
		});
	},
};

// ===================================
// API COMMENTAIRES
// ===================================

export const commentsAPI = {
	// Récupérer les commentaires d'un post
	getCommentsByPost: async (postId, page = 1, limit = 20) => {
		return fetchWithAuth(`/comments/post/${postId}?page=${page}&limit=${limit}`);
	},

	// Créer un commentaire
	createComment: async (postId, content) => {
		return fetchWithAuth(`/comments/post/${postId}`, {
			method: 'POST',
			body: JSON.stringify({ content }),
		});
	},

	// Modifier un commentaire
	updateComment: async (commentId, content) => {
		return fetchWithAuth(`/comments/${commentId}`, {
			method: 'PATCH',
			body: JSON.stringify({ content }),
		});
	},

	// Supprimer un commentaire
	deleteComment: async (commentId) => {
		return fetchWithAuth(`/comments/${commentId}`, {
			method: 'DELETE',
		});
	},
};

// ===================================
// API RECHERCHE
// ===================================

export const searchAPI = {
	// Rechercher des utilisateurs 42 (via API intra)
	search42Users: async (query) => {
		return fetchWithAuth(`/search/42users?query=${encodeURIComponent(query)}`);
	},

	// Rechercher des utilisateurs inscrits sur 42Hub (BDD locale)
	searchLocalUsers: async (query) => {
		return fetchWithAuth(`/search/users?query=${encodeURIComponent(query)}`);
	},
};

export default {
	auth: authAPI,
	profile: profileAPI,
	posts: postsAPI,
	followers: followersAPI,
	notifications: notificationsAPI,
	messages: messagesAPI,
	comments: commentsAPI,
	search: searchAPI,
	users: usersAPI,
};