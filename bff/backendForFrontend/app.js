const express = require ('express');
const app = express();
const multer = require('multer');
const bffRoutes = require('./src/routes');

// 🌍 Log environment variables at startup
console.log('\n🌍 === BFF APP STARTUP - ENVIRONMENT VARIABLES ===');
console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
console.log('USER_SERVICE_URL:', process.env.USER_SERVICE_URL);
console.log('SOCIAL_SERVICE_URL:', process.env.SOCIAL_SERVICE_URL);
console.log('CONTENT_SERVICE_URL:', process.env.CONTENT_SERVICE_URL);
console.log('NODE_EXTRA_CA_CERTS:', process.env.NODE_EXTRA_CA_CERTS);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('========================================\n');

app.use (express.json());

// 🌍 CORS Middleware - Apply to all requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((error, req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

app.use('/', bffRoutes);
app.use('/uploads', express.static('uploads'));

module.exports = app;