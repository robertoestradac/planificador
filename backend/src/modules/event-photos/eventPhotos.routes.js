const express = require('express');
const multer = require('multer');
const controller = require('./eventPhotos.controller');
const authenticate = require('../../middlewares/authenticate');
const attachTenant = require('../../middlewares/attachTenant');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per photo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// Authenticated — get all photos for an event (dashboard)
router.get('/by-event/:event_id', authenticate, attachTenant(true), controller.getPhotosByEvent);

// Public routes — guests can upload and view photos
router.post('/:invitation_id', upload.single('photo'), controller.uploadPhoto);
router.get('/:invitation_id', controller.getPhotos);

// Authenticated — owner can delete photos
router.delete('/:id', authenticate, controller.deletePhoto);

module.exports = router;
