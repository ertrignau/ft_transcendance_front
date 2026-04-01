require('dotenv').config();
const https = require('https');  // ← Changé de http à https
const fs = require('fs');         // ← Ajouté pour lire les certificats
const app = require('./app');

// convertit une valeur string en nombre, doit être > 0

const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return false;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port = normalizePort(process.env.PORT || '3005');

// ═══════════════════════════════════════════════════════
// NOUVEAU : Configuration SSL
// ═══════════════════════════════════════════════════════
const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || '/certs/bff.key'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/certs/bff.crt'),
  ca: fs.readFileSync(process.env.SSL_CA_PATH || '/certs/ca.crt')
};
// ═══════════════════════════════════════════════════════

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// ═══════════════════════════════════════════════════════
// MODIFIÉ : Utiliser https.createServer au lieu de http.createServer
// ═══════════════════════════════════════════════════════
const server = https.createServer(options, app);  // ← Changé
// ═══════════════════════════════════════════════════════

server.on('error', errorHandler);

server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind + ' (HTTPS)');  // ← Ajouté "(HTTPS)" pour clarté
});

server.listen(port);