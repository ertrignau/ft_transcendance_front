const express = require ('express');
const app = express();
const multer = require('multer');
const bffRoutes = require('./src/routes');

app.use (express.json());
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