import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Event } from '@/lib/types/event'; // Assuming Event type is available
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AxiosError } from 'axios'; // Import AxiosError for better error typing

interface AttendEventModalProps {
    event: Pick<Event, 'id' | 'title' | 'date' | 'pricePerPerson' | 'capacity'> | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (eventId: string, quantity: number) => Promise<void>; // Callback for successful confirmation
}

export function AttendEventModal({ event, isOpen, onClose, onConfirm }: AttendEventModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (event?.pricePerPerson && quantity > 0) {
            setTotalPrice(event.pricePerPerson * quantity);
        } else {
            setTotalPrice(null);
        }
    }, [event?.pricePerPerson, quantity]);

    useEffect(() => {
        // Reset state when modal is opened or event changes
        if (isOpen) {
            setQuantity(1);
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, event]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
            setQuantity(val);
            setError(null); // Clear error when quantity changes
        } else if (e.target.value === '') {
            setQuantity(0); // Or handle as invalid input immediately
        }
    };

    const handleSubmit = async () => {
        if (!event || quantity <= 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            // The actual API call is now done via the onConfirm prop
            await onConfirm(event.id, quantity);
            toast.success(`Successfully RSVPed for ${event.title} with ${quantity} spot(s).`);
            onClose(); // Close modal on success
        } catch (err) {
            console.error('Error attending event:', err);
            let errorMessage = 'Failed to RSVP for the event. Please try again.';
            if (err instanceof AxiosError && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Attend: {event.title}</DialogTitle>
                    <DialogDescription>
                        Date: {new Date(event.date).toLocaleDateString()} - How many spots would you like?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Number of People</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity === 0 ? '' : quantity}
                            onChange={handleQuantityChange}
                            className={error && quantity <= 0 ? "border-red-500" : ""}
                        />
                        {event.capacity !== null && event.capacity !== undefined && (
                            <p className="text-sm text-muted-foreground">
                                Spots available: {event.capacity} (Requesting {quantity})
                            </p>
                        )}
                    </div>
                    {totalPrice !== null && (
                        <p className="text-lg font-semibold">
                            Total Price: {totalPrice.toFixed(2)} DKK
                        </p>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isLoading || quantity <= 0}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Attendance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 