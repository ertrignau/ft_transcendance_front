const jwt = require('jsonwebtoken');
const bcrypt = require ('bcrypt');
const fs = require('fs');
const path = require('path');
const { Agent } = require('undici');  // Use undici.Agent for fetch() compatibility

// Setup undici agent with CA certificate for inter-service HTTPS calls
const caPath = path.join(__dirname, '../../certs/ca.crt');
let httpsAgent;
try {
  const caContent = fs.readFileSync(caPath);
  httpsAgent = new Agent({
    connect: {
      ca: [caContent],
      rejectUnauthorized: false,  // For local dev with self-signed certificates
    },
  });
  console.log('✅ [AUTH-CONTROLLER] Undici agent configured with CA (self-signed bypass)');
} catch (err) {
  console.error('❌ [AUTH-CONTROLLER] Failed to load CA certificate:', err.message);
  httpsAgent = new Agent({
    connect: { rejectUnauthorized: false },
  });
}

exports.registerRedirectTo42 = (req, res) => {
  console.log('🟢 [BFF-AUTH] GET /register/42 - Redirects to 42 OAuth');
  const params = new URLSearchParams({
    client_id:     process.env.FORTYTWO_CLIENT_ID,
    redirect_uri:  process.env.FORTYTWO_REGISTER_REDIRECT_URI,
    response_type: 'code',
  });
  const authUrl = `https://api.intra.42.fr/oauth/authorize?${params}`;
  console.log('🟢 [BFF-AUTH] Sending OAuth URL:', authUrl);
  // Return URL as JSON instead of redirecting (to avoid CORS/OpaqueResponse blocking)
  res.json({ authUrl });
};

