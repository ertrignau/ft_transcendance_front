/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   api.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/28 10:35:58 by eric              #+#    #+#             */
/*   Updated: 2026/04/01 14:12:35 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// ===================================
// CONFIG
// ===================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ===================================
// HELPER POUR LES REQUETES AUTH
// ===================================

const fetchWithAuth = async (endpoint, options = {}) => {
	const token = localStorage.getItem('access_token');

	const headers = {
		...options.headers,	
	};
	
	// Ne pas forcer Content-Type si FormData
	if (!(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

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
			error: 'Une erreur est survenue'
		}));
		console.error('❌ Erreur API:', error);
		const err = new Error(error.error || error.message || error.detail || 'Erreur réseau');
		err.status = response.status;
		throw err;
	}

	return response.json();
}

// ===================================
// API AUTH
// ===================================

export const authAPI = {
	login: async (email, password) => {
		return fetchWithAuth('/auth/', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		});
	},

	register: async (username, firstName, lastName, email, password, avatarFile = null) => {
		const formData = new FormData();
		formData.append('user', JSON.stringify({
			username, firstName, lastName, email, password, is42: false,
		}));
		if (avatarFile) formData.append('avatar', avatarFile);

		const token = localStorage.getItem('access_token');
		const response = await fetch(`${API_BASE_URL}/register`, {
			method: 'POST',
			headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Erreur lors de l\'inscription');
		}
		return response.json();
	},

	getRegister42Data: async () => {
		return fetchWithAuth('/register/42');
	},

	register42: async (username, firstName, lastName, email, avatarUrl) => {
		const formData = new FormData();
		formData.append('user', JSON.stringify({
			username, firstName, lastName, email, avatar: avatarUrl, is42: true,
		}));

		const token = localStorage.getItem('access_token');
		const response = await fetch(`${API_BASE_URL}/register`, {
			method: 'POST',
			headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Erreur lors de l\'inscription 42');
		}
		return response.json();
	},

	getOAuth42Url: () => `${API_BASE_URL}/auth/42`,

	handleAuth42Callback: async (code) => {
		return fetchWithAuth(`/auth/callback?code=${code}`);
	},

	changePassword: async (password, newPassword) => {
		return fetchWithAuth('/auth/', {
			method: 'PUT',
			body: JSON.stringify({ password, newPassword }),
		});
	},

	logout: async () => {
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		window.location.href = '/login';
	},
};

// ===================================
// API USER
// ===================================

export const userAPI = {
	getAllUsers: async () => {
		return fetchWithAuth('/user');
	},

	getUser: async (userId) => {
		return fetchWithAuth(`/user/${userId}`);
	},

	updateProfile: async (userId, userData, avatarFile = null) => {
		const formData = new FormData();
		formData.append('user', JSON.stringify(userData));
		if (avatarFile) formData.append('avatar', avatarFile);

		const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Erreur lors de la mise à jour');
		}
		return response.json();
	},

	restore42Profile: async (userId) => {
		return fetchWithAuth(`/user/data42/${userId}`, { method: 'PUT' });
	},

	deleteAccount: async (userId) => {
		return fetchWithAuth(`/user/${userId}`, { method: 'DELETE' });
	},

	search42Users: async (login) => {
		return fetchWithAuth(`/search42Users/${encodeURIComponent(login)}`);
	},
};

// ===================================
// API POSTS
// ===================================

export const postsAPI = {
	getFeed: async (limit = 10) => {
		return fetchWithAuth(`/post?limit=${limit}`);
	},

	loadMorePosts: async (date, limit = 10) => {
		return fetchWithAuth(`/post?date=${encodeURIComponent(date)}&limit=${limit}`);
	},

	createPost: async (content, mediaFile = null) => {
		const formData = new FormData();
		formData.append('content', content);
		if (mediaFile) formData.append('media', mediaFile);

		const response = await fetch(`${API_BASE_URL}/post`, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Erreur lors de la création du post');
		}
		return response.json();
	},

	getPost: async (postId) => {
		return fetchWithAuth(`/post/${postId}`);
	},

	updatePost: async (postId, content, mediaFile = null) => {
		const formData = new FormData();
		formData.append('content', content);
		if (mediaFile) formData.append('media', mediaFile);

		const response = await fetch(`${API_BASE_URL}/post/${postId}`, {
			method: 'PUT',
			headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Erreur lors de la modification');
		}
		return response.json();
	},

	deletePost: async (postId) => {
		return fetchWithAuth(`/post/${postId}`, { method: 'DELETE' });
	},

	getUserPosts: async (userId, limit = 10, date = null) => {
		let url = `/post/user/${userId}?limit=${limit}`;
		if (date) url += `&date=${encodeURIComponent(date)}`;
		return fetchWithAuth(url);
	},

	loadMoreUserPosts: async (userId, date, limit = 10) => {
		return fetchWithAuth(`/post/user/${userId}?date=${encodeURIComponent(date)}&limit=${limit}`);
	},

	getCommentedPosts: async (userId, limit = 10, date = null) => {
		let url = `/post/commented/${userId}?limit=${limit}`;
		if (date) url += `&date=${encodeURIComponent(date)}`;
		return fetchWithAuth(url);
	},

	getLikedPosts: async (userId, limit = 10, date = null) => {
		let url = `/post/liked/${userId}?limit=${limit}`;
		if (date) url += `&date=${encodeURIComponent(date)}`;
		return fetchWithAuth(url);
	},

	getUserMedia: async (userId) => {
		return fetchWithAuth(`/media/user/${userId}`);
	},
};

// ===================================
// API LIKES
// ===================================

export const likesAPI = {
	likePost: async (postId) => {
		return fetchWithAuth('/like', {
			method: 'POST',
			body: JSON.stringify({ postId }),
		});
	},

	unlikePost: async (postId) => {
		return fetchWithAuth(`/like/post/${postId}`, { method: 'DELETE' });
	},

	getLikesForPost: async (postId) => {
		return fetchWithAuth(`/like/post/${postId}`);
	},
};

// ===================================
// API COMMENTAIRES
// ===================================

export const commentsAPI = {
	getCommentsByPost: async (postId, limit = 20, date = null) => {
		let url = `/comment/post/${postId}?limit=${limit}`;
		if (date) url += `&date=${encodeURIComponent(date)}`;
		return fetchWithAuth(url);
	},

	loadMoreComments: async (postId, date, limit = 20) => {
		return fetchWithAuth(`/comment/post/${postId}?date=${encodeURIComponent(date)}&limit=${limit}`);
	},

	createComment: async (postId, content) => {
		return fetchWithAuth(`/comment/post/${postId}`, {
			method: 'POST',
			body: JSON.stringify({ content }),
		});
	},

	updateComment: async (commentId, content) => {
		return fetchWithAuth(`/comment/${commentId}`, {
			method: 'PUT',
			body: JSON.stringify({ content }),
		});
	},

	deleteComment: async (commentId) => {
		return fetchWithAuth(`/comment/${commentId}`, { method: 'DELETE' });
	},
};

// ===================================
// API SOCIAL
// ===================================

export const socialAPI = {
	getFollowers: async () => {
		return fetchWithAuth('/social/followers');
	},

	getFriends: async () => {
		return fetchWithAuth('/social/friends');
	},

	followUser: async (userId) => {
		return fetchWithAuth(`/social/user/${userId}`, { method: 'POST' });
	},

	unfollowUser: async (userId) => {
		return fetchWithAuth(`/social/user/${userId}`, { method: 'DELETE' });
	},
};

// ===================================
// API SEARCH
// ===================================

export const searchAPI = {
	search42Users: async (query) => userAPI.search42Users(query),
	searchUsers: async (query) => userAPI.search42Users(query),
};

// ===================================
// API UPLOADS
// ===================================

export const uploadAPI = {
	uploadAvatar: async (avatarBase64) => {
		throw new Error('Uploads pas gérés directement; utilise updateProfile avec File');
	},

	getImage: async (filename) => {
		const token = localStorage.getItem('access_token');
		if (!token) throw new Error('Token JWT manquant');

		const url = `${API_BASE_URL}/uploads/${filename}`;
		const response = await fetch(url, {
			headers: { 'Authorization': `Bearer ${token}` },
		});

		if (!response.ok) throw new Error(`Erreur récupération image: ${response.status}`);
		return response.blob();
	},

	getImageUrl: async (filename) => {
		if (!filename) return null;
		try {
			const blob = await uploadAPI.getImage(filename);
			return URL.createObjectURL(blob);
		} catch (error) {
			console.error('Erreur récupération image:', error);
			return null;
		}
	},
};

// ===================================
// LEGACY EXPORTS (compatibilité)
// ===================================

export const profileAPI = {
	getProfile: async (userId) => userAPI.getUser(userId),
	getMyProfile: async () => {
		const userId = localStorage.getItem('user_id');
		return userAPI.getUser(userId);
	},
	updateProfile: async (data) => {
		const userId = localStorage.getItem('user_id');
		return userAPI.updateProfile(userId, data);
	},
};

export const usersAPI = userAPI;
export const followersAPI = socialAPI;

export const notificationsAPI = {
	getNotifications: async () => { throw new Error('Notifications non implémentées dans le BFF'); },
	markAsRead: async (notificationId) => { throw new Error('Notifications non implémentées dans le BFF'); },
	markAllAsRead: async () => { throw new Error('Notifications non implémentées dans le BFF'); },
};

export const messagesAPI = {
	getConversations: async () => { throw new Error('Messages non implémentés dans le BFF'); },
	getMessages: async (conversationId) => { throw new Error('Messages non implémentés dans le BFF'); },
	sendMessage: async (userId, content) => { throw new Error('Messages non implémentés dans le BFF'); },
};

export default {
	authAPI,
	userAPI,
	postsAPI,
	likesAPI,
	commentsAPI,
	socialAPI,
	searchAPI,
	profileAPI,
	usersAPI,
	followersAPI,
	notificationsAPI,
	messagesAPI,
	uploadAPI,
};
