const jwt = require('jsonwebtoken');

const validateAuthorization = (authorization) => {
  if (typeof authorization !== 'string')
    return false;
  if (authorization.length < 10)
    return false;
  if (authorization.length > 1000)
    return false;
  if (!/^Bearer\s\S+$/.test(authorization))
    return false;
  return true;
};

exports.classicAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!validateAuthorization(authorization)) {
    return res.status(401).json({ error: 'Invalid authorization format.' });
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  }
  catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const response = await fetch(`${process.env.AUTH_SERVICE_URL}/id/${decoded.userId}`);
  if (!response.ok) {
    return res.status(401).json({ error: 'User not found.' });
  }

  next();
};