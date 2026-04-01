BFF ROUTES

# Fonctionnalités :

## AUTH (5)

- Register auprès de 42
- Register normal (user data et avatar dans un formData)
- Authentification 42 (reception data user complète)
- Authentification normale (reception data user sans les données de 42)
- Changer de password (auth)

## USER (10)

- récupérer tous les users
- récupérer les données d'un user
- modifier son profil utilisateur (user data et avatar dans un formData)
- restaurer les données de l'intra 42 (réinitialiser les données 42 et avatar 42 d'un user qui les a changés)
- supprimer son profil 
- récupérer les posts d'un user
- récupérer les posts qu'un user a commenté
- récupérer les posts qu'un user a liké
- récupérer les médias d'un user

- recherche users 42

## CONTENT (12)

- récupération des données des posts du feed à partir d'une date
- créer un post (texte ou non, media ou non)
- récupérer un post
- modifier son post
- supprimer son post
- récupérer les commentaires d'un post (à partir d'une date)
- créer un commentaire sur un post
- modifier son commentaire
- supprimer son commentaire
- récupérer les likes d'un post
- liker un post
- supprimer son like

// pour les posts et commentaires fais deux boutons dans le front : charger plus de comentaires / posts (requête avec date du dernier post ou comm chargé) + actualiser posts / commentaires (requête sans date pour repartir des plus récents)

## SOCIAL (4)

- récupérer ses followers
- récupérer ses amis 
- suivre un user
- ne plus suivre un user

---------------------------------------------------------------------------------------------------

# Routes par fonctionnalité

## AUTH  ------------------------------------------------------------------------------------------

### - Register auprès de 42
```json
requête : 
{
    method : GET,
    endpoint : '/register/42',
    body : {}
}
response : 
{
    status :
    body : {
        "login" : ,
        "first_name" : ,
        "last_name" : ,
        "email" : ,
        "avatar" :
    }
}
Puis requête POST '/register' classique avec les données reçues
```

### - Register normal (user data et avatar dans un formData)
```json
requête : 
{
    method : POST,
    endpoint : '/register',
    body : formData {
        "user" : {
            "username" : ,         // = login 42 si co avec 42
            "firstName" : ,
            "lastName" : ,
            "email" : ,
            "password" : ,
            "avatar" : ,          // = URL donnée par 42 ou null si register avec son propre avatar
            "is42" :              // boolean, = true si user 42
        },
        "avatar" :              // mettre le file correspondant, .jpg, .jpeg ou .png  OU ne pas mettre ce champ si register avec 42
    }
}
response : 
{
    status :
    body : {}
}
```

### - Authentification 42 (reception data user complète)
```json
requête : 
{
    method : GET,
    endpoint : '/auth/42',
    body : {}
}
response : 
{
    status :
    body : {
        "user" : {
            "id": ,                 // userId        
            "username": ,           
            "email": ,
            "firstName": ,
            "lastName": ,
            "bio": ,
            "theme": ,
            "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg si le user en a changé, gérer les deux possibilités en front
            "campus": ,
            "cursus": ,
            "level": ,
            "postsCount": ,
            "followersCount": ,
            "followingCount": ,
            "createdAt": 
        },
        "token" :                     // token à caler dans les requêtes 
        
    }
}
```

### - Authentification normale (reception data user sans les données de 42)
```json
requête : 
{
    method : POST,
    endpoint : '/auth/',
    body : {
        "email" : ,
        "password" : 
    }
}
response : 
{
    status :
    body : {
        "user" : {
            "id": ,                 // userId        
            "username": ,           
            "email": ,
            "firstName": ,
            "lastName": ,
            "bio": ,
            "theme": ,
            "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg, gérer les deux possibilités en front
            "postsCount": ,
            "followersCount": ,
            "followingCount": ,
            "createdAt": 
        },
        "token" :                     // token à caler dans les requêtes 
        
    }
}
```

### - Changer de password (auth)
```json
requête : 
{
    method : PUT,
    endpoint : '/auth/',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {
        "password" : ,
        "newPassword" : 
    }
}
response : 
{
    status :
    body : {}
}
```


## USER  ------------------------------------------------------------------------------------------

### - récupérer tous les users
```json
requête : 
{
    method : GET,
    endpoint : '/user',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id": ,                        
            "username": ,
            "email": ,
            "firstName": ,
            "lastName": ,
            "bio": ,
            "theme": ,
            "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg, gérer les deux possibilités en front
            "postsCount": ,
            "followersCount": ,
            "followingCount": ,
            "createdAt": 
        },
        ...
    ]
}
```

