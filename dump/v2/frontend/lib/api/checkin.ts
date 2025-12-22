export interface CheckinData {
    id: string;
    userId: string;
    date: string;
    mood: "great" | "good" | "okay" | "bad" | "terrible";
    energy: "high" | "medium" | "low";
    periodStatus?: "on" | "off" | "starting" | "ending";
    sexualMood?:
        | "very_horny"
        | "horny"
        | "interested"
        | "neutral"
        | "not_interested";
    note?: string;
    createdAt: string;
}

export interface PartnerCheckin {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userSex: "male" | "female";

    date: string;
    mood: "great" | "good" | "okay" | "bad" | "terrible";
    energy: "high" | "medium" | "low";
    periodStatus?: "on" | "off" | "starting" | "ending";
    sexualMood?:
        | "very_horny"
        | "horny"
        | "interested"
        | "neutral"
        | "not_interested";
    note?: string;
    createdAt: string;
}

import { BACKEND_URL } from "@/lib/utils";

// Get today's checkin
export const getTodayCheckin = async (
    date?: string
): Promise<CheckinData | null> => {
    const checkinDate = date || new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const response = await fetch(`${BACKEND_URL}/api/checkin/${checkinDate}`, {
        credentials: "include",
    });

    if (response.status === 404) {
        return null; // no checkin today
    }

    if (!response.ok) {
        throw new Error("Failed to fetch today's checkin");
    }

    const data = await response.json();
    return data.checkin;
};

// create/update checkin
export const createCheckin = async (
    checkinData: Omit<CheckinData, "id" | "userId" | "createdAt">
): Promise<CheckinData> => {
    const response = await fetch(`${BACKEND_URL}/api/checkin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(checkinData),
    });

    if (!response.ok) {
        throw new Error("Failed to create checkin");
    }

    const data = await response.json();
    return data.checkin;
};

// delete checkin for a specific date
export const deleteCheckin = async (date: string): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/api/checkin/${date}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Checkin not found for the specified date");
        }
        throw new Error("Failed to delete checkin");
    }
};

// get partners checkin for today
export const getPartnerCheckin = async (
    date?: string
): Promise<PartnerCheckin | null> => {
    const checkinDate = date || new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const response = await fetch(
        `${BACKEND_URL}/api/checkin/partner/${checkinDate}`,
        {
            credentials: "include",
        }
    );

    if (response.status === 404) {
        return null; // partner hasn't checked in today
    }

    if (!response.ok) {
        try {
            const errorData = await response.json();
            if (errorData.error === "No partner connection found") {
                return null; // no partner connection
            }
        } catch (e) {
            // continue with the original error if cant parse error
            console.error("Error parsing partner checkin response:", e);
        }
        throw new Error("Failed to fetch partner's checkin");
    }

    const data = await response.json();
    return data.partnerCheckin;
};

// just debugging lol
export const debugConnection = async () => {
    const response = await fetch(`${BACKEND_URL}/api/debug/connection`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to debug connection");
    }

    const data = await response.json();
    return data;
};
