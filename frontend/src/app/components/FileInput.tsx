import { useRef, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { validateFiles, createPreviewUrls } from '@/lib/fileUtils';

interface FileInputProps {
    label?: string;
    multiple?: boolean;
    accept?: string;
    onChange?: (files: File[]) => void;
    onPreviewChange?: (urls: string[]) => void;
    maxFiles?: number;
    maxFileSize?: number;
    className?: string;
}

export function FileInput({
    label,
    multiple = false,
    accept = '.jpg,.jpeg,.png,.webp',
    onChange,
    onPreviewChange,
    maxFiles,
    maxFileSize,
    className
}: FileInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const validatedFiles = validateFiles(e.target.files, { maxFiles, maxFileSize });
        if (validatedFiles) {
            onChange?.(validatedFiles);
            if (onPreviewChange) {
                const previewUrls = createPreviewUrls(validatedFiles);
                onPreviewChange(previewUrls);
            }
        } else {
            e.target.value = ''; // Clear the input
        }
    };

    // Cleanup preview URLs when component unmounts
    useEffect(() => {
        return () => {
            if (onPreviewChange) {
                onPreviewChange([]);
            }
        };
    }, [onPreviewChange]);

    return (
        <div className={className}>
            {label && <Label>{label}</Label>}
            <Input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleChange}
                className="cursor-pointer"
            />
            {/* Preview rendering removed. Parent should handle previews. */}
        </div>
    );
} 