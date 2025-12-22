import { BACKEND_URL } from "@/lib/utils";
import {
    PeriodDay,
    CycleSettings,
    CreatePeriodDayRequest,
    UpdateCycleSettingsRequest,
} from "@/lib/types/periods";

const API_BASE = `${BACKEND_URL}/api/periods`;

// helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
        );
    }
    return response.json();
}

// period days
export async function getPeriodDays(): Promise<{ periodDays: PeriodDay[] }> {
    const response = await fetch(`${API_BASE}/days`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse<{ periodDays: PeriodDay[] }>(response);
}

export async function getPartnerPeriodDays(): Promise<{
    periodDays: PeriodDay[];
    partnerSex: string;
}> {
    const response = await fetch(`${API_BASE}/partner/days`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse<{ periodDays: PeriodDay[]; partnerSex: string }>(
        response
    );
}

export async function createPeriodDay(
    data: CreatePeriodDayRequest
): Promise<PeriodDay> {
    const response = await fetch(`${API_BASE}/days`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse<PeriodDay>(response);
}

export async function deletePeriodDay(
    date: string
): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/days/${date}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse<{ message: string }>(response);
}

// cycle settings
export async function getCycleSettings(): Promise<{
    cycleSettings: CycleSettings;
}> {
    const response = await fetch(`${API_BASE}/settings`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse<{ cycleSettings: CycleSettings }>(response);
}

export async function updateCycleSettings(
    data: UpdateCycleSettingsRequest
): Promise<{ cycleSettings: CycleSettings }> {
    const response = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse<{ cycleSettings: CycleSettings }>(response);
}
