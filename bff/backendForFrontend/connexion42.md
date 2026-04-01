Pour te connecter à l'API de 42 (OAuth2), voici le flow complet :

---

## 1. Créer une application sur l'intranet 42

Sur **intra.42.fr** → Settings → API → **New Application**

Tu obtiens :
- `CLIENT_ID`
- `CLIENT_SECRET`
- Tu définis un `REDIRECT_URI` (ex: `https://localhost:3000/auth/callback`)

---

## 2. Le flow OAuth2

```
Utilisateur                    BFF                        API 42
     │                          │                            │
     │── clic "Login with 42" ──▶│                            │
     │                          │── redirect vers 42 ────────▶│
     │◀─────────────────────────────── page de login 42 ──────│
     │── accepte ───────────────────────────────────────────▶│
     │                          │◀─── code d'autorisation ────│
     │                          │── échange code contre token ▶│
     │                          │◀─── access_token ───────────│
     │                          │── GET /v2/me ───────────────▶│
     │                          │◀─── données utilisateur ────│
```

---

## 3. Dans ton `.env`

```properties
FORTYTWO_CLIENT_ID=ton_client_id
FORTYTWO_CLIENT_SECRET=ton_client_secret
FORTYTWO_REDIRECT_URI=https://localhost:3000/auth/callback
```

---

## 4. Étape 1 — Rediriger vers 42

```javascript
// GET /auth/42
exports.redirectTo42 = (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.FORTYTWO_CLIENT_ID,
    redirect_uri:  process.env.FORTYTWO_REDIRECT_URI,
    response_type: 'code',
  });

  res.redirect(`https://api.intra.42.fr/oauth/authorize?${params}`);
};
```

---

## 5. Étape 2 — Récupérer le token depuis le callback

```javascript
// GET /auth/callback?code=xxx
exports.handleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

    // Échanger le code contre un access_token
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        redirect_uri:  process.env.FORTYTWO_REDIRECT_URI,
        code,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Récupérer les infos de l'utilisateur
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user42 = await userResponse.json();

    // user42 contient : login, email, image, etc.
    console.log(user42.login, user42.email);

    return res.status(200).json(user42);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
