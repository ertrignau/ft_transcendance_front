L'API 42 renvoie l'avatar sous forme d'**URL** dans le champ `image` :

```json
{
  "image": {
    "link":     "https://cdn.intra.42.fr/users/xxx/adrien.jpg",
    "versions": {
      "large":  "https://cdn.intra.42.fr/users/xxx/large_adrien.jpg",
      "medium": "https://cdn.intra.42.fr/users/xxx/medium_adrien.jpg",
      "small":  "https://cdn.intra.42.fr/users/xxx/small_adrien.jpg",
      "micro":  "https://cdn.intra.42.fr/users/xxx/micro_adrien.jpg"
    }
  }
}
```

---

## Ce que tu récupères dans le BFF

```javascript
const { login, first_name, last_name, email, image } = user42;

const avatar = image?.versions?.medium ?? image?.link ?? null;
```

---

## Ce que tu stockes

Tu ne stockes pas l'image elle-même — juste **l'URL** dans le champ `avatar` de `userService` :

```javascript
await fetch(`${process.env.USER_SERVICE_URL}/users`, {
  method: 'POST',
  body: JSON.stringify({
    username:  login,
    firstName: first_name,
    lastName:  last_name,
    avatar,       // ← l'URL de l'image
  }),
});
```

Et dans le frontend tu l'affiches directement :

```html
<img src="{{ user.avatar }}" alt="avatar" />
```

---

## Les tailles disponibles

| Version | Dimensions approximatives |
|---|---|
| `large` | 200x200 |
| `medium` | 100x100 |
| `small` | 50x50 |
| `micro` | 25x25 |

Pour Transcendence, `medium` est généralement le bon compromis.