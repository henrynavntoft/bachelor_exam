import { Router, Response } from 'express';
import multer from 'multer';
import s3 from '../lib/s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import sharp from 'sharp';


const router = Router();

if (!process.env.LINODE_BUCKET_NAME) {
    throw new Error('LINODE_BUCKET_NAME is not defined');
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Upload a single image (converted to WebP and square cropped)
router.post(
    '/:id',
    authorize(['EVENT_OWNER']),
    upload.single('image'),
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        try {
            const processedImage = await sharp(req.file.buffer)
                .resize(800, 800, {
                    fit: sharp.fit.cover,
                })
                .webp()
                .toBuffer();

            const uniqueName = `${Date.now()}-${req.file.originalname.split('/').pop()?.split('.')[0] || 'image'}.webp`;

            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.LINODE_BUCKET_NAME!,
                Key: uniqueName,
                Body: processedImage,
                ContentType: 'image/webp',
                ACL: 'public-read',
            });

            await s3.send(uploadCommand);

            const location = `${process.env.LINODE_OBJECT_STORAGE_ENDPOINT}/${process.env.LINODE_BUCKET_NAME}/${uniqueName}`;
            res.status(200).json({ url: location });
        } catch (err) {
            console.error('Error processing or uploading file:', err);
            res.status(500).json({ error: 'Upload failed' });
        }
    }
);

//////////////////////////////////////////////////////////////////////////////////
// POST: Upload multiple images
router.delete(
    '/:id',
    authorize(['EVENT_OWNER']),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        let keys = req.body.key;

        if (!keys) {
            res.status(400).json({ error: 'Missing object key(s)' });
            return;
        }

        // Allow for single string or array of keys
        if (!Array.isArray(keys)) {
            keys = [keys];
        }

        try {
            for (const rawKey of keys) {
                // Extract just the object key if a full URL is passed
                const key = typeof rawKey === 'string' && rawKey.includes('/')
                    ? rawKey.split('/').pop()
                    : rawKey;

                if (!key) continue;

                const deleteCommand = new DeleteObjectCommand({
                    Bucket: process.env.LINODE_BUCKET_NAME!,
                    Key: key,
                });
                await s3.send(deleteCommand);
                console.log(`Deleted object: ${key}`);
            }
            res.status(200).json({ message: 'File(s) deleted successfully' });
        } catch (error) {
            console.error('Error deleting file(s):', error);
            res.status(500).json({ error: 'Failed to delete file(s)' });
        }
    }
);

// POST: Upload profile picture (converted to WebP and square cropped)
router.post(
    '/profile/:id',
    authorize(['SELF']),
    upload.single('image'),
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        try {
            const processedImage = await sharp(req.file.buffer)
                .resize(800, 800, {
                    fit: sharp.fit.cover,
                })
                .webp()
                .toBuffer();

            const uniqueName = `profile-${req.params.id}-${Date.now()}.webp`;

            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.LINODE_BUCKET_NAME!,
                Key: uniqueName,
                Body: processedImage,
                ContentType: 'image/webp',
                ACL: 'public-read',
            });

            await s3.send(uploadCommand);

            const location = `${process.env.LINODE_OBJECT_STORAGE_ENDPOINT}/${process.env.LINODE_BUCKET_NAME}/${uniqueName}`;
            res.status(200).json({ url: location });
        } catch (err) {
            console.error('Error processing or uploading profile file:', err);
            res.status(500).json({ error: 'Upload failed' });
        }
    }
);

export default router;