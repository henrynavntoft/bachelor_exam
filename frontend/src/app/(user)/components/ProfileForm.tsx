import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { profileSchema, ProfileFormData } from "@/lib/schemas/profile.schemas";

interface ProfileFormProps {
    initialData: {
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
    onSubmit: (data: ProfileFormData) => Promise<void>;
    onCancel: () => void;
}

export function ProfileForm({ initialData, onSubmit, onCancel }: ProfileFormProps) {
    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: initialData,
    });

    return (
        <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        field.onChange(files[0]);
                                    }}
                                    className="cursor-pointer"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex gap-2">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-foreground" />
                                Saving...
                            </>
                        ) : (
                            'Save Profile'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Form>
    );
} 