```

---

## 6. Les données retournées par `/v2/me`

Les champs les plus utiles :

| Champ | Contenu |
|---|---|
| `login` | Le login 42 (ex: `adrien`) |
| `email` | L'email 42 |
| `image.link` | URL de l'avatar |
| `first_name` | Prénom |
| `last_name` | Nom |
| `campus[0].name` | Campus |

---

## 7. Les routes

```javascript
router.get('/42',         authCtrl.redirectTo42);
router.get('/callback',   authCtrl.handleCallback);
```

---

## Ce que fait le BFF avec ces données

Une fois `user42` récupéré, le BFF peut :
1. Vérifier si le `login` existe déjà dans `authService`
2. Si non → créer un `Auth` et un `User`
3. Si oui → générer un JWT et connecter l'utilisateur



-----------------------------------------------------------

## La trame complète

---

### 1. L'utilisateur clique "Se connecter avec 42"

```
Frontend
──────────────────────────────────────
window.location.href = 'https://localhost:3000/auth/42'
```

Le navigateur fait une requête GET vers le BFF.

---

### 2. Le BFF redirige vers 42

```
BFF
──────────────────────────────────────
res.redirect('https://api.intra.42.fr/oauth/authorize?client_id=...&redirect_uri=...&response_type=code')
```

Le BFF ne fait rien d'autre que construire l'URL et rediriger. Le navigateur de l'utilisateur se retrouve sur la page de login de 42.

---

### 3. L'utilisateur se connecte sur 42

```
Page 42
──────────────────────────────────────
L'utilisateur entre son login et mot de passe 42.
42 vérifie les credentials.
```

C'est entièrement géré par 42 — tu n'as aucun code à écrire ici.

---

### 4. 42 redirige vers ton callback avec un code

```
API 42
──────────────────────────────────────
GET https://localhost:3000/auth/callback?code=abc123xyz
```

42 génère un **code d'autorisation temporaire** (valable ~10 secondes, usage unique) et redirige le navigateur vers ta `redirect_uri` en l'ajoutant dans l'URL.

---

### 5. Le BFF échange le code contre un token

```
BFF → API 42
──────────────────────────────────────
POST https://api.intra.42.fr/oauth/token
{
  grant_type:    'authorization_code',
  client_id:     'u-s4t2ud-xxx',
  client_secret: 's-s4t2ud-xxx',
  redirect_uri:  'https://localhost:3000/auth/callback',
  code:          'abc123xyz'
}
```

C'est l'étape clé — le BFF prouve à 42 deux choses :
- Il possède le code reçu → il est bien le destinataire du callback
- Il possède le `CLIENT_SECRET` → il est bien l'application enregistrée

42 retourne :
```json
{
  "access_token": "abc...xyz",
  "token_type":   "bearer",
  "expires_in":   7200,
  "scope":        "public"
}
```

---

### 6. Le BFF appelle `/v2/me` avec le token

```
BFF → API 42
──────────────────────────────────────
GET https://api.intra.42.fr/v2/me
Headers: { Authorization: 'Bearer abc...xyz' }
```

42 retourne les données de l'utilisateur connecté :
```json
{
  "login":      "adrien",
  "first_name": "Adrien",
  "last_name":  "Dupont",
  "email":      "adrien@student.42.fr",
  "image":      { "link": "https://..." }
}
```

---

### 7. Le BFF décide quoi faire

```
BFF → authService
──────────────────────────────────────
Est-ce que login42 = "adrien" existe dans la base ?
```

**Cas 1 — L'utilisateur existe déjà :**
```
authService retourne l'Auth existant
BFF génère un JWT
BFF redirige le frontend avec le JWT
```

**Cas 2 — Nouvel utilisateur :**
```
BFF appelle authService  → createOneAuth  (email, login42, password vide)
BFF appelle userService  → createOneUser  (username, firstName, lastName, avatar)
BFF génère un JWT
BFF redirige le frontend avec le JWT
```

---

### Résumé visuel complet

```
[1] Frontend      →  BFF            GET /auth/42
[2] BFF           →  API 42         redirect /oauth/authorize
[3] Utilisateur   →  API 42         login + password
[4] API 42        →  BFF            GET /auth/callback?code=xxx
[5] BFF           →  API 42         POST /oauth/token (code + secret)
[6] API 42        →  BFF            access_token
[7] BFF           →  API 42         GET /v2/me (Bearer token)
[8] API 42        →  BFF            login, firstName, lastName, email
[9] BFF           →  authService    existe ? sinon créer
[10] BFF          →  userService    existe ? sinon créer
[11] BFF          →  Frontend       JWT
```

---

### Pourquoi ce flow et pas un accès direct ?

| | Frontend direct | Via BFF |
|---|---|---|
| `CLIENT_SECRET` exposé | ✗ Oui — dangereux | ✓ Non — côté serveur |
| Token visible dans le navigateur | ✗ Oui | ✓ Non |
| Contrôle sur les données | ✗ Limité | ✓ Total |





________-----------____________------------____________----------__________--

## Flow d'inscription via l'API 42

```
Frontend                       BFF                        API 42                authService / userService
   │                            │                            │                            │
   │── GET /auth/register/42 ──▶│                            │                            │
   │                            │── redirect ───────────────▶│                            │
   │◀──────────────────────────────── page login 42 ─────────│                            │
   │── login + password ───────────────────────────────────▶│                            │
   │                            │◀─── code ─────────────────│                            │
   │                            │── échange code + secret ──▶│                            │
   │                            │◀─── access_token ──────────│                            │
   │                            │── GET /v2/me ──────────────▶│                            │
   │                            │◀─── login, email, etc. ────│                            │
   │                            │── GET /login/{login} ──────────────────────────────────▶│
   │                            │◀─── 404 (n'existe pas) ────────────────────────────────│
   │◀─── { login, first_name,   │                            │                            │
   │       last_name, email,    │                            │                            │
   │       avatar } ────────────│                            │                            │
   │                            │                            │                            │
   │                            │                            │                            │
   │── POST /auth/register ─────▶│                            │                            │
   │   { login, first_name,     │── POST /auth ─────────────────────────────────────────▶│
   │     last_name, email,      │── POST /users ─────────────────────────────────────────▶│
   │     password, avatar }     │◀─── 201 ───────────────────────────────────────────────│
   │◀─── JWT ───────────────────│                            │                            │
```

---

## Requête 1 — Redirection vers 42

Le frontend redirige simplement le navigateur, pas de `fetch` :

```javascript
// Frontend
window.location.href = 'https://localhost:3000/auth/register/42';
```

**Pas de body** — c'est une simple redirection.

---

## Requête 2 — Récupérer les données 42 après callback

Le BFF redirige automatiquement vers le frontend après le callback avec les données en query params, ou le frontend attend la réponse du BFF sur la page de callback.

Le BFF retourne :
```json
{
  "login":      "adrien",
  "first_name": "Adrien",
  "last_name":  "Dupont",
  "email":      "adrien@student.42.fr",
  "avatar":     "https://cdn.intra.42.fr/..."
}
```

Le frontend récupère ces données et affiche un **formulaire de finalisation** où l'utilisateur choisit son mot de passe.

---

## Requête 3 — Finaliser l'inscription

```javascript
// Frontend
const response = await fetch('https://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    login:      'adrien',        // récupéré depuis le callback
    first_name: 'Adrien',        // récupéré depuis le callback
    last_name:  'Dupont',        // récupéré depuis le callback
    email:      'adrien@42.fr',  // récupéré depuis le callback
    avatar:     'https://...',   // récupéré depuis le callback
    password:   'MonMotDePasse', // saisi par l'utilisateur
  }),
});

const { token } = await response.json();
// Stocker le JWT
localStorage.setItem('token', token);
```

---

## Récapitulatif

| # | Qui appelle | Route | Body | Réponse |
|---|---|---|---|---|
| 1 | Frontend | `GET /auth/register/42` | Aucun | Redirection vers 42 |
| 2 | API 42 | `GET /auth/register/callback` | Aucun (géré par 42) | `{ login, first_name, last_name, email, avatar }` |
| 3 | Frontend | `POST /auth/register` | `{ login, first_name, last_name, email, avatar, password }` | `{ token }` |