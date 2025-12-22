import { useState, useEffect, useCallback } from "react";

import { Idea } from "@/lib/types/ideas";

import { NewIdeaData, UpdateIdeaData } from "@/lib/types/ideas";

const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function usePosts() {
    const [allPosts, setAllPosts] = useState<Idea[]>([]);
    const [posts, setPosts] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/ideas/all`);
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status}`);
            }
            const data: Idea[] = await response.json();
            setAllPosts(data);
            setError(null);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while fetching posts.");
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllPosts();
    }, [fetchAllPosts]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/ideas`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status}`);
            }
            const data: Idea[] = await response.json();
            setPosts(data);
            setError(null);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while fetching posts.");
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const addPost = async (newPostData: NewIdeaData): Promise<Idea | null> => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/ideas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newPostData),
                credentials: "include",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `Failed to add post: ${response.status}`
                );
            }
            const addedPost: Idea = await response.json();
            setAllPosts((prevPosts) => [addedPost, ...prevPosts]);
            setError(null);
            return addedPost;
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while adding the post.");
            }
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const editPost = async (
        postId: string,
        updatedPostData: UpdateIdeaData
    ): Promise<Idea | null> => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/ideas/${postId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedPostData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Failed to update post: ${response.status}`
                );
            }

            const updatedPostDetails: Idea = await response.json();

            setAllPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? { ...post, ...updatedPostDetails }
                        : post
                )
            );
            setError(null);
            await fetchAllPosts();

            return allPosts.find((p) => p.id === postId) || null;
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while editing the post.");
            }
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (postId: string): Promise<boolean> => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/ideas/${postId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Failed to delete post: ${response.status}`
                );
            }
            setAllPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== postId)
            );
            setError(null);
            return true;
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while deleting the post.");
            }
            console.error(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        allPosts,
        posts,
        loading,
        error,
        fetchAllPosts,
        fetchPosts,
        addPost,
        editPost,
        deletePost,
    };
}
