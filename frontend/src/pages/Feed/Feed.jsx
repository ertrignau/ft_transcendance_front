/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Feed.jsx                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 14:07:04 by eric              #+#    #+#             */
/*   Updated: 2026/03/25 16:40:22 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../context/AppContext";
import PostCard from "../../components/PostCard";
import CreatePostForm from "../../components/CreatePostForm";
import FloatingChat from "../../components/FloatingChat";
import { FiMessageCircle, FiRefreshCw } from "react-icons/fi";
import { likesAPI, postsAPI } from "../../services/api";

export default function Feed() 
{
    const { t } = useTranslation();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasNewPosts, setHasNewPosts] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [displayedPosts, setDisplayedPosts] = useState([]); // State local pour accumuler les posts
    const [loadedPostIds, setLoadedPostIds] = useState(new Set()); // Track des posts chargés pour éviter les doublons
    const observerTarget = useRef(null);
    const { posts, addPost, toggleLike, deletePost, fetchPosts } = useAppContext();

    // Synchroniser displayedPosts avec le contexte posts
    useEffect(() => {
        if (posts.length === 0) {
            setDisplayedPosts([]);
            setLoadedPostIds(new Set());
            return;
        }

        setDisplayedPosts(prev => {
            const postIds = posts.map(p => p.id);
            const newLoadedIds = new Set(postIds);
            
            // Déterminer les nouveaux posts à ajouter
            const newPostIds = postIds.filter(id => !loadedPostIds.has(id));
            const newPosts = posts.filter(p => newPostIds.includes(p.id));
            
            // Mettre à jour la liste avec sync complète du contexte
            // Pour chaque post du contexte, utiliser la version à jour
            const updated = posts.filter(p => postIds.includes(p.id));
            
            setLoadedPostIds(newLoadedIds);
            return updated;
        });
    }, [posts]);

    const handleCreatePost = (postData) => {
        console.log("Création post:", postData);
        addPost(postData);
    };

    const handleLike = (postId) => {
        toggleLike(postId);
    };

    const handleDelete = (postId) => {
        deletePost(postId);
    };

    const loadMorePosts = async () => {
        if (isLoadingMore || !hasMorePosts) return;
        
        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await postsAPI.getFeed(nextPage, 5);
            
            if (response.posts && response.posts.length > 0) {
                // Récupérer les likes de l'utilisateur courant
                let likedPostIds = [];
                try {
                    const likesData = await likesAPI.getMyLikes();
                    likedPostIds = likesData.likedPostIds || [];
                } catch (error) {
                    console.warn("⚠️ Impossible de récupérer les likes:", error);
                }
                
                // Formatter les nouveaux posts
                const formattedPosts = response.posts.map(p => ({
                    id: p.id,
                    author: p.user?.username || p.user?.firstName || 'Anonyme',
                    avatar: p.user?.avatar || `https://ui-avatars.com/api/?name=${p.user?.firstName || 'User'}&background=3b82f6&color=fff`,
                    content: p.content,
                    likes: p.likesCount || p._count?.likes || 0,
                    liked: likedPostIds.includes(p.id),
                    date: new Date(p.createdAt).toLocaleDateString('fr-FR'),
                    userId: p.userId,
                    createdAt: p.createdAt,
                    isEdited: p.isEdited || false,
                    image: p.image || null,
                    pdf: p.pdf || null,
                }));
                
                // ✅ CORRECTED: Ajouter UNIQUEMENT les nouveaux posts (dédupliquer)
                // Filtrer les posts qui ne sont pas déjà chargés
                const newPosts = formattedPosts.filter(p => !loadedPostIds.has(p.id));
                
                if (newPosts.length > 0) {
                    setDisplayedPosts(prev => [...prev, ...newPosts]);
                    // Mettre à jour le set des IDs chargés
                    setLoadedPostIds(prev => {
                        const updated = new Set(prev);
                        newPosts.forEach(p => updated.add(p.id));
                        return updated;
                    });
                    console.log(`✅ ${newPosts.length} nouveaux posts chargés (page ${nextPage})`);
                } else {
                    console.log("ℹ️ Aucun nouveau post à ajouter");
                }
                setCurrentPage(nextPage);
            } else {
                setHasMorePosts(false);
            }
        } catch (error) {
            console.error("❌ Erreur chargement posts supplémentaires:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (fetchPosts) {
                await fetchPosts();
                // Une fois actualisé, réinitialiser le flag
                setHasNewPosts(false);
            }
        } catch (error) {
            console.error("Erreur actualisation du feed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Vérifier périodiquement s'il y a de nouveaux posts
    useEffect(() => {
        const interval = setInterval(async () => {
            // Faire une requête discrète pour vérifier s'il y a de nouveaux posts
            // Simplement comparer le timestamp du dernier post
            try {
                const response = await postsAPI.getFeed(1, 1);
                if (response.posts && response.posts.length > 0) {
                    const latestPostTime = new Date(response.posts[0].createdAt).getTime();
                    const oldestLoadedTime = displayedPosts.length > 0 
                        ? new Date(displayedPosts[0].createdAt).getTime() 
                        : 0;
                    
                    if (latestPostTime > oldestLoadedTime) {
                        setHasNewPosts(true);
                    }
                }
            } catch (error) {
                // Silencieusement ignorer les erreurs de polling
            }
        }, 15000); // Vérifier toutes les 15 secondes

        return () => clearInterval(interval);
    }, [displayedPosts]);

    // Intersection Observer pour charger plus de posts au scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoadingMore && hasMorePosts) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [isLoadingMore, hasMorePosts, loadMorePosts]);
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('feed.title')}</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-lg transition ${
                        hasNewPosts 
                            ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={hasNewPosts ? "De nouveaux posts disponibles" : "Aucun nouveau post"}
                >
                    <FiRefreshCw className={`text-xl ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <CreatePostForm onSubmit={handleCreatePost} />



            <div className="space-y-4">
                {displayedPosts.length > 0 ? (
                    <>
                        {displayedPosts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onLike={handleLike}
                                onDelete={handleDelete}
                            />
                        ))}
                        {/* Élément observé pour la pagination infinie */}
                        <div ref={observerTarget} className="py-4 text-center">
                            {isLoadingMore ? (
                                <div className="text-gray-500 dark:text-gray-400">
                                    <p>{t('feed.loading') || 'Chargement...'}</p>
                                </div>
                            ) : hasMorePosts ? (
                                <p className="text-sm text-gray-400">Scrollez pour voir plus</p>
                            ) : (
                                <p className="text-sm text-gray-400">Fin du feed</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
                        <p className="text-lg mb-2">{t('feed.noPosts')}</p>
                        <p className="text-sm">{t('feed.beFirstToPost')}</p>
                    </div>
                )}
            </div>

            {/* Bouton flottant chat */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition flex items-center justify-center z-40"
                title={t('navbar.messages')}
            >
                <FiMessageCircle className="text-2xl" />
            </button>

            {/* FloatingChat */}
            {isChatOpen && <FloatingChat onClose={() => setIsChatOpen(false)} />}
        </div>
    );
}
