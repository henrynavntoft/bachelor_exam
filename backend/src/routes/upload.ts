import cloudinary from '../lib/cloudinary';
import multer from 'multer';
import { Router } from 'express';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'meet-and-greet',
        });

        res.status(200).json({ url: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;