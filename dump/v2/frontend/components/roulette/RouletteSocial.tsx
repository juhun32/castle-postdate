"use client";

import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as AlertDialog from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import {
    Bookmark,
    Heart,
    MessageCircle,
    ThumbsUp,
    Frame,
    Plus,
} from "lucide-react";

// components
import Image from "next/image";

// hooks
import { usePosts } from "@/lib/hooks/useIdeas";
import { useEffect, useState } from "react";
import { NewIdeaData } from "@/lib/types/ideas";

export default function RouletteSocial() {
    const { allPosts, loading, error } = usePosts();
    const { addPost } = usePosts();

    // state for add post form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [hashtag, setHashtag] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!isAdding) {
            setTitle("");
            setDescription("");
            setHashtag(null);
            setSelectedImage(null);
            setImagePreview(null);
        }
    }, [isAdding]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setSelectedImage(null);
            setImagePreview(null);
        }
    };

    // clean up effect to revoke object URL when component unmounts or image changes
    // to prevent memory leaks by releasing the object URL created for the image preview
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleAddPost = async () => {
        if (!title) {
            console.error("Title is required.");
            return;
        }

        setIsSubmitting(true);

        const newPostData: NewIdeaData = {
            title: title,
            description: description,
            tags: hashtag ? [hashtag] : [],
        };

        if (selectedImage) {
            console.log("Selected image for upload:", selectedImage.name);

            // pipeline for image upload is not implemented yet

            // const imageUrl = await uploadImage(selectedImage);
            // newPostData.image_url = imageUrl; // Then assign the URL
        }

        try {
            const added = await addPost(newPostData);
            if (added) {
                console.log("Post added:", added);
            } else {
                console.error("Failed to add post.");
            }
        } catch (apiError) {
            console.error("An error occurred while adding the post:", apiError);
        } finally {
            setIsSubmitting(false);
            setIsAdding(false);
        }
    };

    if (loading && allPosts.length === 0) {
        // Show loading only on initial load or when posts are empty
        return <div className="w-full text-center p-4">Loading posts...</div>;
    }

    if (error) {
        return (
            <div className="w-full text-center p-4 text-red-500">
                Error: {error}
            </div>
        );
    }

    return (
        <>
            <div className="sticky w-full top-0 left-0 right-0 z-10 flex items-center justify-between bg-background pb-2 border-b">
                <AlertDialog.AlertDialog
                    open={isAdding}
                    onOpenChange={setIsAdding}
                >
                    <AlertDialog.AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Share Date Idea
                        </Button>
                    </AlertDialog.AlertDialogTrigger>

                    <AlertDialog.AlertDialogContent className="max-w-xl">
                        <AlertDialog.AlertDialogHeader>
                            <AlertDialog.AlertDialogTitle>
                                Share your date idea
                            </AlertDialog.AlertDialogTitle>
                        </AlertDialog.AlertDialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Selected preview"
                                        className="rounded-md border"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-md flex items-center justify-center border-2 border-dashed">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Frame className="w-3 h-3 text-muted-foreground" />
                                            No image selected
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="image-upload">
                                        Image (Optional)
                                    </Label>

                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif"
                                        onChange={handleImageChange}
                                        className="w-full text-xs text-muted-foreground file:mr-4 file:bg-accent  file:px-2 file:rounded-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="Location"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter idea title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your ideas"
                                className="min-h-32"
                            />
                        </div>
                        <div className="flex gap-4 justify-end mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsAdding(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPost}
                                disabled={isSubmitting || !title}
                            >
                                {isSubmitting ? "Submitting..." : "Add Idea"}
                            </Button>
                        </div>
                    </AlertDialog.AlertDialogContent>
                </AlertDialog.AlertDialog>
                <Button variant="outline" onClick={() => setIsAdding(true)}>
                    <Bookmark className="w-4 h-4" />
                    Saved Ideas
                </Button>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center w-full px-8">
                <div className="w-full h-full flex flex-col gap-4">
                    <div className="flex flex-col gap-4 max-h-screen">
                        {allPosts.map((post) => (
                            <Card.Card
                                key={post.id}
                                className="w-full bg-background border-none shadow-none pb-8"
                            >
                                <Card.CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 rounded-full">
                                            {post.author_avatar_url ? (
                                                <AvatarImage
                                                    src={post.author_avatar_url}
                                                    alt={post.author}
                                                />
                                            ) : (
                                                <AvatarFallback>
                                                    {post.author ? (
                                                        post.author
                                                            .substring(0, 1)
                                                            .toUpperCase()
                                                    ) : (
                                                        <Heart className="w-4 h-4" />
                                                    )}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {post.author || "Anonymous"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    post.created_at
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Card.CardHeader>
                                <Card.CardContent className="flex flex-col">
                                    <AspectRatio
                                        ratio={16 / 9}
                                        className="bg-muted rounded-lg"
                                    >
                                        <Image
                                            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                                            alt="Photo by Drew Beamer"
                                            fill
                                            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
                                        />
                                    </AspectRatio>
                                    <div>
                                        <p className="font-bold text-lg pt-1">
                                            {post.title}
                                        </p>
                                        <p className="text-sm pb-1 text-muted-foreground">
                                            {post.description}
                                        </p>
                                    </div>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {post.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="text-muted-foreground font-normal"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Card.CardContent>
                                <Card.CardFooter className="flex justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 rounded-full"
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                            </Button>
                                            <div className="text-xs text-muted-foreground">
                                                {post.likes}
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 rounded-full"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                            <div className="text-xs text-muted-foreground">
                                                {post.comments?.length || 0}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Bookmark className="w-4 h-4" />
                                    </Button>
                                </Card.CardFooter>
                            </Card.Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
