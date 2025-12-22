// components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

// utils
import { cn } from "@/lib/utils";

// constants/types
import {
    moodOptions,
    energyOptions,
    sexualMoodOptions,
} from "@/lib/constants/checkin";
import type { CheckinFormProps } from "@/lib/types/checkin";
import { useState } from "react";
import { Progress } from "../ui/progress";

export const CheckinForm = ({
    formState,
    formSetters,
    isSubmitting,
    handleSubmit,
}: CheckinFormProps) => {
    const { currentMood, currentEnergy, currentSexualMood, note } = formState;
    const { setCurrentMood, setCurrentEnergy, setCurrentSexualMood, setNote } =
        formSetters;
    const [moodCurrentProgress, setMoodCurrentProgress] = useState(0);
    const [energyCurrentProgress, setEnergyCurrentProgress] = useState(0);
    const [sexualMoodCurrentProgress, setSexualMoodCurrentProgress] =
        useState(0);

    return (
        <div className="space-y-4">
            {/* Mood Selection */}
            <div>
                <h3 className="font-normal text-muted-foreground text-sm mb-3">
                    How are you feeling today?
                </h3>
                <div className="relative inline-flex items-center w-full">
                    <div className="flex justify-between gap-2 w-full z-50">
                        {moodOptions.map((mood) => (
                            <Button
                                key={mood.value}
                                variant="secondary"
                                className={cn(
                                    "flex flex-col border items-center gap-1 h-fit p-2 rounded-full h-12 w-12 sm:h-15 sm:w-15",
                                    currentMood === mood.value
                                        ? "bg-accent dark:bg-accent"
                                        : "bg-background dark:bg-background"
                                )}
                                onClick={() => {
                                    setMoodCurrentProgress(
                                        mood.progress as any
                                    );
                                    setCurrentMood(mood.value as any);
                                }}
                            >
                                <mood.icon
                                    className={cn("w-4 h-4", mood.color)}
                                />
                                <span className="text-xs">{mood.label}</span>
                            </Button>
                        ))}
                    </div>
                    <div className="absolute w-full z-1">
                        <Progress
                            value={moodCurrentProgress}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Energy Level */}
            <div>
                <h3 className="font-normal text-muted-foreground text-sm mb-3">
                    How's your energy level today?
                </h3>
                <div className="relative inline-flex items-center w-full">
                    <div className="flex justify-between gap-2 w-full z-50">
                        {energyOptions.map((energy) => (
                            <Button
                                key={energy.value}
                                variant="secondary"
                                className={cn(
                                    "flex flex-col border items-center gap-1 h-auto p-2 rounded-full h-12 w-12 sm:h-15 sm:w-15",
                                    currentEnergy === energy.value
                                        ? "bg-accent dark:bg-accent"
                                        : "bg-background dark:bg-background"
                                )}
                                onClick={() => {
                                    setCurrentEnergy(energy.value as any);
                                    setEnergyCurrentProgress(
                                        energy.progress as any
                                    );
                                }}
                            >
                                <energy.icon
                                    className={cn("w-4 h-4", energy.color)}
                                />
                                <span className="text-xs">{energy.label}</span>
                            </Button>
                        ))}
                    </div>
                    <div className="absolute w-full z-1">
                        <Progress
                            value={energyCurrentProgress}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Sexual Mood */}
            <div>
                <h3 className="font-normal text-muted-foreground text-sm mb-3">
                    Are you in the mood today? (Optional)
                </h3>
                <div className="relative inline-flex items-center w-full">
                    <div className="flex justify-between gap-2 w-full z-50">
                        {sexualMoodOptions.map((sexualMood: any) => (
                            <Button
                                key={sexualMood.value}
                                variant="secondary"
                                className={cn(
                                    "flex flex-col border items-center gap-1 h-auto p-2 rounded-full h-12 w-12 sm:h-15 sm:w-15",
                                    currentSexualMood === sexualMood.value
                                        ? "bg-accent dark:bg-accent"
                                        : "bg-background dark:bg-background"
                                )}
                                onClick={() => {
                                    setCurrentSexualMood(
                                        sexualMood.value as any
                                    );
                                    setSexualMoodCurrentProgress(
                                        sexualMood.progress as any
                                    );
                                }}
                            >
                                <sexualMood.icon
                                    className={cn("w-4 h-4", sexualMood.color)}
                                />
                                <span className="text-xs">
                                    {sexualMood.label}
                                </span>
                            </Button>
                        ))}
                    </div>
                    <div className="absolute w-full z-1">
                        <Progress
                            value={sexualMoodCurrentProgress}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Note */}
            <div>
                <h3 className="font-normal text-muted-foreground text-sm mb-3">
                    Add a note (Optional)
                </h3>
                <Textarea
                    placeholder="Share something about your day..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[100px] text-sm sm:text-base resize-none bg-background dark:bg-background inset-shadow-sm"
                    maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                    {note.length}/500
                </div>
            </div>

            {/* Submit Button */}
            <div className="w-full flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!currentMood || !currentEnergy || isSubmitting}
                    className="relative z-10 w-fit"
                    size="sm"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            Share with Partner
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
