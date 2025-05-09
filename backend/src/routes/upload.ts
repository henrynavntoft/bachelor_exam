import { Router, Response } from 'express';
import multer, { MulterError } from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';


const router = Router();

if (!process.env.LINODE_BUCKET_NAME) {
    throw new Error('LINODE_BUCKET_NAME is not defined');
}

interface S3File extends Express.Multer.File {
    location: string;
}

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.LINODE_BUCKET_NAME!,
        acl: 'public-read',
        key: (req, file, cb) => {
            // Strip any path or directory structure and save at root of bucket
            const fileName = file.originalname.split('/').pop() || file.originalname;
            const uniqueName = `${Date.now()}-${fileName}`;
            cb(null, uniqueName); // No folder prefix
        },
    }),
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Upload a single image
router.post(
    '/:id',
    authorize(['EVENT_OWNER']),
    (req: AuthenticatedRequest, res: Response) => {
        // Use multer explicitly to catch errors
        upload.single('image')(req, res, (err: unknown) => {
            if (err) {
                if (err instanceof MulterError) {
                    console.error('Multer upload error:', err.message);
                } else if (err instanceof Error) {
                    console.error('Unknown upload error:', err.message);
                } else {
                    console.error('Upload error:', err);
                }
                res.status(500).json({ error: 'Upload failed' });
                return;
            }

            const file = req.file as S3File | undefined;
            if (!file || !file.location) {
                res.status(400).json({ error: 'Upload failed' });
                return;
            }

            res.status(200).json({ url: file.location });
        });
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

// POST: Upload profile picture
router.post(
    '/profile/:id',
    authorize(['SELF']),
    (req: AuthenticatedRequest, res: Response) => {
        console.log('Profile upload request received:', {
            headers: req.headers,
            user: req.user,
            file: req.file
        });

        upload.single('image')(req, res, (err: unknown) => {
            if (err) {
                console.error('Profile upload error:', err);
                if (err instanceof MulterError) {
                    console.error('Multer upload error:', err.message);
                    res.status(400).json({ error: `Upload failed: ${err.message}` });
                } else if (err instanceof Error) {
                    console.error('Unknown upload error:', err.message);
                    res.status(400).json({ error: `Upload failed: ${err.message}` });
                } else {
                    console.error('Upload error:', err);
                    res.status(400).json({ error: 'Upload failed' });
                }
                return;
            }

            const file = req.file as S3File | undefined;
            if (!file || !file.location) {
                console.error('No file or location in request');
                res.status(400).json({ error: 'Upload failed: No file received' });
                return;
            }

            res.status(200).json({ url: file.location });
        });
    }
);

export default router;