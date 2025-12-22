"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { getUserFeedback, submitFeedback, Feedback } from "@/lib/api/feedback";

// Components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, MessagesSquare, Send } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Main Page Component
export default function FeedbackPage() {
    const { authState } = useAuth();
    const [feedback, setFeedback] = useState("");
    const [category, setCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await getUserFeedback();
            setFeedbackHistory(data);
        } catch (error) {
            toast.error("Could not load your feedback history.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (authState.isAuthenticated) {
            fetchHistory();
        }
    }, [authState.isAuthenticated]);

    if (!authState.isAuthenticated && typeof window !== "undefined") {
        redirect("/");
    }

    const handleSubmit = async () => {
        if (feedback.trim().length === 0) {
            toast.error("Please enter your feedback before submitting.");
            return;
        }
        if (!category) {
            toast.error("Please select a category for your feedback.");
            return;
        }
        setIsSubmitting(true);
        try {
            await submitFeedback(feedback, category);
            toast.success("Thank you! Your feedback has been submitted.");
            setFeedback("");
            setCategory("");
            fetchHistory(); // Refresh the history list after submission
        } catch (error) {
            toast.error("Failed to submit feedback. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case "approved":
                return "success";
            case "viewed":
                return "secondary";
            case "new":
                return "default";
            default:
                return "outline";
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 sm:px-8 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
                <h2 className="text-lg flex items-center gap-2 px-4">
                    <MessageSquarePlus className="h-4 w-4" /> Submit Feedback
                </h2>
                <Card className="gap-4">
                    <CardHeader>
                        <CardTitle>
                            Let me know how I can improve Calple -
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select onValueChange={setCategory} value={category}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a category..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Bug">Bug Report</SelectItem>
                                <SelectItem value="Feature Request">
                                    Feature Request
                                </SelectItem>
                                <SelectItem value="Design">
                                    Design/UI Feedback
                                </SelectItem>
                                <SelectItem value="Content">
                                    Content Suggestion
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Type your feedback here..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={5}
                            disabled={isSubmitting}
                            className="h-30 bg-background dark:bg-background inset-shadow-sm"
                        />
                    </CardContent>
                    <CardHeader>
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    isSubmitting ||
                                    feedback.trim().length === 0 ||
                                    !category
                                }
                                className="w-fit"
                            >
                                {isSubmitting ? (
                                    "Submitting..."
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" /> Submit
                                        Feedback
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div>
                <h2 className="text-lg tracking-tight mb-4 flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4" /> Your Feedback History
                </h2>
                <div className="space-y-4">
                    {isLoadingHistory ? (
                        <p>Loading history...</p>
                    ) : feedbackHistory && feedbackHistory.length > 0 ? (
                        feedbackHistory.map((item) => (
                            <Card key={item.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardDescription>
                                            {new Date(
                                                item.submittedAt
                                            ).toLocaleString()}
                                        </CardDescription>
                                        <Badge variant="outline">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p>{item.feedbackText}</p>
                                    {item.adminComment && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm font-semibold text-muted-foreground ">
                                                Developer:
                                            </p>
                                            <p className="text-sm pt-2 ">
                                                {item.adminComment}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-muted-foreground">
                            <CardContent>
                                You haven't submitted any feedback yet.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