### - récupérer les données d'un user
```json
requête : 
{
    method : GET,
    endpoint : '/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {
      "id": ,                        
      "username": ,
      "email": ,
      "firstName": ,
      "lastName": ,
      "bio": ,
      "theme": ,
      "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg, gérer les deux possibilités en front
      "postsCount": ,
      "followersCount": ,
      "followingCount": ,
      "createdAt": 
    }
}
```

### - modifier son profil utilisateur (user data et avatar dans un formData)
```json
requête : 
{
    method : PUT,
    endpoint : '/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : formData {            
        "user" : {               // mettre uniquement les champs que le user veut changer sous la forme "username" : "Bob Marley"
            "username" : ,         
            "firstName" : ,
            "lastName" : ,
            "email" : 
        },
        "avatar" :              // mettre le file correspondant, .jpg, .jpeg ou .png  OU ne pas mettre ce champ si register avec 42 ou pas de changement d'avatar
    }
}
response : 
{
    status :
    body : {}
}
```

### - restaurer les données de l'intra 42 (réinitialiser les données 42 et avatar 42 d'un user qui les a changés)
```json
requête : 
{
    method : PUT,
    endpoint : '/user/data42/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}                       // pas besoin de body, le bff fait un appel à l'api de 42
}
response : 
{
    status :
    body : {                     // renvoie les données 42 pour que le front puisse les afficher si besoin
      "username": ,
      "email": ,
      "firstName": ,
      "lastName": ,
      "avatar": 
    }
}
```

### - supprimer son profil 
```json
requête : 
{
    method : DELETE,
    endpoint : '/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```

### - récupérer les posts d'un user
```json
requête : 
{
    method : GET,
    endpoint : '/post/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id" : ,              // postId
            "content" : ,         // peut être null 
            "image" : ,           // peut être null  
            "pdf" : ,             // peut être null  
            "userId" : , 
            "createdAt" : ,
            "modifiedAt" : ,
            "commentsCount" : ,
            "likesCount" :
        },
        ...
    ]
}
```

### - récupérer les posts qu'un user a commenté
```json
requête : 
{
    method : GET,
    endpoint : '/post/commented/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id" : ,              // postId
            "content" : ,         // peut être null 
            "image" : ,           // peut être null  
            "pdf" : ,             // peut être null  
            "userId" : , 
            "createdAt" : ,
            "modifiedAt" : ,
            "commentsCount" : ,
            "likesCount" :
        },
        ...
    ]
}
```

### - récupérer les posts qu'un user a liké
```json
requête : 
{
    method : GET,
    endpoint : '/post/liked/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id" : ,              // postId
            "content" : ,         // peut être null 
            "image" : ,           // peut être null  
            "pdf" : ,             // peut être null  
            "userId" : , 
            "createdAt" : ,
            "modifiedAt" : ,
            "commentsCount" : ,
            "likesCount" :
        },
        ...
    ]
}
```

### - récupérer les médias d'un user
```json
requête : 
{
    method : GET,
    endpoint : '/media/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {
        "avatar": {
            "filename": ,           // "abc-123_1711234567.jpg"
            "url":                  // "https://localhost:3005/uploads/images/abc-123_1711234567.jpg"
        },
        "pdfs": [
            {
                "filename": ,       // "abc-123_1711234568.pdf"
                "url":              // "https://localhost:3005/uploads/pdfs/abc-123_1711234568.pdf"
            },
            ...
        ],
        "images": [
            {
                "filename": ,       // "abc-123_1711234568.jpg"
                "url":              // "https://localhost:3005/uploads/images/abc-123_1711234568.jpg"
            },
            ...
        ]
    }
}
```

### - recherche users 42
```json
requête : 
{
    method : GET,
    endpoint : '/search42Users/:login',     // exmple fait pour recherche de "adrien"
    Authorization : token,                  // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id": ,
            "login": ,                  // "adrien"
            "displayName": ,
            "avatar": ,
            "campus": ,
            "cursus": ,
            "level":
        },
        {
            "id": ,
            "login": ,                  // "adrieng"
            "displayName": ,
            "avatar": ,
            "campus": ,
            "cursus": ,
            "level":
        },
        ...
    ]
}
```


## CONTENT  ---------------------------------------------------------------------------------------

