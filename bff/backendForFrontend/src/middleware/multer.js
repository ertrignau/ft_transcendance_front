const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDirs = {
  image: './uploads/images',
  pdf:   './uploads/pdfs',
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf';
    cb(null, isPdf ? uploadDirs.pdf : uploadDirs.image);
  },
  filename: (req, file, cb) => {
    const user = req.userId ? req.userId : "avatar";
    const ext = path.extname(file.originalname);
    const filename = `${user}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  // Accepter tous les types d'images et les PDFs
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';
  
  if (!isImage && !isPdf) {
    return cb(new Error(`Invalid file type. Got: ${file.mimetype}`), false);
  }

  const nameRegex = /^[\S ]+$/;
  if ( typeof file.originalname !== 'string' || file.originalname.length < 1 || file.originalname.length > 100 || !nameRegex.test(file.originalname)) {
    return cb(new Error('Invalid file name.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;