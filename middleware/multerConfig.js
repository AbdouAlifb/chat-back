// middleware/multerConfig.js
const multer = require('multer');

// Configuration de multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Le dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Renommer le fichier pour éviter les conflits
  }
});

// Filtrer le type de fichier pour accepter les images et les PDF
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf' // Ajoutez le type MIME pour les PDF
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type!'), false); // Refuser les fichiers qui ne sont pas des images ou PDF
  }
};

// Initialiser multer
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter 
});

module.exports = upload;
