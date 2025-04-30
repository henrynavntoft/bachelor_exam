import cloudinary from '../lib/cloudinary';
import multer from 'multer';
import { Router } from 'express';
import fs from 'fs/promises';
import { authenticateJWT } from '../middleware/authMiddleware';


const router = Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage

router.post('/', authenticateJWT(['ADMIN', 'HOST']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'meet-and-greet',
        });

        try {
            await fs.unlink(req.file.path);
        } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
        }

        res.status(200).json({ url: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;