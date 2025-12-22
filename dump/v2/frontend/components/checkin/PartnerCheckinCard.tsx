// components
import * as Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw } from "lucide-react";

// api
import { PartnerCheckin } from "@/lib/api/checkin";

// utils
import { cn } from "@/lib/utils";

// constants
import {
    moodOptions,
    energyOptions,
    sexualMoodOptions,
} from "@/lib/constants/checkin";

// types
import { PartnerCheckinCardProps } from "@/lib/types/checkin";

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
    <div className="text-center p-2 rounded-full bg-background inset-shadow-sm border">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-lg mb-2">
            {Icon && <Icon className="mx-auto w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="font-medium text-sm">{value}</div>
    </div>
);

export const PartnerCheckinCard = ({
    partnerCheckin,
    isRefreshingPartner,
    loadPartnerData,
}: PartnerCheckinCardProps) => {
    const mood = moodOptions.find((m) => m.value === partnerCheckin.mood);
    const energy = energyOptions.find((e) => e.value === partnerCheckin.energy);
    const sexualMood = sexualMoodOptions.find(
        (s) => s.value === partnerCheckin.sexualMood
    );

    return (
        <Card.Card className="w-full flex flex-col">
            <Card.CardHeader>
                <Card.CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Partner's Today
                    <div className="ml-auto flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadPartnerData}
                            disabled={isRefreshingPartner}
                        >
                            <RefreshCw
                                className={cn(
                                    "w-4 h-4",
                                    isRefreshingPartner && "animate-spin"
                                )}
                            />
                        </Button>
                    </div>
                </Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent className="flex-1">
                <div className="space-y-4">
                    <div>
                        <div className="font-medium">
                            {partnerCheckin.userName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Checked in at {formatTime(partnerCheckin.createdAt)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <SummaryItem
                            label="Partner's Mood"
                            value={mood?.label}
                            icon={mood?.icon}
                        />
                        <SummaryItem
                            label="Partner's Energy Level"
                            value={energy?.label}
                            icon={energy?.icon}
                        />
                        {partnerCheckin.sexualMood && sexualMood && (
                            <SummaryItem
                                label="Up for Intimacy?"
                                value={sexualMood.label}
                                icon={sexualMood.icon}
                            />
                        )}
                    </div>

                    {partnerCheckin.note && (
                        <div className="p-4 rounded-lg bg-background inset-shadow-sm">
                            <div className="font-medium text-sm mb-1">
                                Note:
                            </div>
                            <div className="text-sm">{partnerCheckin.note}</div>
                        </div>
                    )}
                </div>
            </Card.CardContent>
        </Card.Card>
    );
};
