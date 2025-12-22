// constants
import {
    moodOptions,
    energyOptions,
    sexualMoodOptions,
} from "@/lib/constants/checkin";

// types
import { CheckinSummaryProps } from "@/lib/types/checkin";

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

const SummaryItem = ({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value?: string;
    icon?: React.ElementType;
}) => (
    <div className="text-center p-2 bg-background inset-shadow-sm border rounded-full w-full">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-lg mb-2">
            {Icon && <Icon className="mx-auto w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="font-medium text-sm">{value}</div>
    </div>
);

export const CheckinSummary = ({ checkin, userName }: CheckinSummaryProps) => {
    const mood = moodOptions.find((m) => m.value === checkin.mood);
    const energy = energyOptions.find((e) => e.value === checkin.energy);
    const sexualMood = sexualMoodOptions.find(
        (s) => s.value === checkin.sexualMood
    );

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="font-medium">{userName}</div>
                <div className="text-sm text-muted-foreground bg-background inset-shadow-sm px-2 py-1 rounded flex flex-row gap-1">
                    <p className="hidden md:block">Checked in at</p>
                    {formatTime(checkin.createdAt)}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-center items-center h-full">
                <SummaryItem
                    label="My Mood"
                    value={mood?.label}
                    icon={mood?.icon}
                />
                <SummaryItem
                    label="My Energy Level"
                    value={energy?.label}
                    icon={energy?.icon}
                />
                {checkin.sexualMood && sexualMood && (
                    <SummaryItem
                        label="Up for intimacy?"
                        value={sexualMood.label}
                        icon={sexualMood.icon}
                    />
                )}
            </div>

            {checkin.note && (
                <div className="p-4 rounded-lg bg-background inset-shadow-sm">
                    <div className="font-medium text-sm mb-1">Note:</div>
                    <div className="text-sm">{checkin.note}</div>
                </div>
            )}
        </div>
    );
};
