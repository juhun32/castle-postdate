import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { selectGroups } from "@/lib/constants/calendar";

export const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.calple.date";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function logout() {
    window.location.href = `${BACKEND_URL}/google/oauth/logout`;
}

export function login() {
    console.log("BACKEND_URL:", BACKEND_URL);
    window.location.href = `${BACKEND_URL}/google/oauth/login`;
}

export function getColorFromGroup(groupValue: string): string {
    if (!groupValue) {
        return "";
    }
    const groupInfo = selectGroups.find((group) => group.value === groupValue);
    return groupInfo ? groupInfo.color : "";
}

export function getBorderColorFromGroup(groupValue: string): string {
    if (!groupValue) {
        return "";
    }
    const groupInfo = selectGroups.find((group) => group.value === groupValue);
    return groupInfo ? groupInfo.borderColor : "";
}
// calculate the D-day count (days until/since an event)
export function calculateDDay(targetDate: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
}
