/* ========================================== */
/* Hook pour récupérer et afficher les images */
/* avec authentification JWT                  */
/* ========================================== */

import { useState, useEffect } from 'react';
import { uploadAPI } from '../services/api';

export function useAvatar(filename) {
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!filename) {
			setImageUrl(null);
			return;
		}

		const loadImage = async () => {
			setLoading(true);
			setError(null);
			try {
				const url = await uploadAPI.getImageUrl(filename);
				setImageUrl(url);
			} catch (err) {
				console.error('Erreur chargement image:', err);
				setError(err.message);
				setImageUrl(null);
			} finally {
				setLoading(false);
			}
		};

		loadImage();

		// Cleanup: libérer la URL blob
		return () => {
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	}, [filename]);

	return { imageUrl, loading, error };
}
