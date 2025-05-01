import { Router, Request, Response } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

interface S3File extends Express.Multer.File {
    location: string;
}

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.LINODE_BUCKET_NAME!,
        acl: 'public-read',
        key: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            cb(null, `meet-and-greet/${uniqueName}`);
        },
    }),
});

router.post('/', authenticateJWT(['ADMIN', 'HOST']), upload.single('image'), (req: Request, res: Response): void => {
    const file = req.file as S3File | undefined;

    if (!file || !file.location) {
        res.status(400).json({ error: 'Upload failed' });
        return;
    }

    res.status(200).json({ url: file.location }); // public URL
});

router.delete('/', authenticateJWT(['ADMIN', 'HOST']), async (req: Request, res: Response): Promise<void> => {
    const { key } = req.body;

    if (!key) {
        res.status(400).json({ error: 'Missing object key' });
        return;
    }

    try {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.LINODE_BUCKET_NAME!,
            Key: key,
        });
        await s3.send(deleteCommand);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;