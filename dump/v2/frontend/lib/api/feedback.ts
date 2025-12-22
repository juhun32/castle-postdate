import { BACKEND_URL } from "@/lib/utils";

export interface Feedback {
    id: string;
    feedbackText: string;
    adminComment?: string;
    submittedAt: string;
    category: string;
}

export const submitFeedback = async (
    feedbackText: string,
    category: string
): Promise<any> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/feedback`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ feedbackText, category }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error submitting feedback:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });
            throw new Error("Failed to submit feedback");
        }

        return await response.json();
    } catch (error) {
        console.error("submitFeedback fetch error:", error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(
                "An unknown error occurred while submitting feedback"
            );
        }
    }
};

export const getUserFeedback = async (): Promise<Feedback[]> => {
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch your feedback history");
    }
    return response.json();
};
