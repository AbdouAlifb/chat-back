const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const multer = require('multer');
const path = require('path');
// Set up storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder
    },
    filename: function (req, file, cb) {
        // Use the original file extension
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + Date.now() + ext;
        cb(null, filename);
    }
});

// File filter to accept images only
function fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
}

// Initialize Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Route to create or update a client's profile with file upload
router.post('/profile/:clientId', upload.single('profileImage'), profileController.upsertProfile);


// Route to get a client's profile
router.get('/profile/:clientId', profileController.getProfile);

// Route to create or update a client's profile
router.post('/profile/:clientId',  profileController.upsertProfile);

// Additional routes can be added here for delete or other operations

module.exports = router;
