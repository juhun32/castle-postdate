"use client";
import { useState } from "react";

// drag & drop
import { useDroppable } from "@dnd-kit/core";

// components
import { Button } from "../ui/button";

// icons
import { CirclePlus } from "lucide-react";

// internal components
import { DDayIndicator } from "@/components/calendar/DDayIndicator";
import { AddDDayDialog } from "@/components/calendar/AddDdayDialog";
import { ShowAllEvents } from "@/components/calendar/ShowAllEvents";

// types
import { CalendarGridProps, DDay, EventPosition } from "@/lib/types/calendar";

// hooks/utils
import { getEventPosition } from "@/lib/hooks/useDDays";
import { cn } from "@/lib/utils";

function GridDDayItem({
    dday,
    position = "single",
    updateDDay,
    deleteDDay,
    dayIndex,
    droppableId,
    activeDDay,
    currentDate,
    uploadDDayImage,
}: {
    dday: DDay;
    position?: EventPosition;
    updateDDay: CalendarGridProps["updateDDay"];
    deleteDDay: CalendarGridProps["deleteDDay"];
    dayIndex?: number;
    droppableId: string;
    activeDDay?: DDay | null;
    currentDate?: Date;
    uploadDDayImage?: CalendarGridProps["uploadDDayImage"];
}) {
    const isEventBeingDragged = activeDDay && activeDDay.id === dday.id;

    return (
        <div className={cn("w-full", isEventBeingDragged ? "invisible" : "")}>
            <DDayIndicator
                dday={dday}
                updateDDay={updateDDay}
                deleteDDay={deleteDDay}
                context="grid"
                position={position}
                dayIndex={dayIndex}
                droppableId={droppableId}
                currentDate={currentDate}
                uploadDDayImage={uploadDDayImage}
            />
        </div>
    );
}

function CalendarDayCell({
    day,
    index,
    currentDate,
    isSelected,
    isToday,
    selectDate,
    getDDaysForDay,
    updateDDay,
    deleteDDay,
    handleAddClick,
    activeDDay,
    uploadDDayImage,
}: {
    day: number | null;
    index: number;
    currentDate: Date;
    isSelected: (day: number) => boolean;
    isToday: (day: number) => boolean;
    selectDate: (day: number) => void;
    getDDaysForDay: (day: number | null, currentDate: Date) => (DDay | null)[];
    updateDDay: CalendarGridProps["updateDDay"];
    deleteDDay: CalendarGridProps["deleteDDay"];
    handleAddClick: (e: React.MouseEvent, day: number) => void;
    activeDDay?: DDay | null;
    uploadDDayImage?: CalendarGridProps["uploadDDayImage"];
}) {
    const todayDate = day
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        : null;

    const dayDdays = todayDate ? getDDaysForDay(day, currentDate) : [];

    const dateForId = day
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        : null;

    const droppableId = dateForId
        ? dateForId.toISOString().split("T")[0]
        : `empty-${index}`;

    const { isOver, setNodeRef } = useDroppable({
        id: droppableId,
        disabled: !day,
    });

    const weekNumber = Math.floor(index / 7) + 1;

    const isHighlightedWeek =
        weekNumber === 2 || weekNumber === 4 || weekNumber === 6;

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full
            ${isHighlightedWeek ? "border-y border-dashed" : ""}
            ${isOver ? " bg-muted" : ""}`}
            onClick={() => day && selectDate(day)}
        >
            {day && (
                <div className="flex flex-col h-full">
                    <div className="p-1 flex flex-col gap-1">
                        {isSelected(day) ? (
                            <div className="flex items-center justify-between h-6">
                                <div className="w-6 flex justify-center border-b border-foreground">
                                    {day}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="hidden sm:flex h-6 w-6 rounded-full"
                                    size={"sm"}
                                    onClick={(e) => handleAddClick(e, day)}
                                >
                                    <CirclePlus className="h-6" />
                                </Button>
                            </div>
                        ) : isToday(day) ? (
                            <div className="h-6 w-6 border-b border-foreground border-dashed flex items-center justify-center">
                                {day}
                            </div>
                        ) : (
                            <div className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                                {day}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col mt-1 gap-1 text-xs">
                        {dayDdays.slice(0, 3).map((dday, idx) => {
                            if (!dday) {
                                return (
                                    <div
                                        key={`placeholder-${day}-${idx}`}
                                        className="flex text-sm border border-transparent"
                                    >
                                        &nbsp;
                                    </div>
                                );
                            }

                            const position = todayDate
                                ? getEventPosition(dday, todayDate)
                                : "single";

                            return (
                                <GridDDayItem
                                    key={`dday-slice-${day}-${idx}-${
                                        dday.id || idx
                                    }`}
                                    dday={dday}
                                    position={position}
                                    updateDDay={updateDDay}
                                    deleteDDay={deleteDDay}
                                    dayIndex={index}
                                    droppableId={droppableId}
                                    activeDDay={activeDDay}
                                    currentDate={currentDate}
                                    uploadDDayImage={uploadDDayImage}
                                />
                            );
                        })}
                        <div>
                            {dayDdays.length >= 4 && (
                                <ShowAllEvents
                                    ddays={
                                        dayDdays.filter(
                                            (d) => d !== null
                                        ) as DDay[]
                                    }
                                    updateDDay={updateDDay}
                                    deleteDDay={deleteDDay}
                                    uploadDDayImage={uploadDDayImage}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function CalendarGrid({
    currentDate,
    monthData,
    isSelected,
    isToday,
    selectDate,
    getDDaysForDay,
    createDDay,
    updateDDay,
    deleteDDay,
    activeDDay,
    uploadDDayImage,
}: CalendarGridProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(
        null
    );

    const handleAddClick = (e: React.MouseEvent, day: number) => {
        // prevent the click event from bubbling up to the parent div
        e.stopPropagation();

        const dateForDialog = new Date(currentDate);
        dateForDialog.setDate(day);

        setSelectedDateForAdd(dateForDialog);
        setIsAddDialogOpen(true);
    };

    return (
        <>
            <div className="rounded-lg flex flex-col min-h-0 h-full bg-card shadow-sm">
                <div className="grid grid-cols-7 p-2 border-b">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div key={i} className="text-center font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr h-full overflow-hidden">
                    {monthData.map((day, i) => (
                        <CalendarDayCell
                            key={i}
                            index={i}
                            day={day}
                            currentDate={currentDate}
                            isSelected={isSelected}
                            isToday={isToday}
                            selectDate={selectDate}
                            getDDaysForDay={getDDaysForDay}
                            updateDDay={updateDDay}
                            deleteDDay={deleteDDay}
                            handleAddClick={handleAddClick}
                            activeDDay={activeDDay}
                            uploadDDayImage={uploadDDayImage}
                        />
                    ))}
                </div>
            </div>
            <AddDDayDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                initialDate={selectedDateForAdd}
                createDDay={createDDay}
                uploadDDayImage={uploadDDayImage}
            />
        </>
    );
}
