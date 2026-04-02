/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   AppContext.jsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/17 14:12:55 by eric              #+#    #+#             */
/*   Updated: 2026/04/01 16:20:01 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { postsAPI, notificationsAPI, likesAPI } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const { i18n, t } = useTranslation();
    
    // User data
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // Posts (NE PLUS charger depuis localStorage au démarrage)
    const [posts, setPosts] = useState(() => {
        // Nettoyer les anciennes données mockées de localStorage au démarrage
        localStorage.removeItem('posts');
        return [];
    });

    // Notifications — chargées depuis l'API, pas localStorage
    const [notifications, setNotifications] = useState([]);

    // Flag pour savoir si la notification de bienvenue a été ajoutée
    const [welcomeNotificationAdded, setWelcomeNotificationAdded] = useState(() => {
        return localStorage.getItem('welcomeNotificationAdded') === 'true';
    });
    // Theme (light, dark, auto)
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });

    // Language
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved || 'fr';
    });

    // Fonction pour changer la langue
    const setLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        console.log('🌍 Langue changée:', lang);
    };

    // Charger les notifications depuis l'API quand l'user est connecté
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const data = await notificationsAPI.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('❌ Erreur chargement notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Charger les posts depuis l'API au démarrage
    useEffect(() => {
        const loadPosts = async () => {
            try {
                console.log("📥 Chargement des posts depuis l'API...");
                const response = await postsAPI.getFeed(10);
                
                // Récupérer les likes de l'utilisateur courant
                let likedPostIds = [];
                if (user?.id) {
                    try {
                        const likedPosts = await postsAPI.getLikedPosts(user.id, 100);
                        likedPostIds = likedPosts?.map(p => p.id) || [];
                        console.log("❤️ Posts likés:", likedPostIds);
                    } catch (error) {
                        console.warn("⚠️ Impossible de récupérer les likes:", error);
                        // Continuer même si on ne peut pas récupérer les likes
                    }
                }
                
                // Formatter les posts pour l'affichage
                const formattedPosts = response?.map(p => ({
                    id: p.id,
                    author: p.user?.username || p.user?.firstName || 'Anonyme',
                    avatar: p.user?.avatar || `https://ui-avatars.com/api/?name=${p.user?.firstName || 'User'}&background=3b82f6&color=fff`,
                    content: p.content,
                    likes: p._count?.likes || p.likes || 0,
                    liked: likedPostIds.includes(p.id),
                    date: new Date(p.createdAt).toLocaleDateString('fr-FR'),
                    userId: p.userId,
                    createdAt: p.createdAt,
                })) || [];
                
                console.log("✅ Posts chargés:", formattedPosts.length);
                setPosts(formattedPosts);
            } catch (error) {
                console.error("❌ Erreur chargement posts:", error);
                // Ne plus charger depuis localStorage - laisser vide
                setPosts([]);
            }
        };

        loadPosts();
    }, []);

    // Fonction pour rafraîchir les posts manuellement
    const fetchPosts = useCallback(async () => {
        try {
            console.log("🔄 Actualisation du feed...");
            const response = await postsAPI.getFeed(1, 10);
            
            // Récupérer les likes de l'utilisateur courant
            let likedPostIds = [];
            try {
                const likesData = await likesAPI.getMyLikes();
                likedPostIds = likesData.likedPostIds || [];
                console.log("❤️ Posts likés:", likedPostIds);
            } catch (error) {
                console.warn("⚠️ Impossible de récupérer les likes:", error);
                // Continuer même si on ne peut pas récupérer les likes
            }
            
            const formattedPosts = response.posts?.map(p => ({
                id: p.id,
                author: p.user?.username || p.user?.firstName || 'Anonyme',
                avatar: p.user?.avatar || `https://ui-avatars.com/api/?name=${p.user?.firstName || 'User'}&background=3b82f6&color=fff`,
                content: p.content,
                likes: p._count?.likes || 0,
                liked: likedPostIds.includes(p.id),
                date: new Date(p.createdAt).toLocaleDateString('fr-FR'),
                userId: p.userId,
                createdAt: p.createdAt,
            })) || [];
            
            console.log("✅ Feed actualisé:", formattedPosts.length);
            setPosts(formattedPosts);
            return formattedPosts;
        } catch (error) {
            console.error("❌ Erreur actualisation feed:", error);
            return [];
        }
    }, []);

    // Fonction pour vérifier s'il y a de nouveaux posts sans les charger
    const checkForNewPosts = useCallback(async () => {
        try {
            const response = await postsAPI.getFeed(1, 10);
            const newPostIds = response.posts?.map(p => p.id) || [];
            const currentPostIds = posts.map(p => p.id);
            
            // Vérifier s'il y a des posts qui ne sont pas dans la liste actuelle
            const hasNew = newPostIds.some(id => !currentPostIds.includes(id));
            return hasNew;
        } catch (error) {
            console.error("❌ Erreur vérification posts:", error);
            return false;
        }
    }, [posts]);

    // Polling passif toutes les 30 secondes pour détecter les nouveaux posts
    useEffect(() => {
        const interval = setInterval(async () => {
            if (user && posts.length > 0) {
                const hasNew = await checkForNewPosts();
                // Note: on pourrait émettre un événement ici si nécessaire
            }
        }, 30000); // Toutes les 30 secondes

        return () => clearInterval(interval);
    }, [user, posts, checkForNewPosts]);

    // Sauvegarder dans localStorage à chaque changement
    useEffect(() => {
        if (user) {
            console.log("💾 Sauvegarde utilisateur dans localStorage:", user);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Ajouter une notification de bienvenue si c'est la première fois
            if (!welcomeNotificationAdded) {
                const welcomeNotif = {
                    id: Date.now(),
                    type: 'system',
                    content: t ? t('notifications.welcome.message', { name: user.firstName || user.username }) : `Bienvenue ${user.firstName || user.username} ! Découvrez votre nouveau réseau social pour la communauté 42.`,
                    avatar: user.avatar || `https://ui-avatars.com/api/?name=42Hub&background=3b82f6&color=fff`,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                };
                
                setNotifications(prev => [welcomeNotif, ...prev]);
                setWelcomeNotificationAdded(true);
                localStorage.setItem('welcomeNotificationAdded', 'true');
                console.log("🎉 Notification de bienvenue ajoutée");
            }
        } else {
            console.log("⚠️ Pas d'utilisateur à sauvegarder");
        }
    }, [user, welcomeNotificationAdded, t]);



    // Sauvegarder le thème et l'appliquer au DOM
    useEffect(() => {
        localStorage.setItem('theme', theme);
        
        const root = window.document.documentElement;
        
        // Retirer les classes existantes
        root.classList.remove('light', 'dark');
        
        if (theme === 'auto') {
            // Détecter la préférence système
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.add(systemPrefersDark ? 'dark' : 'light');
        } else {
            // Appliquer le thème choisi
            root.classList.add(theme);
        }
    }, [theme]);

    // Fonctions pour gérer les posts
    const addPost = async (post) => {
        if (!user) {
            console.warn("⚠️ Tentative d'ajout de post sans utilisateur connecté");
            return null;
        }
        
        console.log("📝 Ajout d'un post par:", user.username || user.firstName);
        
        try {
            // Appeler l'API pour créer le post dans la BDD
            const createdPost = await postsAPI.createPost(post.content);
            
            // Formatter le post pour l'affichage
            const newPost = {
                id: createdPost.id, // Utiliser l'ID de la BDD
                author: user?.username || user?.firstName || 'Vous',
                avatar: user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=3b82f6&color=fff`,
                content: createdPost.content,
                likes: createdPost._count?.likes || 0,
                liked: false,
                date: 'À l\'instant',
                userId: user?.id,
                createdAt: createdPost.createdAt,
            };
            
            console.log("✅ Post créé dans la BDD:", newPost);
            setPosts([newPost, ...posts]);
            return newPost;
        } catch (error) {
            console.error("❌ Erreur création post:", error);
            alert(`Erreur lors de la création du post: ${error.message}`);
            return null;
        }
    };

    const toggleLike = async (postId) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        // Mise à jour optimiste
        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
                : p
        ));

        try {
            if (post.liked) {
                await postsAPI.unlikePost(postId);
            } else {
                await postsAPI.likePost(postId);
            }
        } catch (error) {
            console.error("❌ Erreur like:", error);
            // Rollback
            setPosts(posts.map(p =>
                p.id === postId
                    ? { ...p, liked: post.liked, likes: post.likes }
                    : p
            ));
        }
    };

    const deletePost = async (postId) => {
        try {
            await postsAPI.deletePost(postId);
            // Enlever le post de la liste immédiatement
            setPosts(posts.filter(post => post.id !== postId));
            console.log("✅ Post supprimé:", postId);
            
            // Si peu de posts restants, recharger pour en avoir plus
            const remainingPosts = posts.filter(post => post.id !== postId);
            if (remainingPosts.length < 5) {
                console.log("📥 Rechargeant les posts après suppression...");
                await fetchPosts();
            }
        } catch (error) {
            console.error("❌ Erreur suppression post:", error);
            alert(`Erreur lors de la suppression: ${error.message}`);
        }
    };

    // Fonctions pour gérer les notifications
    const addNotification = (notification) => {
        const newNotif = {
            id: Date.now(),
            ...notification,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markNotificationAsRead = async (notifId) => {
        // Mise à jour optimiste
        setNotifications(prev =>
            prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
        );
        try {
            await notificationsAPI.markAsRead(notifId);
        } catch (error) {
            console.error('❌ Erreur markAsRead:', error);
            // Rollback
            setNotifications(prev =>
                prev.map(n => n.id === notifId ? { ...n, isRead: false } : n)
            );
        }
    };

    const markAllNotificationsAsRead = async () => {
        // Mise à jour optimiste
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            await notificationsAPI.markAllAsRead();
        } catch (error) {
            console.error('❌ Erreur markAllAsRead:', error);
            await fetchNotifications(); // Recharger l'état réel en cas d'erreur
        }
    };

    const getUnreadCount = () => {
        return notifications.filter(n => !n.isRead).length;
    };

    const value = {
        // User
        user,
        setUser,
        
        // Posts
        posts,
        setPosts,
        addPost,
        toggleLike,
        deletePost,
        fetchPosts,
        
        // Notifications
        notifications,
        setNotifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        getUnreadCount,
        fetchNotifications,
        
        // Theme
        theme,
        setTheme,

        // Language
        language,
        setLanguage,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
