import { DatePin } from "@/lib/types/map";
import { BACKEND_URL } from "@/lib/utils";

export async function fetchPins(): Promise<DatePin[]> {
    const res = await fetch(`${BACKEND_URL}/api/pins`, {
        credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch pins");

    const { pins: userPins, partnerPins } = await res.json();

    const checkUserPins = Array.isArray(userPins) ? userPins : [];
    const checkPartnerPins = Array.isArray(partnerPins) ? partnerPins : [];

    return [
        ...checkUserPins.map((p: any) => ({ ...p, date: new Date(p.date) })),
        ...(checkPartnerPins ?? []).map((p: any) => ({
            ...p,
            date: new Date(p.date),
        })),
    ];
}

export async function savePin(payload: any, selectedPin?: DatePin) {
    const url = `${BACKEND_URL}/api/pins`;
    const body = selectedPin
        ? JSON.stringify({ ...payload, id: selectedPin.id })
        : JSON.stringify(payload);

    await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
    });
}

export async function editPin(id: string, payload: any): Promise<DatePin> {
    const res = await fetch(
        `${BACKEND_URL}/api/pins/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(
            `Failed to update pin: ${res.status} ${res.statusText} ${
                text ?? ""
            }`
        );
    }

    if (res.status === 204) {
        return { id, ...payload, date: new Date(payload.date) } as DatePin;
    }

    const data = await res.json().catch(() => null);
    const updated = data?.pin ?? data?.updatedPin ?? data;
    if (!updated)
        throw new Error("Invalid response from server when updating pin");

    return { ...updated, date: new Date(updated.date) } as DatePin;
}

export async function deletePin(id: string) {
    await fetch(`${BACKEND_URL}/api/pins/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
}
