/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   CommentSection.jsx                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/17 15:00:00 by eric              #+#    #+#             */
/*   Updated: 2026/03/20 13:36:01 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { commentsAPI } from "../services/api";
import { FiSend, FiTrash2, FiEdit2 } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function CommentSection({ postId }) {
	const { t } = useTranslation();
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [editContent, setEditContent] = useState("");
	const { user } = useAppContext();

	// Charger les commentaires
	useEffect(() => {
		loadComments();
	}, [postId]);

	const loadComments = async () => {
		try {
			const response = await commentsAPI.getCommentsByPost(postId);
			setComments(response.comments || []);
		} catch (err) {
			console.error("Erreur chargement commentaires:", err);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;

		setLoading(true);
		try {
			console.log('Tentative création commentaire pour post:', postId);
			console.log('Token dans localStorage:', localStorage.getItem('access_token') ? 'Présent' : 'Absent');
			const comment = await commentsAPI.createComment(postId, newComment);
			console.log('Commentaire créé:', comment);
			setComments([comment, ...comments]);
			setNewComment("");
		} catch (err) {
			console.error("Erreur création commentaire:", err);
			alert(`Erreur lors de la création du commentaire: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (commentId) => {
		if (!confirm(t('comment.confirmDelete'))) return;

		try {
			await commentsAPI.deleteComment(commentId);
			setComments(comments.filter((c) => c.id !== commentId));
		} catch (err) {
			console.error("Erreur suppression commentaire:", err);
			alert("Erreur lors de la suppression");
		}
	};

	const handleEdit = async (commentId) => {
		if (!editContent.trim()) return;

		try {
			const updated = await commentsAPI.updateComment(commentId, editContent);
			setComments(comments.map((c) => (c.id === commentId ? updated : c)));
			setEditingId(null);
			setEditContent("");
		} catch (err) {
			console.error("Erreur modification commentaire:", err);
			alert("Erreur lors de la modification");
		}
	};

	return (
		<div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
			{/* Formulaire d'ajout de commentaire */}
			<form onSubmit={handleSubmit} className="flex gap-2 mb-4">
				<img
					src={user?.avatar || "/default-avatar.png"}
					alt="Avatar"
					className="w-8 h-8 rounded-full"
				/>
				<input
					type="text"
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder={t('comment.add')}
					className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					type="submit"
					disabled={loading || !newComment.trim()}
					className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center gap-2"
				>
					<FiSend />
				</button>
			</form>

			{/* Liste des commentaires */}
			<div className="space-y-3">
				{comments.map((comment) => (
					<div key={comment.id} className="flex gap-3">
						<img
							src={comment.user?.avatar || "/default-avatar.png"}
							alt={comment.user?.username}
							className="w-8 h-8 rounded-full"
						/>
						<div className="flex-1">
							{editingId === comment.id ? (
								<div className="flex gap-2">
									<input
										type="text"
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm"
										autoFocus
									/>
									<button
										onClick={() => handleEdit(comment.id)}
										className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
									>
										{t('comment.validate')}
									</button>
									<button
										onClick={() => {
											setEditingId(null);
											setEditContent("");
										}}
										className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
									>
										{t('comment.cancel')}
									</button>
								</div>
							) : (
								<>
									<div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
										<p className="font-semibold text-sm text-gray-900 dark:text-white">
											{comment.user?.firstName} {comment.user?.lastName}
										</p>
										<p className="text-gray-800 dark:text-gray-200 text-sm">{comment.content}</p>
										{comment.isEdited && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(modifié)</p>}
									</div>
									<div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
										<span>{new Date(comment.createdAt).toLocaleDateString()}</span>
										{user?.id === comment.userId && (
											<>
												<button
													onClick={() => {
														setEditingId(comment.id);
														setEditContent(comment.content);
													}}
													className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
												>
													<FiEdit2 /> {t('post.edit')}
												</button>
												<button
													onClick={() => handleDelete(comment.id)}
													className="hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
												>
													<FiTrash2 /> {t('comment.delete')}
												</button>
											</>
										)}
									</div>
								</>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
