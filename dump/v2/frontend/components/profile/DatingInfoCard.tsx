"use client";

import React, { useEffect } from "react";
import { formatDate } from "date-fns";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import * as Popover from "@/components/ui/popover";
import { CalendarIcon, Save, Users } from "lucide-react";

// utils
import { calculateDDay } from "@/lib/utils";

// types
import { DatingInfoCardProps } from "@/lib/types/profile";
import { Separator } from "../ui/separator";
import { Meh } from "@/lib/assets/meh";

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

export function DatingInfoCard({
    startedDating,
    onUpdate,
    isLoading,
}: DatingInfoCardProps) {
    const [open, setOpen] = React.useState(false);

    const initialValue =
        startedDating && isValidDate(new Date(startedDating))
            ? formatDate(new Date(startedDating), "MM/dd/yyyy")
            : "";

    const [value, setValue] = React.useState(initialValue);

    useEffect(() => {
        if (startedDating && isValidDate(new Date(startedDating))) {
            setValue(formatDate(new Date(startedDating), "MM/dd/yyyy"));
        } else {
            setValue("");
        }
    }, [startedDating]);

    const date =
        value && isValidDate(new Date(value)) ? new Date(value) : undefined;
    const [month, setMonth] = React.useState<Date | undefined>(date);

    const handleSave = () => {
        if (value && isValidDate(new Date(value))) {
            onUpdate(value);
        }
    };

    return (
        <div>
            <div>
                <p className="text-lg">When did you start dating?</p>
                <p className="text-sm text-muted-foreground">
                    When did you start dating your partner?
                </p>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between gap-4 mt-4">
                <div className="relative flex gap-2 w-full">
                    <Input
                        id="date"
                        value={value}
                        placeholder="MM/DD/YYYY"
                        className="w-full bg-background dark:bg-background flex items-center"
                        onChange={(e) => {
                            setValue(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setOpen(true);
                            }
                        }}
                    />
                    <Popover.Popover open={open} onOpenChange={setOpen}>
                        <Popover.PopoverTrigger asChild>
                            <Button
                                id="date-picker"
                                variant="ghost"
                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                            >
                                <CalendarIcon className="size-3.5" />
                                <span className="sr-only">Select date</span>
                            </Button>
                        </Popover.PopoverTrigger>
                        <Popover.PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                        >
                            <Calendar
                                mode="single"
                                selected={date}
                                captionLayout="dropdown"
                                month={month}
                                onMonthChange={setMonth}
                                onSelect={(selectedDate) => {
                                    if (selectedDate) {
                                        setValue(
                                            formatDate(
                                                selectedDate,
                                                "MM/dd/yyyy"
                                            )
                                        );
                                        setMonth(selectedDate);
                                    }
                                    setOpen(false);
                                }}
                            />
                        </Popover.PopoverContent>
                    </Popover.Popover>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={
                        isLoading || !value || !isValidDate(new Date(value))
                    }
                    variant={"outline"}
                    className="w-fit dark:bg-background"
                >
                    <Save />
                    {isLoading ? "Saving..." : "Save"}
                </Button>
            </div>
            <div className="pt-2">
                {startedDating && isValidDate(new Date(startedDating)) ? (
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground bg-background dark:bg-background w-fit rounded-lg">
                            {calculateDDay(new Date(startedDating))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            *Refresh page to see changes
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Not set</p>
                )}
            </div>
            <div className="flex gap-4 pt-2 items-center">
                <Meh className="w-40" />
                <p className="text-sm text-muted-foreground">
                    I am using this date to calculate how long you have been
                    dating your partner! You will be able to see this on the top
                    after you make changes and refresh the page. I am also going
                    to add this date to your calendar.
                </p>
            </div>
        </div>
    );
}
