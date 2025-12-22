"use client";

// TODO

// 1.
// need to make stared events for dday dialog. right now it is only
// showing one month's events, but it should show all events
// but that is not possible if there are lots of events
// so i think we will need to only hsow special events
// which are starred or something like that

// 2.
// for annual events, dday is not working properly
// it is showing the D-Day based on the current date
// but it should show the D-Day based on the year of the event
// for ex) D-3 to event from 2025/1/1 should be D-368 for 2026/1/1

// 3.
// pagination is done, but i think there are some improvements
// that canbe made. like lazy loading, etc.

// 4.
// +number button is not yet implemented
// for days with >2 events

import { redirect } from "next/navigation";
import { useState } from "react";

// hooks
import { useCalendar } from "@/lib/hooks/useCalendar";
import { useDDays } from "@/lib/hooks/useDDays";

// components
import { useAuth } from "@/components/auth-provider";

// components/calendar
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DDaySheet } from "@/components/calendar/DDaySheet";
import { AddDDayDialog } from "@/components/calendar/AddDdayDialog";
import { DDayIndicator } from "@/components/calendar/DDayIndicator";

// drag & drop
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { DDay, EventPosition } from "@/lib/types/calendar";

export default function Calendar() {
    const { authState } = useAuth();

    if (!authState.isAuthenticated && typeof window !== "undefined") {
        redirect("/");
    }

    // calendar state
    const {
        currentDate,
        monthData,
        goToNextMonth,
        goToPrevMonth,
        goToToday,
        isToday,
        isSelected,
        selectDate,
    } = useCalendar();

    // dday state
    const {
        ddays,
        updateDDay,
        deleteDDay,
        createDDay,
        getRenderableDDaysForDay,
        uploadDDayImage,
    } = useDDays(currentDate);

    // dnd state
    const [activeDDay, setActiveDDay] = useState<DDay | null>(null);
    const [activeContext, setActiveContext] = useState<
        "sheet" | "grid" | undefined
    >();
    const [activePosition, setActivePosition] =
        useState<EventPosition>("single");

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current) {
            setActiveDDay(active.data.current.dday as DDay);
            setActiveContext(active.data.current.context as "grid" | "sheet");
            setActivePosition(active.data.current.position as EventPosition);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id && active.data.current) {
            const ddayId = (active.id as string).split("-")[0];
            const targetDateStr = over.id as string;
            const originalDDay = active.data.current.dday as DDay;

            // parse target date and adjust for timezone
            const targetDate = new Date(targetDateStr);
            const userTimezoneOffset = targetDate.getTimezoneOffset() * 60000;
            const correctedDate = new Date(
                targetDate.getTime() + userTimezoneOffset
            );

            const updates: Partial<Omit<DDay, "id" | "days">> = {
                date: correctedDate,
            };

            // multi-day events
            if (originalDDay.date && originalDDay.endDate) {
                const originalStartDate = new Date(originalDDay.date);
                originalStartDate.setHours(0, 0, 0, 0);

                const originalEndDate = new Date(originalDDay.endDate);
                originalEndDate.setHours(0, 0, 0, 0);

                const duration =
                    originalEndDate.getTime() - originalStartDate.getTime();
                const newEndDate = new Date(correctedDate.getTime() + duration);
                updates.endDate = newEndDate;
            }

            updateDDay(ddayId, updates);
        }

        setActiveDDay(null);
        setActiveContext(undefined);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex items-center justify-center">
                <div className="container lg:grid lg:grid-cols-[3fr_1fr] h-full">
                    <div className="flex flex-col h-full container pt-12 pb-8">
                        <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-8">
                            <CalendarHeader
                                currentDate={currentDate}
                                goToNextMonth={goToNextMonth}
                                goToPrevMonth={goToPrevMonth}
                                goToToday={goToToday}
                            />
                            <div className="flex items-center gap-2 lg:hidden">
                                <DDaySheet
                                    ddays={ddays}
                                    updateDDay={updateDDay}
                                    deleteDDay={deleteDDay}
                                />
                                <AddDDayDialog
                                    createDDay={createDDay}
                                    uploadDDayImage={uploadDDayImage}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 md:pl-8 flex flex-col h-full">
                            <CalendarGrid
                                currentDate={currentDate}
                                monthData={monthData}
                                isSelected={isSelected}
                                isToday={isToday}
                                selectDate={selectDate}
                                getDDaysForDay={getRenderableDDaysForDay}
                                createDDay={createDDay}
                                updateDDay={updateDDay}
                                deleteDDay={deleteDDay}
                                activeDDay={activeDDay}
                                uploadDDayImage={uploadDDayImage}
                            />
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col h-full pr-4 md:pr-8 pt-20 pb-12 gap-4">
                        <AddDDayDialog
                            createDDay={createDDay}
                            uploadDDayImage={uploadDDayImage}
                        />
                        <DDaySheet
                            ddays={ddays}
                            updateDDay={updateDDay}
                            deleteDDay={deleteDDay}
                        />
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeDDay ? (
                    <div className="h-6 w-32 rounded-full shadow-lg">
                        <DDayIndicator
                            dday={activeDDay}
                            context={activeContext}
                            position={activePosition}
                            updateDDay={async () => true}
                            deleteDDay={async () => true}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
