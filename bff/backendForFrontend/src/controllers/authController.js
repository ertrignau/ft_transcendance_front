const jwt = require('jsonwebtoken');
const bcrypt = require ('bcrypt');

exports.registerRedirectTo42 = (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.FORTYTWO_CLIENT_ID,
    redirect_uri:  process.env.FORTYTWO_REGISTER_REDIRECT_URI,
    response_type: 'code',
  });
  res.redirect(`https://api.intra.42.fr/oauth/authorize?${params}`);
};

exports.registerHandleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=login_cancelled`);
    }
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

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

    if (!access_token) {
      return res.status(401).json({ error: 'Failed to obtain access token.' });
    }

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user42 = await userResponse.json();

    const { login, first_name, last_name, email, image } = user42;
    const avatar = image?.versions?.medium ?? image?.link ?? null;
  
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/login/${login}`);

    if (response.ok)
      return res.status(409).json({ error: 'login42 already in use.' });
    
    if (response.status === 500) {
      return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
    }

    return res.status(200).json({ login, first_name, last_name, email, avatar });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.classicRegister = async (req, res) => {
  try {
    let user;
    try {
      user = JSON.parse(req.body.user);
    }
    catch {
      return res.status(400).json({ error: 'Invalid user data format.' });
    }

    const { username, firstName, lastName, email, password, avatar: avatar42, is42 } = user;

    const login42 = is42 ? username : null;

    if (!username || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'username, firstName, lastName, email, password and is42 are required.' });
    }

    const avatar = req.file ? `${process.env.BFF_URL}/uploads/images/${req.file.filename}` : avatar42 ?? null;

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    catch {
      return res.status(500).json({ error: 'Internal server error.' });
    }

    const authCheckResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/email/${email}`);

    if (authCheckResponse.ok) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    if (authCheckResponse.status !== 404) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    const userCheckResponse = await fetch(`${process.env.USER_SERVICE_URL}/username/${username}`);

    if (userCheckResponse.ok) {
      return res.status(409).json({ error: 'Username already in use.' });
    }

    if (userCheckResponse.status !== 404) {
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    const userResponse = await fetch(`${process.env.USER_SERVICE_URL}/`, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json'
      },
      body: JSON.stringify({
        username,
        firstName,
        lastName,
        avatar
      }),
    });

    if (!userResponse.ok) {
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    const data = await userResponse.json();
    const userId = data.id;

    const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/`, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json'
      },
      body: JSON.stringify({
        userId,
        email,
        password: hashedPassword,
        login42
      }),
    });

    if (!authResponse.ok) {
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    return res.sendStatus(201);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.authRedirectTo42 = (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.FORTYTWO_CLIENT_ID,
    redirect_uri:  process.env.FORTYTWO_AUTH_REDIRECT_URI,
    response_type: 'code',
  });
  res.redirect(`https://api.intra.42.fr/oauth/authorize?${params}`);
};

exports.authHandleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=login_cancelled`);
      }
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

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

    if (!access_token) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }

    const user42Response = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!user42Response.ok) {
      return res.status(502).json({ error: 'Failed to retrieve 42 user data.' });
    }
    const { login, campus, cursus, level } = await user42Response.json();

    if (!login) {
      return res.status(502).json({ error: 'Invalid response from 42 API.' });
    }
  
    const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/login/${login}`);

    if (authResponse.status === 404)
      return res.status(404).json({ error: 'No account found.' });
    
    if (!authResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
    }

    const [userResponse, friendsCount, followersCount, postsCount] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/${authResponse.userId}`).then(r => r.json()),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${authResponse.userId}`).then(r => r.json()),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${authResponse.userId}`).then(r => r.json()),
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/${authResponse.userId}`).then(r => r.json()),
    ]).catch(() => {
      return res.status(503).json({ error: 'Service unavailable.' });
    });

    const user = {  
        "id": authResponse.userId,                        
        "username": authResponse.login42,
        "email": authResponse.email,
        "firstName": userResponse.firstName,
        "lastName": userResponse.lastName,
        "bio": userResponse.bio,
        "theme": userResponse.theme,
        "avatar": userResponse.avatar,
        "campus": campus,
        "cursus": cursus,
        "level": level,
        "postsCount": postsCount,
        "followersCount": followersCount,
        "followingCount": friendsCount,
        "createdAt": userResponse.createdAt
    };

    let token;
    try {
      token = jwt.sign(
        { userId: auth.userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    }
    catch (error) {
      return res.status(500).json({ error: 'Failed to generate token.' });
    }

    return res.status(200).json({user : user, token : token});
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.authClassic = async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!req.body.password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  
  const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/email/${req.body.email}`);

  if (authResponse.status === 404)
    return res.status(404).json({ error: 'No account found.' });
  
  if (!authResponse.ok) {
    return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
  }

  let validPassword;
  try {
    validPassword = await bcrypt.compare(req.body.password, user.password);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const [userResponse, friendsCount, followersCount, postsCount] = await Promise.all([
    fetch(`${process.env.USER_SERVICE_URL}/${authResponse.userId}`).then(r => r.json()),
    fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${authResponse.userId}`).then(r => r.json()),
    fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${authResponse.userId}`).then(r => r.json()),
    fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/${authResponse.userId}`).then(r => r.json()),
  ]).catch(() => {
    return res.status(503).json({ error: 'Service unavailable.' });
  });

  const user = {  
      "id": authResponse.userId,                        
      "username": authResponse.login42,
      "email": authResponse.email,
      "firstName": userResponse.firstName,
      "lastName": userResponse.lastName,
      "bio": userResponse.bio,
      "theme": userResponse.theme,
      "avatar": userResponse.avatar,
      "postsCount": postsCount,
      "followersCount": followersCount,
      "followingCount": friendsCount,
      "createdAt": userResponse.createdAt
  };

  let token;
  try {
    token = jwt.sign(
      { userId: auth.userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  catch (error) {
    return res.status(500).json({ error: 'Failed to generate token.' });
  }
  
  return res.status(200).json({user : user, token : token});
};

exports.changePassword = async (req, res) => {
  try {
    const { password : oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }

    const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${req.userId}`);

    if (!authResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    const auth = await authResponse.json();

    let validPassword;
    try {
      validPassword = await bcrypt.compare(oldPassword, auth.password);
    }
    catch {
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }
    catch {
      return res.status(500).json({ error: 'Internal server error.' });
    }

    const updateResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${req.userId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: hashedPassword }),
    });

    if (!updateResponse.ok) {
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    return res.sendStatus(200);

  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};