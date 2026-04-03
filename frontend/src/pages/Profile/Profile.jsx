/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Profile.jsx                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 14:07:20 by eric              #+#    #+#             */
/*   Updated: 2026/04/03 14:35:57 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../context/AppContext";
import { authAPI, uploadAPI, userAPI } from "../../services/api";
import { useAvatar } from "../../hooks/useAvatar";
import PostCard from "../../components/PostCard";
import CreatePostForm from "../../components/CreatePostForm";
import FloatingChat from "../../components/FloatingChat";
import { Link } from "react-router-dom";
import { FiImage, FiFileText, FiDownload, FiCamera, FiX, FiMessageCircle } from "react-icons/fi";

export default function Profile() 
{
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("posts");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userMedia, setUserMedia] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    
    const { user, setUser, posts, addPost, toggleLike, deletePost } = useAppContext();
    
    // Hook pour charger l'avatar avec JWT - seulement si c'est un filename local
    const isLocalAvatar = user?.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:');
    const { imageUrl: avatarUrl } = useAvatar(isLocalAvatar ? user?.avatar : null);
    
    // Filtrer les posts de l'utilisateur connecté
    const userPosts = posts.filter(post => post.userId === user?.id);
    
    // Récupère les infos de l'utilisateur connecté depuis l'API (toujours pour avoir les stats à jour)
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const userData = await authAPI.getCurrentUser();
                setUser(userData);
            } catch (err) {
                console.error('Erreur récupération profil:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);

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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setUploadError(null);
        } else {
            setUploadError(t('profile.uploadError'));
        }
    };

    const handleAvatarUpload = async () => {
        if (!selectedFile || !user?.id) return;

        setUploading(true);
        setUploadError(null);

        try {
            console.log('🔵 [PROFILE] Uploading avatar for user:', user.id);
            
            // Call updateProfile with the avatar file
            const response = await userAPI.updateProfile(user.id, {}, selectedFile);
            
            console.log('🟢 [PROFILE] Avatar uploaded successfully:', response);
            
            // Update the user's avatar
            setUser({ ...user, avatar: response.avatar || selectedFile.name });
            
            // Close the modal and reset
            setShowAvatarModal(false);
            setSelectedFile(null);
        } catch (err) {
            console.error('❌ Avatar upload error:', err);
            setUploadError(err.message || t('profile.uploadError'));
        } finally {
            setUploading(false);
        }
    };

    // Si pas de user, ne rien afficher (le useEffect va le créer)
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
 return (
        <div className="max-w-4xl mx-auto">
            {/* En-tête du profil */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-4 md:space-y-0">
                    {/* Avatar */}
                    <div className="group flex-shrink-0">
                        <div className="relative">
                            <img
                                src={avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${user.firstName || user.username}&background=3b82f6&color=fff`}
                                alt={user.username}
                                className="w-24 sm:w-32 h-24 sm:h-32 rounded-full border-4 border-blue-500"
                            />
                            <button
                                onClick={() => setShowAvatarModal(true)}
                                className="absolute inset-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all"
                            >
                                <FiCamera className="text-white opacity-0 group-hover:opacity-100 text-2xl sm:text-3xl" />
                            </button>
                        </div>
                    </div>

                    {/* Infos utilisateur */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                                    {user.firstName} {user.lastName}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">@{user.username}</p>
                            </div>
                            <Link
                                to="/settings"
                                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 transition text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                            >
                                ⚙️ {t('profile.edit')}
                            </Link>
                        </div>
                        {user.bio && <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">{user.bio}</p>}

                        {/* Informations 42 */}
                        <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {user.campus && <span className="break-words">📍 {user.campus}</span>}
                            {user.level && <span>🎯 Niveau {user.level}</span>}
                            {user.cursus && <span className="break-words">📚 {user.cursus}</span>}
                        </div>

                        {/* Statistiques */}
                        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm sm:text-base">
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">{userPosts.length}</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-1">{t('profile.posts')}</span>
                            </div>
                            <Link to="/followers?tab=followers" className="hover:underline">
                                <span className="font-bold text-gray-900 dark:text-white">{user._count?.following || 0}</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-1">{t('profile.followers')}</span>
                            </Link>
                            <Link to="/followers?tab=following" className="hover:underline">
                                <span className="font-bold text-gray-900 dark:text-white">{user._count?.followers || 0}</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-1">{t('profile.following')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Formulaire de création de post */}
            <CreatePostForm onSubmit={handleCreatePost} />
            
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
                        {t('profile.tabs.posts')}
                    </button>
                    <button 
                        onClick={() => setActiveTab("media")}
                        className={`px-6 py-3 font-semibold ${
                            activeTab === "media" 
                                ? "text-blue-500 border-b-2 border-blue-500" 
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        {t('profile.tabs.media')}
                    </button>
                </div>
            </div>

            {/* Contenu selon l'onglet actif */}
            {activeTab === "posts" && (
                <div className="space-y-4">
                    {userPosts.length > 0 ? (
                        userPosts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onLike={handleLike}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
                            {t('profile.noPosts')}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "media" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userMedia.length > 0 ? (
                        userMedia.map(media => (
                            <div 
                                key={media.id} 
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group"
                            >
                                {media.type === "image" ? (
                                    <div className="relative aspect-square">
                                        <img 
                                            src={media.url} 
                                            alt={media.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                                            <FiImage className="text-white text-3xl opacity-0 group-hover:opacity-100 transition" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center p-4">
                                        <FiFileText className="text-red-500 text-5xl mb-2" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium text-center">{media.title}</p>
                                    </div>
                                )}
                                <div className="p-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{media.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-500">{media.date}</p>
                                        {media.type === "pdf" && (
                                            <button className="text-blue-500 hover:text-blue-700">
                                                <FiDownload className="text-sm" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
                            Aucun média pour le moment
                        </div>
                    )}
                </div>
            )}

            {/* Modal de changement d'avatar */}
            {showAvatarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('profile.uploadAvatar')}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAvatarModal(false);
                                    setSelectedFile(null);
                                    setUploadError(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Preview de l'image sélectionnée */}
                        {selectedFile && (
                            <div className="mb-4 flex justify-center">
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Preview"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                                />
                            </div>
                        )}

                        {/* Input fichier */}
                        <div className="mb-4">
                            <label className="block w-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="avatar-upload"
                                />
                                <div className="cursor-pointer bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition">
                                    <FiImage className="mx-auto text-4xl text-gray-400 mb-2" />
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {selectedFile ? selectedFile.name : t('profile.selectImage')}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Erreur */}
                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                                {uploadError}
                            </div>
                        )}

                        {/* Boutons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowAvatarModal(false);
                                    setSelectedFile(null);
                                    setUploadError(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                disabled={uploading}
                            >
                                {t('profile.cancel')}
                            </button>
                            <button
                                onClick={handleAvatarUpload}
                                disabled={!selectedFile || uploading}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {uploading ? t('profile.uploading') : t('profile.changeAvatar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
