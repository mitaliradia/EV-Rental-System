import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // 1. Import this helper

import { uploadKyc } from '../controllers/userController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// 2. Create __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Define the destination path relative to THIS file's location
// We go up one directory ('../') from 'routes' and then into 'uploads'
const uploadDir = path.join(__dirname, '../uploads');

// 4. Ensure the absolute directory path exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for file storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir); // Use the absolute path
    },
    filename(req, file, cb) {
        cb(null, `kyc-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

router.post('/kyc', protectRoute, upload.single('kycDocument'), uploadKyc);

export default router;