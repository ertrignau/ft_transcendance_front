Le frontend doit envoyer une requête GET avec le token JWT dans le header :

```javascript
const response = await fetch('https://localhost:3000/uploads/avatars/abc-123_1711234567.jpg', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);

// Afficher l'image
document.querySelector('img').src = imageUrl;
```

---

Mais pour ça, le frontend doit connaître le nom du fichier. Ce nom doit donc être stocké quelque part — typiquement dans `userService` dans le champ `avatar` :

```
avatar: 'abc-123_1711234567.jpg'  ← juste le nom du fichier
```

Et le frontend reconstruit l'URL :

```javascript
const avatarUrl = `https://localhost:3000/uploads/avatars/${user.avatar}`;

const response = await fetch(avatarUrl, {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Le flow complet

```
1. Frontend upload l'image    → POST /uploads/avatar
2. BFF sauvegarde le fichier  → uploads/avatars/abc-123_....jpg
3. BFF met à jour userService → avatar = 'abc-123_....jpg'
4. Frontend récupère le profil → GET /profile → { avatar: 'abc-123_....jpg' }
5. Frontend reconstruit l'URL → GET /uploads/avatars/abc-123_....jpg
```