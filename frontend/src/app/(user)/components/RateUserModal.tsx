'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface RateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendeeName: string;
    onSubmit: (values: { rating: number; comment?: string }) => void;
    isLoading: boolean;
}

export function RateUserModal({ isOpen, onClose, attendeeName, onSubmit, isLoading }: RateUserModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating < 1 || rating > 10) {
            setError('Please select a rating from 1 to 10 stars');
            return;
        }

        onSubmit({
            rating,
            comment: comment.trim() || undefined
        });
    };

    const handleClose = () => {
        setRating(0);
        setHoverRating(0);
        setComment('');
        setError('');
        onClose();
    };

    const StarRating = () => {
        return (
            <div className="flex items-center justify-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        className="transition-colors p-1 h-auto min-w-0"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        disabled={isLoading}
                    >
                        <Star 
                            className={`h-5 w-5 sm:h-6 sm:w-6 ${
                                star <= (hoverRating || rating) 
                                    ? 'text-brand fill-current' 
                                    : 'text-gray-300'
                            } transition-colors`}
                        />
                    </Button>
                ))}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-xl max-w-[90vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-brand" />
                        Rate {attendeeName}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 px-1">
                    <div>
                        <Label className="text-sm font-medium mb-3 block">
                            How would you rate your experience? (1-10 stars)
                        </Label>
                        <div className="flex flex-col items-center space-y-3 py-2">
                            <StarRating />
                            <div className="flex justify-between w-full text-xs text-muted-foreground px-2">
                                <span>Poor</span>
                                {rating > 0 && (
                                    <span className="font-medium text-brand">{rating}/10</span>
                                )}
                                <span>Excellent</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
                            Comment (optional)
                        </Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows={2}
                            className="min-h-[60px] resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-destructive text-sm bg-destructive/10 p-2 rounded-md">{error}</div>
                    )}

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Rating'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 