exports.registerHandleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    console.log('🟢 [BFF-AUTH] GET /register/callback - OAuth callback from 42');
    console.log('🟢 [BFF-AUTH] Query params - code:', !!code, 'error:', error);
    
    if (error) {
      console.warn('⚠️ [BFF-AUTH] OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}?error=login_cancelled`);
    }
    if (!code) {
      console.error('❌ [BFF-AUTH] Missing authorization code');
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

    console.log('🟢 [BFF-AUTH] Exchanging code for 42 API access token');
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        redirect_uri:  process.env.FORTYTWO_REGISTER_REDIRECT_URI,  // ← Changed from FORTYTWO_REDIRECT_URI
        code,
      }),
    });
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('❌ [BFF-AUTH] Failed to get access token from 42:', tokenData);
      return res.status(401).json({ error: 'Failed to obtain access token.' });
    }
    
    console.log('🟢 [BFF-AUTH] Access token obtained from 42 API');
    const { access_token } = tokenData;

    console.log('🟢 [BFF-AUTH] Fetching user data from 42 API');
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user42 = await userResponse.json();

    const { login, first_name, last_name, email, image } = user42;
    const avatar = image?.versions?.medium ?? image?.link ?? null;
    console.log('🟢 [BFF-AUTH] User data from 42:', { login, email, first_name, last_name });
  
    console.log('🟢 [BFF-AUTH] Checking if login already exists in auth service');
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/login/${login}`);

    if (response.ok) {
      console.warn('⚠️ [BFF-AUTH] Login', login, 'already in use');
      return res.status(409).json({ error: 'login42 already in use.' });
    }
    
    if (response.status === 500) {
      console.error('❌ [BFF-AUTH] Auth service unavailable');
      return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
    }

    // Create a temporary JWT token containing the 42 user data for Register42 page
    console.log('🟢 [BFF-AUTH] Creating temporary JWT token');
    const tempToken = jwt.sign(
      {
        login,
        first_name,
        last_name,
        email,
        avatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }  // Token valid for 15 minutes
    );

    // Redirect to frontend Register42 page with the temp token
    const redirectUrl = `${process.env.FRONTEND_URL}/register42?tempToken=${tempToken}`;
    console.log('🟢 [BFF-AUTH] Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  }
  catch (error) {
    console.error('❌ [BFF-AUTH] registerHandleCallback error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.classicRegister = async (req, res) => {
  try {
    console.log('📝 REGISTER: Starting registration...');
    let user;
    try {
      // Handle both JSON body and form data with user field
      user = typeof req.body.user === 'string' ? JSON.parse(req.body.user) : req.body;
      console.log('✓ REGISTER: User parsed:', user);
    }
    catch (e) {
      console.error('✗ REGISTER: Failed to parse user:', e.message);
      return res.status(400).json({ error: 'Invalid user data format.' });
    }

    const { username, firstName, lastName, email, password, avatar: avatar42, is42 } = user;
    const normalizedEmail = email.toLowerCase();  // Normalize email to lowercase
    console.log('✓ REGISTER: User data extracted - username:', username, 'email:', normalizedEmail);

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

    console.log('📡 REGISTER: Checking email in AUTH_SERVICE...');
    console.log('   URL:', `${process.env.AUTH_SERVICE_URL}/email/${normalizedEmail}`);
    console.log('   Environment - AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
    console.log('   NODE_EXTRA_CA_CERTS:', process.env.NODE_EXTRA_CA_CERTS);
    let authCheckResponse;
    try {
      authCheckResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/email/${normalizedEmail}`, { agent: httpsAgent });
      console.log('✅ REGISTER: AUTH_SERVICE responded with status:', authCheckResponse.status);
    } catch (err) {
      console.error('❌ REGISTER: AUTH_SERVICE fetch failed!');
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      console.error('   Error stack:', err.stack);
      return res.status(503).json({ error: 'Auth service unavailable (fetch failed).' });
    }

    if (authCheckResponse.ok) {
      console.log('⚠ REGISTER: Email already in use');
      return res.status(409).json({ error: 'Email already in use.' });
    }

    if (authCheckResponse.status !== 404) {
      console.error('✗ REGISTER: AUTH_SERVICE unavailable, status:', authCheckResponse.status);
      return res.status(503).json({ error: 'Auth service unavailable.' });
    }

    console.log('📡 REGISTER: Checking username in USER_SERVICE...');
    console.log('   URL:', `${process.env.USER_SERVICE_URL}/username/${username}`);
    console.log('   Environment - USER_SERVICE_URL:', process.env.USER_SERVICE_URL);
    let userCheckResponse;
    try {
      userCheckResponse = await fetch(`${process.env.USER_SERVICE_URL}/username/${username}`, { agent: httpsAgent });
      console.log('✅ REGISTER: USER_SERVICE responded with status:', userCheckResponse.status);
    } catch (err) {
      console.error('❌ REGISTER: USER_SERVICE fetch failed!');
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      console.error('   Error stack:', err.stack);
      return res.status(503).json({ error: 'User service unavailable (fetch failed).' });
    }

    if (userCheckResponse.ok) {
      console.log('⚠ REGISTER: Username already in use');
      return res.status(409).json({ error: 'Username already in use.' });
    }

    if (userCheckResponse.status !== 404) {
      console.error('✗ REGISTER: USER_SERVICE unavailable, status:', userCheckResponse.status);
      return res.status(503).json({ error: 'User service unavailable.' });
    }

    console.log('📡 REGISTER: Creating user in USER_SERVICE...');
    console.log('   URL:', `${process.env.USER_SERVICE_URL}/`);
    let userResponse;
    try {
      userResponse = await fetch(`${process.env.USER_SERVICE_URL}/`, {
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
        agent: httpsAgent,
      });
      console.log('✅ REGISTER: USER_SERVICE responded with status:', userResponse.status);
    } catch (err) {
      console.error('❌ REGISTER: USER_SERVICE POST fetch failed!');
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      console.error('   Error stack:', err.stack);
      return res.status(503).json({ error: 'User service unavailable (fetch failed).' });
    }

    if (!userResponse.ok) {
      const errText = await userResponse.text();
      console.error('✗ REGISTER: Failed to create user, response:', errText);
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    const data = await userResponse.json();
    const userId = data.id;
    console.log('✓ REGISTER: User created with id:', userId);

    console.log('📡 REGISTER: Creating auth record in AUTH_SERVICE...');
    console.log('   URL:', `${process.env.AUTH_SERVICE_URL}/`);
    let authResponse;
    try {
      authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/`, {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json'
        },
        body: JSON.stringify({
          userId,
          email: normalizedEmail,
          password: hashedPassword,
          login42
        }),
        agent: httpsAgent,
      });
      console.log('✅ REGISTER: AUTH_SERVICE responded with status:', authResponse.status);
    } catch (err) {
      console.error('❌ REGISTER: AUTH_SERVICE POST fetch failed!');
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      console.error('   Error stack:', err.stack);
      return res.status(503).json({ error: 'Auth service unavailable (fetch failed).' });
    }

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.error('✗ REGISTER: Failed to create auth, response:', errText);
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    console.log('✅ REGISTER: User registered successfully!');
    
    // Si inscription 42, retourner le token et les données utilisateur pour connexion automatique
    if (is42) {
      console.log('🟢 REGISTER: is42=true, generating JWT token for automatic login');
      try {
        const token = jwt.sign(
          { userId: userId },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Récupérer les données complètes de l'utilisateur
        const userFullDataResponse = await fetch(`${process.env.USER_SERVICE_URL}/${userId}`, { agent: httpsAgent });
        const userFullData = await userFullDataResponse.json();
        
        const user = {
          id: userId,
          username: username,
          email: email,
          firstName: firstName,
          lastName: lastName,
          avatar: userFullData.avatar || avatar,
          theme: userFullData.theme,
          bio: userFullData.bio,
          createdAt: userFullData.createdAt,
        };
        
        console.log('🟢 REGISTER: Returning user data and JWT token for 42 registration');
        return res.status(201).json({ user, token });
      } catch (error) {
        console.error('❌ REGISTER: Failed to generate token for 42 registration:', error);
        return res.status(500).json({ error: 'Failed to generate authentication token.' });
      }
    }
    
    // Pour inscription classique, retourner juste 201
    return res.sendStatus(201);
  }
  catch (error) {
    console.error('❌ REGISTER ERROR:', error.message, error.stack);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.authRedirectTo42 = (req, res) => {
  console.log('🟢 [BFF-AUTH] GET /auth/42 - Redirects to 42 OAuth for login');
  const params = new URLSearchParams({
    client_id:     process.env.FORTYTWO_CLIENT_ID,
    redirect_uri:  process.env.FORTYTWO_AUTH_REDIRECT_URI,
    response_type: 'code',
  });
  const authUrl = `https://api.intra.42.fr/oauth/authorize?${params}`;
  console.log('🟢 [BFF-AUTH] Sending OAuth URL:', authUrl);
  // Return URL as JSON instead of redirecting (to avoid CORS/OpaqueResponse blocking)
  res.json({ authUrl });
};

exports.authHandleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    console.log('🟢 [BFF-AUTH] GET /auth/callback - OAuth callback from 42 (LOGIN)');
    console.log('🟢 [BFF-AUTH] Query params - code:', !!code, 'error:', error);
    
    if (error) {
        console.warn('⚠️ [BFF-AUTH] OAuth error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}?error=login_cancelled`);
      }
    if (!code) {
      console.error('❌ [BFF-AUTH] Missing authorization code');
      return res.status(400).json({ error: 'Authorization code missing.' });
    }

    console.log('🟢 [BFF-AUTH] Exchanging code for 42 API access token');
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        client_id:     process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        redirect_uri:  process.env.FORTYTWO_AUTH_REDIRECT_URI,  // ← Changed from FORTYTWO_REDIRECT_URI
        code,
      }),
    });
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('❌ [BFF-AUTH] Failed to get access token from 42:', tokenData);
      return res.status(401).json({ error: 'Authentication failed.' });
    }
    
    console.log('🟢 [BFF-AUTH] Access token obtained from 42 API');
    const { access_token } = tokenData;

    console.log('🟢 [BFF-AUTH] Fetching user data from 42 API');
    const user42Response = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!user42Response.ok) {
      console.error('❌ [BFF-AUTH] Failed to retrieve 42 user data');
      return res.status(502).json({ error: 'Failed to retrieve 42 user data.' });
    }
    const { login, campus, cursus, level } = await user42Response.json();
    console.log('🟢 [BFF-AUTH] User data from 42:', { login, campus, cursus, level });

    if (!login) {
      console.error('❌ [BFF-AUTH] Invalid response from 42 API - missing login');
      return res.status(502).json({ error: 'Invalid response from 42 API.' });
    }
  
    console.log('🟢 [BFF-AUTH] Checking user in auth service:', login);
    const authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/login/${login}`);

    if (authResponse.status === 404) {
      console.warn('⚠️ [BFF-AUTH] No account found for', login);
      return res.status(404).json({ error: 'No account found.' });
    }
    
    if (!authResponse.ok) {
      console.error('❌ [BFF-AUTH] Auth service error:', authResponse.status);
      return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
    }

    // Parse the auth service response to get userId, email, etc.
    const authData = await authResponse.json();
    console.log('🟢 [BFF-AUTH] Auth data received:', { userId: authData.userId, login42: authData.login42 });

    console.log('🟢 [BFF-AUTH] User found in auth service, fetching complete user data');
    
    // Fetch all services in parallel
    console.log('📡 [BFF-AUTH] Fetching from all services in parallel...');
    let [userResp, friendsResp, followersResp, postsResp] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/${authData.userId}`),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${authData.userId}`),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${authData.userId}`),
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/user/${authData.userId}`),
    ]);

    // If user doesn't exist in USER_SERVICE, create it automatically
    if (userResp.status === 404) {
      console.log('⚠️ [BFF-AUTH] User not found in USER_SERVICE, creating automatically...');
      const createUserResp = await fetch(`${process.env.USER_SERVICE_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: authData.userId,
          username: authData.login42,
          firstName: login.split('.')[0] || 'User',
          lastName: login.split('.')[1] || 'Unknown',
          avatar: null,
          theme: 'LIGHT',
          langue: 'en'
        })
      });
      
      if (createUserResp.ok) {
        console.log('🟢 [BFF-AUTH] User created successfully in USER_SERVICE');
        // Refetch user data after creation
        userResp = await fetch(`${process.env.USER_SERVICE_URL}/${authData.userId}`);
      } else {
        console.error('❌ [BFF-AUTH] Failed to create user in USER_SERVICE:', createUserResp.status);
      }
    }

    console.log('📥 [BFF-AUTH] Responses received - USER:', userResp.status, 'SOCIAL(friends):', friendsResp.status, 'SOCIAL(followers):', followersResp.status, 'CONTENT:', postsResp.status);

    // Parse USER_SERVICE response
    let userResponse = {
      firstName: 'Unknown',
      lastName: 'User',
      avatar: null,
      bio: null,
      theme: 'light',
      createdAt: new Date().toISOString()
    };
    
    if (!userResp.ok) {
      console.error('❌ [BFF-AUTH] USER_SERVICE failed with status:', userResp.status);
      const errText = await userResp.text().catch(() => 'Unknown error');
      console.error('❌ [BFF-AUTH] USER_SERVICE error:', errText.substring(0, 200));
    } else {
      userResponse = await userResp.json().catch(err => {
        console.error('❌ [BFF-AUTH] USER_SERVICE JSON parse error:', err);
        return userResponse; // Return default
      });
    }

    // Parse SOCIAL_SERVICE (friends) response
    let friendsCount = { count: 0 };
    if (!friendsResp.ok) {
      console.error('❌ [BFF-AUTH] SOCIAL_SERVICE (friends) failed with status:', friendsResp.status);
    } else {
      friendsCount = await friendsResp.json().catch(err => {
        console.error('❌ [BFF-AUTH] SOCIAL_SERVICE (friends) JSON parse error:', err);
        return { count: 0 };
      });
    }

    // Parse SOCIAL_SERVICE (followers) response
    let followersCount = { count: 0 };
    if (!followersResp.ok) {
      console.error('❌ [BFF-AUTH] SOCIAL_SERVICE (followers) failed with status:', followersResp.status);
    } else {
      followersCount = await followersResp.json().catch(err => {
        console.error('❌ [BFF-AUTH] SOCIAL_SERVICE (followers) JSON parse error:', err);
        return { count: 0 };
      });
    }

    // Parse CONTENT_SERVICE response
    let postsCount = { count: 0 };
    if (!postsResp.ok) {
      console.error('❌ [BFF-AUTH] CONTENT_SERVICE failed with status:', postsResp.status);
    } else {
      postsCount = await postsResp.json().catch(err => {
        console.error('❌ [BFF-AUTH] CONTENT_SERVICE JSON parse error:', err);
        return { count: 0 };
      });
    }

    // Extract campus name if available (campus is an array)
    const campusName = Array.isArray(campus) && campus.length > 0 ? campus[0].name : 'Unknown';
    const cursusName = Array.isArray(cursus) && cursus.length > 0 ? cursus[0].name : undefined;

    const user = {  
        "id": authData.userId,                        
        "username": authData.login42,
        "email": authData.email,
        "firstName": userResponse.firstName,
        "lastName": userResponse.lastName,
        "bio": userResponse.bio,
        "theme": userResponse.theme,
        "avatar": userResponse.avatar,
        "campus": campusName,
        "cursus": cursusName,
        "level": level,
        "postsCount": postsCount.count || postsCount,
        "followersCount": followersCount.count || followersCount,
        "followingCount": friendsCount.count || friendsCount,
        "createdAt": userResponse.createdAt
    };

    let token;
    try {
      token = jwt.sign(
        { userId: authData.userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    }
    catch (error) {
      console.error('❌ [BFF-AUTH] Failed to generate token:', error);
      return res.status(500).json({ error: 'Failed to generate token.' });
    }

    console.log('🟢 [BFF-AUTH] Authentication successful for', login, 'with userId:', authData.userId);
    console.log('🟢 [BFF-AUTH] User stats - posts:', postsCount.count || postsCount, 'followers:', followersCount.count || followersCount, 'following:', friendsCount.count || friendsCount);
    console.log('🟢 [BFF-AUTH] Generated JWT token');
    
    // Redirect to frontend callback with token as query param
    const redirectUrl = `${process.env.FRONTEND_URL}/callback?token=${token}`;
    console.log('🟢 [BFF-AUTH] Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  }
  catch (error) {
    console.error('❌ [BFF-AUTH] authHandleCallback error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.authClassic = async (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email or username is required.' });
  }

  if (!req.body.password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  
  const loginInput = req.body.email;  // Can be email or username
  const normalizedEmail = loginInput.toLowerCase();
  
  // First try to find by email
  let authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/email/${normalizedEmail}`);
  let authData;
  
  // If not found by email, try to find by username
  if (authResponse.status === 404) {
    console.log('Auth not found by email, trying by username...');
    // Try to find user by username first
    try {
      const userResponse = await fetch(`${process.env.USER_SERVICE_URL}/username/${loginInput}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        // Now fetch auth by userId
        authResponse = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${userData.id}`);
      } else {
        console.log('User not found by username either, status:', userResponse.status);
      }
    } catch (err) {
      console.error('Error searching by username:', err);
    }
  }

  if (!authResponse || authResponse.status === 404)
    return res.status(404).json({ error: 'No account found.' });
  
  if (!authResponse.ok) {
    return res.status(503).json({ error: 'Auth service unavailable, please try again later.' });
  }

  // Parse the auth data from authService
  authData = await authResponse.json();

  let validPassword;
  try {
    validPassword = await bcrypt.compare(req.body.password, authData.password);
  }
  catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  let userResponse, friendsCount, followersCount, postsCount;
  try {
    const [userResp, friendsResp, followersResp, postsResp] = await Promise.all([
      fetch(`${process.env.USER_SERVICE_URL}/${authData.userId}`),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/friendsCount/${authData.userId}`),
      fetch(`${process.env.SOCIAL_SERVICE_URL}/followersCount/${authData.userId}`),
      fetch(`${process.env.CONTENT_SERVICE_URL}/post/count/user/${authData.userId}`),
    ]);

    if (!userResp.ok || !friendsResp.ok || !followersResp.ok || !postsResp.ok) {
      console.error('Service error - User:', userResp.status, 'Friends:', friendsResp.status, 'Followers:', followersResp.status, 'Posts:', postsResp.status);
      return res.status(503).json({ error: 'Service unavailable.' });
    }

    userResponse = await userResp.json();
    friendsCount = await friendsResp.json();
    followersCount = await followersResp.json();
    postsCount = await postsResp.json();
  } catch (err) {
    console.error('Error fetching user data:', err);
    return res.status(503).json({ error: 'Service unavailable.' });
  }

  const user = {  
      "id": authData.userId,                        
      "username": userResponse.username,
      "email": authData.email,
      "firstName": userResponse.firstName,
      "lastName": userResponse.lastName,
      "bio": userResponse.bio,
      "theme": userResponse.theme,
      "avatar": userResponse.avatar,
      "postsCount": postsCount,
      "followersCount": followersCount,
      "followingCount": friendsCount,
      "createdAt": userResponse.createdAt,
      "intraId": null,
      "login42": authData.login42 || null
  };

  let token;
  try {
    token = jwt.sign(
      { userId: authData.userId },
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