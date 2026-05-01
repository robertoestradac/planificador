const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert to WebP and save
    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toFile(filepath);

    // Construct the full URL for the uploaded file
    const protocol = config.app?.protocol || 'http';
    const domain = config.app?.domain || 'localhost';
    const port = config.port || 4000;
    
    // In production, use api subdomain; in development, use localhost with port
    let baseUrl;
    if (domain === 'localhost') {
      baseUrl = `${protocol}://${domain}:${port}`;
    } else {
      // In production, the API is served from api.domain
      baseUrl = `${protocol}://api.${domain}`;
    }
    
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: filename
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage
};
