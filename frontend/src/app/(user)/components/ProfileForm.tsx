import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/app/(event)/components/FileInput";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    profilePicture: z.union([
        z.instanceof(File),
        z.string(),
        z.undefined(),
    ]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
    const [previewImages, setPreviewImages] = useState<string[]>([]);
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
                                <FileInput
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(files) => {
                                        field.onChange(files[0]);
                                        if (files[0]) {
                                            setPreviewImages([URL.createObjectURL(files[0])]);
                                        } else {
                                            setPreviewImages([]);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {previewImages.length > 0 && (
                    <div className="mb-2">
                        <Label>Preview</Label>
                        <Image
                            src={previewImages[0]}
                            alt="Profile Preview"
                            width={100}
                            height={100}
                            className="rounded border"
                        />
                    </div>
                )}
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