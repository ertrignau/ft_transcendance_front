# 📡 42Hub API - Documentation Complète

## 🎯 Vue d'ensemble

Cette documentation liste **toutes les requêtes API** du projet 42Hub, organisées par catégorie.

**Base URL:** `http://localhost:8000/api`

**Authentification:** JWT Token (Bearer Token dans le header `Authorization`)

---

## 📊 Résumé des Requêtes

- **Total:** 46 requêtes
- **GET:** 20
- **POST:** 13
- **PATCH:** 7
- **DELETE:** 6

---

## 🔐 Authentification (API AUTH)

Gestion du login, inscription et session utilisateur.
------------------------------------------------------------------------------------------------------
| # | Méthode 	| Endpoint 					| Description 									| Auth 	 |
|---|-----------|---------------------------|-----------------------------------------------|--------|
| 1 | POST 		| `/auth/login` 			| Connexion classique (login + password) 		| ❌ Non	|
| 2 | GET 		| `/auth/42` 				| Récupère l'URL de redirection OAuth 42 		| ❌ Non |
| 3 | POST 		| `/auth/42/callback`		| Callback OAuth 42 (échange code contre JWT) 	| ❌ Non |
| 4 | POST 		| `/auth/42/confirm` 		| Confirmation d'inscription OAuth 42 			| ❌ Non |
| 5 | POST 		| `/auth/register` 			| Inscription classique 						| ❌ Non |
| 6 | GET 		| `/auth/me` 				| Récupère l'utilisateur actuellement connecté 	| ✅ Oui |
| 7 | POST 		| `/auth/change-password` 	| Change le mot de passe 						| ✅ Oui |
------------------------------------------------------------------------------------------------------

## 👤 Profil Utilisateur (PROFILE API)

Gestion du profil personnel, avatar et statistiques.
-----------------------------------------------------------------------------------------------------
| #  | Méthode 	| Endpoint 					| Description									| Auth 	 |
|----|---------	|---------------------------|-----------------------------------------------|--------|
| 8  | GET 		| `/users/{username}` 		| Récupère un profil public par username		| ❌ Non	|
| 9  | GET 		| `/users/me` 				| Récupère le profil personnel 					| ✅ Oui |
| 10 | PATCH 	| `/users/me` 				| Modifie le profil (bio, nom, etc.) 			| ✅ Oui |
| 11 | POST 	| `/users/me/avatar` 		| Upload un avatar (FormData) 					| ✅ Oui |
| 12 | GET 		| `/users/{username}/posts` | Récupère les posts d'un utilisateur 			| ❌ Non |
| 13 | GET 		| `/users/{username}/media` | Récupère les média d'un utilisateur 			| ❌ Non |
| 14 | GET 		| `/users/{username}/likes` | Récupère les posts likés par un utilisateur 	| ❌ Non |
------------------------------------------------------------------------------------------------------

## 👥 Utilisateurs (USERS API)

Gestion globale des utilisateurs.
-------------------------------------------------------------------------------------------------
| #  | Méthode 	| Endpoint 				  | Description 								| Auth   |
|----|---------	|-------------------------|---------------------------------------------|--------|
| 15 | GET 		| `/users` 				  | Récupère tous les utilisateurs (pagination) | ❌ Non |
| 16 | GET 		| `/users/{userId}` 	  | Récupère un utilisateur par ID 				| ❌ Non |
| 17 | GET 		| `/users/search?q=...`   | Recherche des utilisateurs 					| ❌ Non |
| 18 | PATCH 	| `/users/{userId}` 	  | Modifie un utilisateur 						| ✅ Oui |
| 19 | GET 		| `/users/{userId}/posts` | Posts d'un utilisateur par ID 				| ❌ Non |
--------------------------------------------------------------------------------------------------

## 📝 Posts (POSTS API)

Gestion des posts, likes et interactions.
-------------------------------------------------------------------------------------------------
| #  | Méthode | Endpoint 				| Description 									| Auth   |
|----|---------|------------------------|-----------------------------------------------|--------|
| 20 | GET 	   | `/posts` 				| Récupère tous les posts (feed principal) 		| ❌ Non |
| 21 | POST    | `/posts` 				| Crée un post (JSON ou FormData avec média)	| ✅ Oui |
| 22 | DELETE  | `/posts/{postId}` 		| Supprime un post 								| ✅ Oui |
| 23 | PATCH   | `/posts/{postId}` 		| Modifie un post 								| ✅ Oui |
| 24 | POST    | `/posts/{postId}/like` | Like un post 									| ✅ Oui |
| 25 | DELETE  | `/posts/{postId}/like` | Retire le like 								| ✅ Oui |
-------------------------------------------------------------------------------------------------

## 👫 Followers (FOLLOWERS API)

Gestion des relations de suivi entre utilisateurs.
-----------------------------------------------------------------------------------------------------
| #  | Méthode 	| Endpoint 						| Description 								| Auth   |
|----|---------	|-------------------------------|-------------------------------------------|--------|
| 26 | GET 		| `/users/{username}/followers` | Récupère les followers d'un utilisateur	| ❌ Non |
| 27 | GET 		| `/users/{username}/following` | Récupère les abonnements d'un utilisateur | ❌ Non |
| 28 | POST 	| `/users/{username}/follow` 	| Suivre un utilisateur 					| ✅ Oui |
| 29 | DELETE 	| `/users/{username}/follow` 	| Arrêter de suivre un utilisateur 			| ✅ Oui |
------------------------------------------------------------------------------------------------------

