const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const eventPhotosModel = require('./eventPhotos.model');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /event-photos/:invitation_id
 * Public — guests upload their photos (converted to WebP)
 */
const uploadPhoto = async (req, res, next) => {
  try {
    const { invitation_id } = req.params;
    const uploader_name = req.body.uploader_name || '';

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filename = `event-${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert to WebP
    await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Build public URL
    const protocol = config.app?.protocol || 'http';
    const domain = config.app?.domain || 'localhost';
    const port = config.port || 4000;
    const baseUrl = domain === 'localhost' ? `${protocol}://${domain}:${port}` : `${protocol}://${domain}`;
    const photo_url = `${baseUrl}/uploads/${filename}`;

    const photo = await eventPhotosModel.create({
      invitation_id,
      uploader_name,
      photo_url,
      filename,
    });

    res.status(201).json({ success: true, data: photo });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /event-photos/:invitation_id
 * Public — get all photos for an invitation
 */
const getPhotos = async (req, res, next) => {
  try {
    const { invitation_id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const result = await eventPhotosModel.findByInvitation(invitation_id, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /event-photos/:id
 * Authenticated — invitation owner can delete photos
 */
const deletePhoto = async (req, res, next) => {
  try {
    const photo = await eventPhotosModel.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Delete physical file
    const filepath = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await eventPhotosModel.deleteById(req.params.id);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /event-photos/by-event/:event_id
 * Authenticated — tenant owner views all photos grouped by event
 */
const getPhotosByEvent = async (req, res, next) => {
  try {
    const { event_id } = req.params;
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const result = await eventPhotosModel.findByEvent(event_id, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPhoto, getPhotos, getPhotosByEvent, deletePhoto };
