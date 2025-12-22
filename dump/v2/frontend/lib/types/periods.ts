export interface PeriodDay {
    id: string;
    userId: string;
    date: string; // Format: YYYY-MM-DD
    isPeriod: boolean;
    symptoms: string[];
    crampIntensity?: number;
    mood: string[];
    activities: string[];
    sexActivity: string[];
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CycleSettings {
    id: string;
    userId: string;
    cycleLength: number;
    periodLength: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePeriodDayRequest {
    date: string;
    isPeriod: boolean;
    symptoms: string[];
    crampIntensity: number;
    mood: string[];
    activities: string[];
    sexActivity: string[];
    notes: string;
}

export interface UpdateCycleSettingsRequest {
    cycleLength: number;
    periodLength: number;
}

export interface TodaysSummaryProps {
    todaysData?: PeriodDay | null;
    daysUntilNextPeriod?: number | null | undefined;
    daysUntilOvulation?: number | null | undefined;
    currentCycleDay?: number | null | undefined;
    cycleLength?: number;
    hasPeriodData?: boolean;
    isTodayPeriodDay?: boolean;
    isFirstDayOfPeriod?: boolean;
    periodDaysSet?: Set<string>;
    mostRecentPeriodStart?: Date | null | undefined;
    periodDays?: string[];
    isPartnerData?: boolean;
}

export type EventInfo = {
    type: string;
    days: number;
    icon: any;
    color: string;
    isFirstDay?: boolean;
    cycleLength?: number;
    currentPeriodDay?: number;
};

export interface CycleStatusCardProps {
    currentCycleDay: number | null | undefined;
    cycleLength: number;
    daysUntilNextPeriod: number | null | undefined;
    nextPeriod: Date | null | undefined;
    hasPeriodData: boolean;
    fertileStart: Date | null | undefined;
    fertileEnd: Date | null | undefined;
    isPartnerData?: boolean;
}

export interface ButtonRowCalendarProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    periodDays: Set<string>;
    onPeriodToggle: (date: Date) => void;
    predictedPeriodDays: Set<string>;
    fertilityWindowDays: Set<string>;
    sexualActivityDays: Set<string>;
}

export interface CycleSettingsFormProps {
    cycleLength: number;
    periodLength: number;
    onSave: (settings: UpdateCycleSettingsRequest) => Promise<void>;
    isLoading?: boolean;
}

export interface DayButtonRowProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    periodDays: Set<string>;
    onPeriodToggle: (date: Date) => void;
    predictedPeriodDays: Set<string>;
    fertilityWindowDays: Set<string>;
    sexualActivityDays: Set<string>;
}

export interface LogFormProps {
    date: Date;
    existingLog?: PeriodDay | null;
    onSave: (log: {
        date: string;
        symptoms: string[];
        crampIntensity: number;
        mood: string[];
        activities: string[];
        sexActivity: string[];
        notes: string;
    }) => Promise<void>;
    onUpdate: (log: {
        date: string;
        symptoms: string[];
        crampIntensity: number;
        mood: string[];
        activities: string[];
        sexActivity: string[];
        notes: string;
    }) => Promise<void>;
}

export interface SelectedDateDetailsProps {
    date: Date;
    periodData?: PeriodDay | null;
    onLogClick?: () => void;
}