## 🔔 Notifications (NOTIFICATIONS API)

Gestion des notifications utilisateur.
-----------------------------------------------------------------------------------------------------
| #  | Méthode | Endpoint 								| Description 						| Auth   |
|----|---------|----------------------------------------|-----------------------------------|--------|
| 30 | GET 	   | `/notifications` 						| Récupère toutes les notifications | ✅ Oui |
| 31 | PATCH   | `/notifications/{notificationId}/read` | Marquer comme lue 				| ✅ Oui |
| 32 | PATCH   | `/notifications/read-all` 				| Marquer tout comme lu 			| ✅ Oui |
-----------------------------------------------------------------------------------------------------

## 💬 Messages (MESSAGES API)

Gestion des conversations et messages privés.
----------------------------------------------------------------------------------------------------------------------
| #  | Méthode  | Endpoint 										| Description 								| Auth   |
|----|----------|-----------------------------------------------|-------------------------------------------|--------|
| 33 | GET 		| `/messages/conversations` 					| Récupère toutes les conversations 		| ✅ Oui |
| 34 | GET 		| `/messages/conversations/{conversationId}`	| Récupère les messages d'une conversation 	| ✅ Oui |
| 35 | POST 	| `/messages` 									| Envoie un message 						| ✅ Oui |
---------------------------------------------------------------------------------------------------------------------

## 💭 Commentaires (COMMENTS API)

Gestion des commentaires sur les posts.
------------------------------------------------------------------------------------------
| #  | Méthode | Endpoint 				   | Description 						 | Auth   |
|----|---------|---------------------------|-------------------------------------|--------|
| 36 | GET 	   | `/comments/post/{postId}` | Récupère les commentaires d'un post | ❌ Non |
| 37 | POST    | `/comments/post/{postId}` | Crée un commentaire 				 | ✅ Oui |
| 38 | PATCH   | `/comments/{commentId}`   | Modifie un commentaire              | ✅ Oui |
| 39 | DELETE  | `/comments/{commentId}`   | Supprime un commentaire             | ✅ Oui |
------------------------------------------------------------------------------------------

## 🔍 Recherche (SEARCH API)

Recherche d'utilisateurs et ressources.
----------------------------------------------------------------------------------------------
| #  | Méthode | Endpoint 					 | Description 							 | Auth   |
|----|---------|-----------------------------|---------------------------------------|--------|
| 40 | GET 	   | `/search/42users?query=...` | Recherche utilisateurs 42 (API intra) | ✅ Oui |
| 41 | GET     | `/search/users?query=...` 	 | Recherche utilisateurs locaux (BDD)   | ✅ Oui |
-----------------------------------------------------------------------------------------------

## 📋 Résumé par Type de Requête

### GET (20 requêtes) - Lecture de données
```
/auth/me
/users
/users/{userId}
/users/{username}
/users/{username}/posts
/users/{username}/media
/users/{username}/likes
/users/{userId}/posts
/users/{username}/followers
/users/{username}/following
/posts
/comments/post/{postId}
/notifications
/messages/conversations
/messages/conversations/{conversationId}
/search/42users
/search/users
/users/search
/auth/42 (redirection)
```

### POST (13 requêtes) - Créer / Envoyer
```
/auth/login
/auth/42/callback
/auth/42/confirm
/auth/register
/posts
/posts/{postId}/like
/users/{username}/follow
/comments/post/{postId}
/messages
/users/me/avatar
/auth/change-password
/users/{userId} (create via update)
/search/... (queries)
```

### PATCH (7 requêtes) - Modification partielle
```
/users/me
/posts/{postId}
/comments/{commentId}
/notifications/{notificationId}/read
/notifications/read-all
/users/{userId}
```

### DELETE (6 requêtes) - Suppression
```
/posts/{postId}
/posts/{postId}/like
/comments/{commentId}
/users/{username}/follow
```
## 🛡️ Codes de Réponse
-------------------------------------------------
| Code | Signification 							 |
|------|-----------------------------------------|
| 200  | ✅ Succès 								|
| 201  | ✅ Créé avec succès 					|
| 400  | ❌ Requête invalide 					|
| 401  | ❌ Non authentifié 						|
| 403  | ❌ Non autorisé 						|
| 404  | ❌ Non trouvé 							|
| 409  | ❌ Conflit (ex: username existe déjà) 	|
| 500  | ❌ Erreur serveur 						|
-------------------------------------------------

---

## 📝 Notes Importantes

1. **JWT Token** - Obtenu lors du login ou OAuth 42, valide pendant 24h
2. **PATCH vs PUT** - On utilise **PATCH** pour les modifications partielles
3. **FormData** - Utilisé pour l'upload de fichiers (avatar, média)
4. **Pagination** - Par défaut page=1, limit=10 (variable par endpoint)
5. **Rate Limiting** - À ajouter pour l'API publique (future)

---

## 🚀 Frontend (api.js)

Toutes ces requêtes sont centralisées dans `/frontend/src/services/api.js` via la fonction `fetchWithAuth()` qui:
- Ajoute automatiquement le token JWT
- Gère les erreurs 401
- Redirige vers login en cas de session expirée
- Centralise les logs de débogage

---

**Dernière mise à jour:** 20 mars 2026  
