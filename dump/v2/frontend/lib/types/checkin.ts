import type { CheckinData, PartnerCheckin } from "@/lib/api/checkin";

export type FormState = {
    currentMood: string | null;
    currentEnergy: string | null;
    currentSexualMood: string | null;
    note: string;
};

export type FormSetters = {
    setCurrentMood: (mood: any) => void;
    setCurrentEnergy: (energy: any) => void;
    setCurrentSexualMood: (mood: any) => void;
    setNote: (note: string) => void;
};

export interface CheckinFormProps {
    formState: FormState;
    formSetters: FormSetters;
    isSubmitting: boolean;
    handleSubmit: () => void;
}

export interface UserCheckinCardProps {
    todayCheckin: CheckinData | null;
    userName: string;
    isDeleting: boolean;
    handleDeleteCheckin: () => void;
    formState: FormState;
    formSetters: FormSetters;
    isSubmitting: boolean;
    handleSubmit: () => void;
}

export interface CheckinSummaryProps {
    checkin: CheckinData;
    userName: string;
}

export interface PartnerCheckinCardProps {
    partnerCheckin: PartnerCheckin;
    isRefreshingPartner: boolean;
    loadPartnerData: () => void;
}

export interface WaitingForPartnerCardProps {
    isRefreshingPartner: boolean;
    loadPartnerData: () => void;
}
