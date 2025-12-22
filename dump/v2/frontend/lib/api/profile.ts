export interface UserMetadata {
    id: string;
    userId: string;
    sex: "male" | "female";
    startedDating?: string;
    createdAt: string;
    updatedAt: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// get user metadata (sex)
export const getUserMetadata = async (): Promise<UserMetadata | null> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/user/metadata`, {
            credentials: "include",
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => null);
            console.debug("getUserMetadata error:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });
            return null;
        }

        const data = await response.json();
        return data.userMetadata;
    } catch (error) {
        console.error("getUserMetadata fetch error:", error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(
                "An unknown error occurred while fetching user metadata."
            );
        }
    }
};

// update user metadata (sex, startedDating)
export const updateUserMetadata = async (
    data: Partial<{ sex: "male" | "female"; startedDating: string }>
): Promise<UserMetadata> => {
    const response = await fetch(`${BACKEND_URL}/api/user/metadata`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update user metadata");
    }

    const data_1 = await response.json();
    return data_1.userMetadata;
};

// get partner metadata
export const getPartnerMetadata = async (): Promise<UserMetadata | null> => {
    const response = await fetch(`${BACKEND_URL}/api/user/partner/metadata`, {
        credentials: "include",
    });

    if (response.status === 404) {
        return null; // No partner or metadata found
    }

    if (!response.ok) {
        try {
            const errorData = await response.json();
            if (errorData.error === "No partner connection found") {
                return null; // This is a valid state, not an error
            }
        } catch (e) {
            // continue with the original error if cant parse error
            console.error("Error parsing partner metadata response:", e);
        }
        throw new Error("Failed to fetch partner metadata");
    }

    const data = await response.json();
    return data.partnerMetadata;
};