### - récupération des données des posts du feed à partir d'une date
```json
requête : 
{
    method : GET,
    endpoint : '/post?date=value&limit=value',       // date : date du plus ancien post déjà chargé ou date.now() si paramètre absent, limit : nombre de posts donnés par requête (les posts sont toujours donnés du plus récent au plus ancien)
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id" : ,              // postId
            "content" : ,         // peut être null 
            "image" : ,           // peut être null  
            "pdf" : ,             // peut être null  
            "userId" : , 
            "createdAt" : ,
            "modifiedAt" : ,
            "commentsCount" : ,
            "likesCount" :
        },
        ...
    ]
}
```

### - créer un post (texte ou non, media ou non)
```json
requête : 
{
    method : POST,
    endpoint : '/post',
    body : formData {
        "post" : {
            "content" :          // mettre uniquement "post" si il y a un content 
        },
        "media" :              // mettre uniquement "media" si il y a un fichier : (.jpg, .jpeg ou .png)  ou pdf
    }
}
response : 
{
    status :
    body : {}
}
```

### - récupérer un post
```json
requête : 
{
    method : GET,
    endpoint : '/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {
        "id" : ,              // postId
        "content" : ,         // peut être null 
        "image" : ,           // peut être null  
        "pdf" : ,             // peut être null  
        "userId" : , 
        "createdAt" : ,
        "modifiedAt" : ,
        "commentsCount" : ,
        "likesCount" :
    }
}
```

### - modifier son post
```json
requête : 
{
    method : PUT,
    endpoint : '/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : formData {            
        "post" : {               // mettre uniquement "post" si le content change 
            "content" : 
        },
        "media" :                // mettre uniquement "media" si il le fichier change : (.jpg, .jpeg ou .png)  ou pdf
    }
}
response : 
{
    status :
    body : {}
}
```

### - supprimer son post
```json
requête : 
{
    method : DELETE,
    endpoint : '/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```

### - récupérer les commentaires d'un post (à partir d'une date)
```json
requête : 
{
    method : GET,
    endpoint : '/comment/post/:postId?date=value&limit=value',       // date : date du plus ancien commentaire déjà chargé ou date.now() si paramètre absent, limit : nombre de commentaires donnés par requête (les commentaires sont toujours donnés du plus récent au plus ancien)
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id" : ,              // commentId
            "content" : ,         
            "userId" : , 
            "postId" : ,
            "createdAt" : ,
            "modifiedAt" : ,
            "deleted" :
        },
        ...
    ]
}
```

### - créer un commentaire sur un post
```json
requête : 
{
    method : POST,
    endpoint : '/comment/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {
        "content" :
    }
}
response : 
{
    status :
    body : {}
}
```

### - modifier son commentaire
```json
requête : 
{
    method : PUT,
    endpoint : '/comment/:commentId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {
        "content" :
    }
}
response : 
{
    status :
    body : {}
}
```

### - supprimer son commentaire
```json
requête : 
{
    method : DELETE,
    endpoint : '/comment/:commentId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```

### - récupérer les likes d'un post
```json
requête : 
{
    method : GET,
    endpoint : '/like/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [            // renvoie les différents users qui ont liké le post
        {
            "userId" : 
        },
        ...
    ]
}
```

### - liker un post
```json
requête : 
{
    method : POST,
    endpoint : '/like',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {
        "postId" :
    }
}
response : 
{
    status :
    body : {}
}
```

### - supprimer son like
```json
requête : 
{
    method : DELETE,
    endpoint : '/like/post/:postId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```


## SOCIAL  ----------------------------------------------------------------------------------------

### - récupérer ses followers
```json
requête : 
{
    method : GET,
    endpoint : '/social/followers',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id": ,                        
            "username": ,
            "firstName": ,
            "lastName": ,
            "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg, gérer les deux possibilités en front
        },
        ...
    ]
}
```

### - récupérer ses amis 
```json
requête : 
{
    method : GET,
    endpoint : '/social/friends',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : [
        {
            "id": ,                        
            "username": ,
            "firstName": ,
            "lastName": ,
            "avatar": ,             // soit adresse de l'avatar 42, soit du style https://localhost:3000/files/avatars/abc-123_1711234567.jpg, gérer les deux possibilités en front
        },
        ...
    ]
}
```

### - suivre un user
```json
requête : 
{
    method : POST,
    endpoint : '/social/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```

### - ne plus suivre un user
```json
requête : 
{
    method : DELETE,
    endpoint : '/social/user/:userId',
    Authorization : token,          // 'Authorization' : `Bearer ${token}`,
    body : {}
}
response : 
{
    status :
    body : {}
}
```