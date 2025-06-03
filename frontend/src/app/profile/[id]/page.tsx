'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Star, User, Calendar } from 'lucide-react';
import Image from 'next/image';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import { format } from 'date-fns';
import { ClickableUserName } from '@/app/components/global/ClickableUserName';

interface Review {
    rating: number;
    comment?: string;
    createdAt: string;
    raterUser?: {
        id: string;
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    // Fetch user profile
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['publicProfile', userId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.publicProfile(userId), { withCredentials: true });
            return res.data;
        },
    });

    // Fetch user's average rating
    const { data: ratingData } = useQuery({
        queryKey: ['userRating', userId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.averageRating(userId), { withCredentials: true });
            console.log('Rating data response:', res.data); // Debug log
            return res.data;
        },
        enabled: !!userId,
    });

    // Fetch user's ratings (reviews from others)
    const { data: reviews = [] } = useQuery({
        queryKey: ['userReviews', userId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.ratings(userId), { withCredentials: true });
            return res.data;
        },
        enabled: !!userId,
    });

    if (userLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">User not found</h1>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back button */}
            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Profile Header */}
            <Card className="mb-8">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            {user.profilePicture ? (
                                <Image
                                    src={user.profilePicture}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    width={120}
                                    height={120}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-30 h-30 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-2xl font-bold">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold mb-2">
                                {user.firstName} {user.lastName}
                            </h1>
                            
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                <User className="h-4 w-4 text-brand" />
                                <span className="text-muted-foreground capitalize">
                                    {user.role?.toLowerCase()}
                                </span>
                            </div>

                            {/* Rating Display */}
                            {ratingData && ratingData.averageRating && (
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                    <Star className="h-5 w-5 text-brand fill-current" />
                                    <span className="text-lg font-semibold">
                                        {Number(ratingData.averageRating).toFixed(1)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        ({ratingData.ratingCount} review{ratingData.ratingCount !== 1 ? 's' : ''})
                                    </span>
                                </div>
                            )}

                            {/* Member Since */}
                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reviews Section */}
            {reviews.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-brand" />
                            Reviews ({reviews.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {reviews.map((review: Review, index: number) => (
                                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        {/* Reviewer Profile Picture */}
                                        <div className="flex-shrink-0">
                                            {review.raterUser?.profilePicture ? (
                                                <Image
                                                    src={review.raterUser.profilePicture}
                                                    alt={`${review.raterUser.firstName} ${review.raterUser.lastName}`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-sm font-bold">
                                                    {review.raterUser?.firstName?.[0]}{review.raterUser?.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            {/* Reviewer Name and Rating */}
                                            <div className="flex items-center gap-2 mb-2">
                                                {review.raterUser ? (
                                                    <ClickableUserName
                                                        userId={review.raterUser.id}
                                                        firstName={review.raterUser.firstName}
                                                        lastName={review.raterUser.lastName}
                                                        className="font-medium"
                                                    />
                                                ) : (
                                                    <span className="font-medium">Anonymous User</span>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${
                                                                i < review.rating 
                                                                    ? 'text-brand fill-current' 
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>

                                            {/* Review Comment */}
                                            {review.comment && (
                                                <p className="text-muted-foreground">{review.comment}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Reviews Message */}
            {reviews.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No reviews yet</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 