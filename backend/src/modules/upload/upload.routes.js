const express = require('express');
const multer = require('multer');
const uploadController = require('./upload.controller');
const authenticate = require('../../middlewares/authenticate');
const attachTenant = require('../../middlewares/attachTenant');

const router = express.Router();

// Configure multer to store in memory so we can process with sharp
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Require authentication to prevent unauthorized uploads (tenant optional: admins have no tenant_id)
router.post('/', authenticate, attachTenant(false), upload.single('file'), uploadController.uploadImage);

module.exports = router;

