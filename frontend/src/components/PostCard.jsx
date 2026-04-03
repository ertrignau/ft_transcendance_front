/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   PostCard.jsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/06 16:21:25 by eric              #+#    #+#             */
/*   Updated: 2026/04/03 17:36:46 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../utils";
import { FiHeart, FiMessageCircle, FiShare2, FiTrash2, FiMoreVertical, FiEdit2 } from "react-icons/fi";
import CommentSection from "./CommentSection";
import { useAppContext } from "../context/AppContext";
import { useAvatar } from "../hooks/useAvatar";
import { postsAPI } from "../services/api";

export default function PostCard({ post, onLike, onDelete })
{
	const { t } = useTranslation();
	const [showComments, setShowComments] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(post.content);
	const [isSaving, setIsSaving] = useState(false);
	const { user } = useAppContext();

	// Vérifier si c'est un filename local (pas http/data)
	const isLocalAvatar = post.avatar && !post.avatar.startsWith('http') && !post.avatar.startsWith('data:');
	const { imageUrl: avatarUrl } = useAvatar(isLocalAvatar ? post.avatar : null);

	const isOwner = user?.id === post.userId;

	const handleDelete = () => {
		if (confirm(t('post.confirmDelete'))) {
			onDelete(post.id);
		}
		setShowMenu(false);
	};

	const handleEdit = async () => {
		if (!editContent.trim()) return;
		
		setIsSaving(true);
		try {
			await postsAPI.updatePost(post.id, editContent);
			// Mettre à jour le post localement
			post.content = editContent;
			post.isEdited = true;
			setIsEditing(false);
			setShowMenu(false);
		} catch (err) {
			console.error("Erreur modification post:", err);
			alert("Erreur lors de la modification du post");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
			<div className="flex-1">
				{/*HEADER (auteur + date) */}
				<div className="flex justify-between items-start mb-2">
					<div className="flex items-center space-x-3">
						<Link to={`/profile/${post.userId}`}>
							<img
								src={avatarUrl || post.avatar || `https://ui-avatars.com/api/?name=${post.author || 'User'}&background=3b82f6&color=fff`}
								alt={post.author}
								className="w-12 h-12 rounded-full hover:ring-2 hover:ring-blue-500 transition object-cover"
							/>
						</Link>
						<div>
							<Link to={`/profile/${post.userId}`}>
								<h3 className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
									{post.author}
								</h3>
							</Link>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{post.date}
								{post.isEdited && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{t('post.edited')}</span>}
							</p>
						</div>
					</div>
						{/* Menu 3 points (visible seulement si c'est son propre post) */}
						{isOwner && (
							<div className="relative">
								<button
									onClick={() => setShowMenu(!showMenu)}
									className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
								>
									<FiMoreVertical />
								</button>
								{showMenu && (
									<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-10">
										<button
											onClick={() => {
												setIsEditing(true);
												setShowMenu(false);
											}}
											className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center space-x-2"
										>
											<FiEdit2 />
											<span>{t('post.edit')}</span>
										</button>
										<button
											onClick={handleDelete}
											className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center space-x-2"
										>
											<FiTrash2 />
											<span>{t('post.delete')}</span>
										</button>
									</div>
								)}
							</div>
						)}
					</div>
					{/* CONTENU (édition ou affichage) */}
					{isEditing ? (
						<div className="mb-4 space-y-2">
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								rows="3"
								autoFocus
							/>
							<div className="flex gap-2">
								<button
									onClick={handleEdit}
									disabled={isSaving || !editContent.trim()}
									className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
								>
									{isSaving ? 'Sauvegarde...' : 'Enregistrer'}
								</button>
								<button
									onClick={() => {
										setIsEditing(false);
										setEditContent(post.content);
									}}
									className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition"
								>
									Annuler
								</button>
							</div>
						</div>
					) : (
						<p className="text-gray-800 dark:text-gray-200 mb-4">{post.content}</p>
					)}
					
					{/* Image ou PDF du post */}
				<>
					{post.image && (
						<div className="mb-4 flex justify-center">
							<img
								src={post.image}
								alt="Post content"
								className="max-w-full max-h-[500px] rounded-lg object-cover"
							/>
						</div>
					)}
					{post.pdf && (
						<div className="mb-4">
							<a
								href={post.pdf}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
							>
								📄 Voir le PDF
							</a>
						</div>
					)}
				</>
				
				{/*footer like*/}
					<div className="flex items-center space-x-6">
						<button
							onClick={() => onLike(post.id)}
							className={`flex items-center space-x-2 transition ${
								post.liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
							}`}
						>
							<FiHeart className={post.liked ? 'fill-red-500' : ''} />
							<span>{post.likes}</span>
						</button>
						<button
							onClick={() => setShowComments(!showComments)}
							className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition"
						>
							<FiMessageCircle />
							<span>{showComments ? 'Masquer' : 'Commenter'}</span>
						</button>
						<button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition">
							<FiShare2 />
							<span>Partager</span>
						</button>
					</div>

					{/* Section commentaires */}
				{showComments && <CommentSection postId={post.id} />}
			</div>
		</div>
	);
}