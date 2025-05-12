import { toast } from "sonner";

export type AcceptedImageType =
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'
    | 'image/jpg'
    | 'image/gif'
    | 'image/bmp'
    | 'image/tiff'
    | 'image/ico'
    | 'image/heic'
    | 'image/heif';

export const ACCEPTED_IMAGE_TYPES: AcceptedImageType[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/ico',
    'image/heic',
    'image/heif'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 5;

interface FileValidationOptions {
    maxFiles?: number;
    maxFileSize?: number;
    acceptedTypes?: AcceptedImageType[];
}

export const validateFiles = (
    files: FileList | null,
    options: FileValidationOptions = {}
): File[] | null => {
    if (!files) return null;

    const {
        maxFiles = MAX_FILES,
        maxFileSize = MAX_FILE_SIZE,
        acceptedTypes = ACCEPTED_IMAGE_TYPES
    } = options;

    const fileArray = Array.from(files);

    // Check file count
    if (fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return null;
    }

    // Check file types and sizes
    const invalidFiles = fileArray.filter(file =>
        !acceptedTypes.includes(file.type as AcceptedImageType) ||
        file.size > maxFileSize
    );

    if (invalidFiles.length > 0) {
        toast.error(`Some files are invalid. Only images under ${maxFileSize / (1024 * 1024)}MB are allowed.`);
        return null;
    }

    return fileArray;
};

export const createPreviewUrls = (files: File[]): string[] => {
    return files.map(file => URL.createObjectURL(file));
};

export const cleanupPreviewUrls = (urls: string[]) => {
    urls.forEach(url => URL.revokeObjectURL(url));
}; 