import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dir = 'uploads/orders';
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    // never trust the client's filename — it can contain ../
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safe}`);
  },
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const uploadDrawings = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG, WebP and PDF are allowed')),
}).array('attachments', 8);
