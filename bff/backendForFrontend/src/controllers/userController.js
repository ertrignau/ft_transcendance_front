const fs   = require('fs');
const path = require('path');

exports.getAllUsers = async (req, res) => {
  try {
    const [usersResponse, authsResponse] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/`),
      fetch(`${process.env.AUTH_SERVICE_URL}/`),
    ]);

    if (!usersResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    if (!authsResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    const [users, auths] = await Promise.all([
      usersResponse.json(),
      authsResponse.json(),
    ]);

    const authsByUserId = auths.reduce((acc, auth) => {
      acc[auth.userId] = auth;
      return acc;
    }, {});     // transforme le tableau de auths en object avec comme clés les valeurs des userId

    const countsResponses = await Promise.all(
      users.map(user => Promise.all([
          fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${user.id}`).then(r => r.json()),
          fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${user.id}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/user/${user.id}`).then(r => r.json()),
        ])
      )
    );

    const result = users.map((user, index) => {
      const auth = authsByUserId[user.id];
      const [followersCount, friendsCount, postsCount] = countsResponses[index];

      return {
        id:             user.id,
        username:       user.username,
        email:          auth?.email ?? null,
        firstName:      user.firstName,
        lastName:       user.lastName,
        bio:            user.bio,
        theme:          user.theme,
        avatar:         user.avatar,
        postsCount:     postsCount?.count     ?? 0,
        followersCount: followersCount?.count ?? 0,
        followingCount: friendsCount?.count   ?? 0,
        createdAt:      user.createdAt,
      };
    });

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [userResponse, authResponse, followersCount, friendsCount, postsCount] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/${userId}`),
      fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${userId}`).then(r => r.json()),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${userId}`).then(r => r.json()),
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/user/${userId}`).then(r => r.json()),
    ]);

    if (userResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!userResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    if (!authResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    const [user, auth] = await Promise.all([
      userResponse.json(),
      authResponse.json(),
    ]);

    return res.status(200).json({
      id:             user.id,
      username:       user.username,
      email:          auth.email,
      firstName:      user.firstName,
      lastName:       user.lastName,
      bio:            user.bio,
      theme:          user.theme,
      avatar:         user.avatar,
      postsCount:     postsCount?.count     ?? 0,
      followersCount: followersCount?.count ?? 0,
      followingCount: friendsCount?.count   ?? 0,
      createdAt:      user.createdAt,
    });

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.modifyOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    let user;
    try {
      user = JSON.parse(req.body.user);
    } catch {
      return res.status(400).json({ error: 'Invalid user data format.' });
    }

    const { username, firstName, lastName, email } = user;

    const avatar = req.file ? `${process.env.BFF_URL}/uploads/images/${req.file.filename}` : undefined;

    const userUpdateResponse = await fetch(`${process.env.USER_SERVICE_URL}/${userId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(username  && { username }),
        ...(firstName && { firstName }),
        ...(lastName  && { lastName }),
        ...(avatar    && { avatar })
      }),
    });

    if (userUpdateResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!userUpdateResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    if (email) {
      const authUpdateResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (authUpdateResponse.status === 404) {
        return res.status(404).json({ error: 'Auth not found.' });
      }

      if (!authUpdateResponse.ok) {
        return res.status(503).json({ error: 'Auth service unavailable.' });
      }
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getBack42Datas = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`);

    if (authResponse.status === 404) {
      return res.status(404).json({ error: 'Auth not found.' });
    }

    if (!authResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    const auth = await authResponse.json();

    if (!auth.login42) {
      return res.status(400).json({ error: 'No 42 account linked.' });
    }

    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'client_credentials',
        client_id:     process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      return res.status(502).json({ error: 'Failed to obtain 42 token.' });
    }

    const { access_token } = await tokenResponse.json();

    if (!access_token) {
      return res.status(502).json({ error: 'Failed to obtain 42 token.' });
    }

    const user42Response = await fetch(`https://api.intra.42.fr/v2/users/${auth.login42}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!user42Response.ok) {
      return res.status(502).json({ error: 'Failed to retrieve 42 user data.' });
    }

    const user42 = await user42Response.json();

    const { login, first_name, last_name, email, image } = user42;
    const avatar42 = image?.versions?.medium ?? image?.link ?? null;

    const [userUpdateResponse, authUpdateResponse] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/${userId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: login,
          firstName: first_name,
          lastName: last_name,
          avatar: avatar42,
        }),
      }),
      fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
    ]);

    if (!userUpdateResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    if (!authUpdateResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    return res.status(200).json({
      username:  login,
      email,
      firstName: first_name,
      lastName:  last_name,
      avatar:    avatar42,
    });

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.deleteOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const [contentResponse, socialResponse, authResponse, userResponse] = await Promise.all([
      fetch(`${process.env.CONTENT_SERVICE_URL}/user/${userId}`, { method: 'DELETE' }),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/user/${userId}`,  { method: 'DELETE' }),
      fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`, { method: 'DELETE' }),
      fetch(`${process.env.USER_SERVICE_URL}/${userId}`, { method: 'DELETE' })
    ]);

    if (authResponse.status === 404 || userResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!authResponse.ok || !userResponse.ok || !socialResponse.ok || !contentResponse.ok) {
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostsFromUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [postsResponse, userResponse] = await Promise.all([
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/user/${userId}`),
      fetch(`${process.env.USER_SERVICE_URL}/${userId}`),
    ]);

    if (postsResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!postsResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const posts = await postsResponse.json();
    const userData = userResponse.ok ? await userResponse.json() : null;

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    const countsResponses = await Promise.all(
      posts.map(post =>
        Promise.all([
          fetch(`${process.env.CONTENT_SERVICE_URL}/comment/count/post/${post.id}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/like/count/post/${post.id}`).then(r => r.json()),
        ])
      )
    );

    const result = posts.map((post, index) => {
      const [commentsCount, likesCount] = countsResponses[index];

      return {
        id:            post.id,
        content:       post.content    ?? null,
        image:         post.image      ?? null,
        pdf:           post.pdf        ?? null,
        userId:        post.userId,
        author:        userData?.username || userData?.firstName || 'User',
        avatar:        userData?.avatar || null,
        createdAt:     post.createdAt,
        modifiedAt:    post.modifiedAt,
        commentsCount: commentsCount?.count ?? 0,
        likesCount:    likesCount?.count    ?? 0,
      };
    });

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostsCommentedByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const commentsResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/comment/user/${userId}`);

    if (commentsResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!commentsResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const comments = await commentsResponse.json();

    if (comments.length === 0) {
      return res.status(200).json([]);
    }

    const postIds = [...new Set(comments.map(comment => comment.postId))]; // remet en tableau la liste de string qui a viré les doublons

    const postsResponses = await Promise.all(
      postIds.map(postId =>
        Promise.all([
          fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/comment/count/post/${postId}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/like/count/post/${postId}`).then(r => r.json()),
        ])
      )
    );

    const result = postsResponses.map(([post, commentsCount, likesCount]) => ({
      id: post.id,
      content: post.content ?? null,
      image: post.image ?? null,
      pdf: post.pdf ?? null,
      userId: post.userId,
      createdAt: post.createdAt,
      modifiedAt: post.modifiedAt,
      commentsCount: commentsCount?.count ?? 0,
      likesCount: likesCount?.count ?? 0,
    }));

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getPostsLikedByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const likesResponse = await fetch(`${process.env.CONTENT_SERVICE_URL}/like/user/${userId}`);

    if (likesResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!likesResponse.ok) {
      return res.status(503).json({ error: 'Content service unavailable.' });
    }

    const likes = await likesResponse.json();

    if (likes.length === 0) {
      return res.status(200).json([]);
    }

    const postIds = [...new Set(likes.map(like => like.postId))];

    const postsResponses = await Promise.all(
      postIds.map(postId =>
        Promise.all([
          fetch(`${process.env.CONTENT_SERVICE_URL}/post/${postId}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/comment/count/post/${postId}`).then(r => r.json()),
          fetch(`${process.env.CONTENT_SERVICE_URL}/like/count/post/${postId}`).then(r => r.json()),
        ])
      )
    );

    const result = postsResponses.map(([post, commentsCount, likesCount]) => ({
      id:            post.id,
      content:       post.content    ?? null,
      image:         post.image      ?? null,
      pdf:           post.pdf        ?? null,
      userId:        post.userId,
      createdAt:     post.createdAt,
      modifiedAt:    post.modifiedAt,
      commentsCount: commentsCount?.count ?? 0,
      likesCount:    likesCount?.count    ?? 0,
    }));

    return res.status(200).json(result);

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getMediasFromUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userResponse = await fetch(`${process.env.USER_SERVICE_URL}/${userId}`);

    if (userResponse.status === 404) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!userResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    const user = await userResponse.json();

    const avatar = user.avatar ? {
      filename: path.basename(user.avatar),
      url:      user.avatar,
    } : null;

    const getFiles = (folder, extension) => {
      const dir = `../uploads/${folder}`;
      if (!fs.existsSync(dir)) return [];

      return fs.readdirSync(dir)    // retourne tableau de noms de files
        .filter(file => file.startsWith(userId) && file.endsWith(extension))
        .map(file => ({
          filename: file,
          url: `${process.env.BFF_URL}/uploads/${folder}/${file}`,
        }));
    };

    const pdfs   = getFiles('pdfs', '.pdf');
    const images = getFiles('images', '.jpg')
      .concat(getFiles('images', '.jpeg'))
      .concat(getFiles('images', '.png'));

    return res.status(200).json({
      avatar,
      pdfs,
      images,
    });

  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getValid42Token = async () => {
  try {
    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'client_credentials',
        client_id:     process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      return res.status(502).json({ error: 'Failed to retrieve 42 token.' });
    }
    return data.access_token;
  }
  catch (error) {
    return res.status(502).json({ error: 'Failed to retrieve 42 token.' });
  }
};

exports.search42Users = async (req, res) => {
  try {
    const { login } = req.params;

    if (!login || login.trim() === '') {
      return res.status(400).json({ error: 'Search cannot be empty.' });
    }

    const accessToken = await getValid42Token();

    const params = new URLSearchParams({
      'search[login]': login,
      per_page:        10,
    });

    const response = await fetch(`https://api.intra.42.fr/v2/users?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    const users = data.map((user) => {
      const cursus42 = user.cursus_users?.find(c => c.cursus.slug === '42cursus');

      return {
        id:          user.id,
        login:       user.login,
        displayName: user.displayname     ?? user.usual_full_name,
        avatar:      user.image?.versions?.medium ?? user.image?.link,
        campus:      user.campus?.[0]?.name       ?? 'Unknown',
        cursus:      cursus42?.cursus?.name        ?? '42',
        level:       cursus42?.level               ?? 0,
      };
    });

    return res.status(200).json(users);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.searchLocalUsers = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search cannot be empty.' });
    }

    const userResponse = await fetch(`${process.env.USER_SERVICE_URL}/search/${encodeURIComponent(query)}`);

    if (!userResponse.ok) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    const users = await userResponse.json();

    return res.status(200).json(users);
  }
  catch (error) {
    console.error('❌ searchLocalUsers error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};