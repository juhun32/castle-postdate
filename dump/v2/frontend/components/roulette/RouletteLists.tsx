"use client";

import { useState } from "react";

import { usePosts } from "@/lib/hooks/useIdeas";
import RouletteCards from "@/components/roulette/RouletteCard";

import { List, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import * as AlertDialog from "@/components/ui/alert-dialog";

export default function Roulette() {
    const { posts, deletePost } = usePosts();
    const [viewList, setViewList] = useState(false);

    return (
        <div>
            <RouletteCards posts={posts} />

            <div className="flex w-full h-12 items-center justify-between">
                <Button variant="outline">
                    <Plus className="w-4 h-4" />
                    Add to Roulette
                </Button>

                <AlertDialog.AlertDialog
                    open={viewList}
                    onOpenChange={setViewList}
                >
                    <AlertDialog.AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={() => setViewList(true)}
                        >
                            <List className="w-4 h-4" />
                            My Roulette List
                        </Button>
                    </AlertDialog.AlertDialogTrigger>

                    <AlertDialog.AlertDialogContent className="max-w-xl">
                        <AlertDialog.AlertDialogHeader>
                            <AlertDialog.AlertDialogTitle>
                                Share your date idea
                            </AlertDialog.AlertDialogTitle>
                        </AlertDialog.AlertDialogHeader>
                        <div>
                            {posts.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {posts.map((post) => (
                                        <div
                                            key={post.id}
                                            className="p-4 border rounded-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {post.description}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        deletePost(post.id)
                                                    }
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {post.image_url && (
                                                <img
                                                    src={post.image_url}
                                                    alt={post.title}
                                                    className="mt-2 rounded-md border"
                                                />
                                            )}
                                            {post.tags &&
                                                post.tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {post.tags.map(
                                                            (tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="px-2 py-1 bg-accent text-xs rounded-full"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    No ideas shared yet.
                                </div>
                            )}
                        </div>
                        <AlertDialog.AlertDialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setViewList(false)}
                            >
                                <X className="w-4 h-4" />
                                Close
                            </Button>
                        </AlertDialog.AlertDialogFooter>
                    </AlertDialog.AlertDialogContent>
                </AlertDialog.AlertDialog>
            </div>
        </div>
    );
}
