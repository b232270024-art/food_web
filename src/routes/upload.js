import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAdmin } from '../middleware/adminAuth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadRouter = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Зөвхөн зураг оруулах боломжтой'));
    }
  }
});

uploadRouter.use(requireAdmin);

uploadRouter.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Зураг олдсонгүй' });
  }
  // The path to access via browser
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});
