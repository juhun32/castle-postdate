import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";

// components
import * as AlertDialog from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// internal components
import { EditDdayDialog } from "./EditDdayDialog";
import { getBorderColorFromGroup, getColorFromGroup } from "@/lib/utils";

// types
import { type DDayIndicatorProps } from "@/lib/types/calendar";
import { CircleSmall } from "lucide-react";

// individual event indicator component used in calendar grid and event lists
// used by CalendarGrid, DDaySheet, and ShowAllEvents
export function DDayIndicator({
    dday,
    updateDDay,
    deleteDDay,
    context = "grid",
    position = "single",
    dayIndex,
    droppableId,
    currentDate,
    uploadDDayImage,
}: DDayIndicatorProps) {
    // state for controlling the edit dialog used by EditDdayDialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    // state for controlling the details dialog
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // create unique id for dnd functionality
    const draggableId = droppableId
        ? `${dday.id}-${droppableId}`
        : `${dday.id}-${context}`;

    // set up dnd for this event
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: draggableId,
        data: { dday, context, position },
    });

    const handleEditClick = () => {
        setIsDetailsOpen(false);
        setTimeout(() => {
            setIsEditDialogOpen(true);
        }, 200);
    };

    // get border styles based on event position in multiday layout
    const getBorderStyles = () => {
        switch (position) {
            case "start":
                return "ml-1 rounded-l-full rounded-r-none border-r-0";
            case "middle":
                return "rounded-none border-l-0 border-r-0";
            case "end":
                return "mr-1 rounded-l-none rounded-r-full border-l-0";
            case "single":
            default:
                return "rounded-full mx-1";
        }
    };

    // determine if this is the start of a week (for showing event titles)
    const isStartOfWeek = dayIndex !== undefined && dayIndex % 7 === 0;

    // show event title if it's the start of a multiday event, single event, or start of week
    const showTitle =
        position === "start" || position === "single" || isStartOfWeek;

    const getEventWeekSpan = () => {
        if (
            !showTitle ||
            dayIndex === undefined ||
            !currentDate ||
            !dday.date
        ) {
            return 1;
        }

        const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const firstDayOfGrid = new Date(startOfMonth);
        firstDayOfGrid.setDate(startOfMonth.getDate() - startOfMonth.getDay());

        const currentCellDate = new Date(firstDayOfGrid);
        currentCellDate.setDate(firstDayOfGrid.getDate() + dayIndex);

        // get event start and end dates
        const eventStartDate = dday.date;
        const eventEndDate = dday.endDate || eventStartDate;

        // how many days are left in the week from the current cell
        const daysLeftInWeek = 7 - (dayIndex % 7);

        // how many days are left for the event itself starting from the current cell
        const timeDiff = eventEndDate.getTime() - currentCellDate.getTime();
        const daysLeftInEvent = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

        // span is the smaller of two but at least 1
        return Math.max(1, Math.min(daysLeftInWeek, daysLeftInEvent));
    };

    const weekSpan = getEventWeekSpan();

    return (
        <div
            className={`bg-background inset-shadow-sm border ${getBorderStyles()} ${getBorderColorFromGroup(
                dday.group
            )} text-sm`}
        >
            <AlertDialog.AlertDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            >
                <AlertDialog.AlertDialogTrigger asChild>
                    <div
                        ref={setNodeRef}
                        {...attributes}
                        {...listeners}
                        className="flex items-center sm:gap-1 w-full h-full px-1 font-normal hover:cursor-pointer"
                        title={`${dday.title} (${dday.days})`}
                    >
                        {showTitle ? (
                            <div
                                className="flex items-center gap-1 h-full"
                                style={{
                                    width: `calc(${weekSpan} * 100% + ${weekSpan} * 2px)`,
                                }}
                            >
                                <CircleSmall
                                    className={`h-4 w-4 flex-shrink-0 hidden md:block ${getColorFromGroup(
                                        dday.group
                                    )}`}
                                    strokeWidth={1.5}
                                />
                                <div className="flex-grow min-w-0 overflow-hidden z-40">
                                    <p
                                        className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
                                        title={dday.title}
                                    >
                                        {dday.title}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>&nbsp;</>
                        )}
                    </div>
                </AlertDialog.AlertDialogTrigger>

                <AlertDialog.AlertDialogContent>
                    <AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogTitle>
                            <div className="flex flex-col justify-between items-baseline gap-1 sm:gap-2">
                                <div className="truncate w-[15rem] sm:w-full">
                                    <span className="relative truncate block max-w-50 sm:max-w-90 lg:max-w-120">
                                        {dday.title}
                                    </span>
                                </div>
                                <div className="w-full flex items-baseline justify-between gap-1 sm:gap-2">
                                    {dday.date && (
                                        <span className="text-sm bg-card px-2 py-1 rounded inset-shadow-sm">
                                            [{dday.date.toLocaleDateString()}]
                                        </span>
                                    )}
                                    <span className="text-xs sm:text-base bg-card px-2 py-1 rounded inset-shadow-sm">
                                        {dday.days}
                                    </span>
                                </div>
                            </div>
                        </AlertDialog.AlertDialogTitle>
                        <AlertDialog.AlertDialogDescription className="text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <CircleSmall
                                    className={`h-4 w-4 ${getColorFromGroup(
                                        dday.group
                                    )}`}
                                    strokeWidth={1.5}
                                />
                                {dday.group}
                            </span>
                        </AlertDialog.AlertDialogDescription>
                    </AlertDialog.AlertDialogHeader>

                    {dday.description ? (
                        <div className="text-sm text-muted-foreground p-2 px-4 rounded bg-card inset-shadow-sm">
                            <p
                                style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    maxWidth: "100%",
                                }}
                            >
                                {dday.description}
                            </p>
                        </div>
                    ) : null}

                    {dday.imageUrl && (
                        <div className="relative h-70 lg:h-90 rounded justify-center items-end flex bg-card inset-shadow-sm p-2">
                            <Image
                                src={dday.imageUrl}
                                alt={dday.title}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}

                    <AlertDialog.AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            className="sm:mr-2 rounded-full w-20"
                            onClick={handleEditClick}
                            disabled={!dday.editable}
                        >
                            Edit
                        </Button>
                        <AlertDialog.AlertDialogCancel className="rounded-full w-20">
                            Close
                        </AlertDialog.AlertDialogCancel>
                    </AlertDialog.AlertDialogFooter>
                </AlertDialog.AlertDialogContent>
            </AlertDialog.AlertDialog>

            <EditDdayDialog
                dday={dday}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                updateDDay={updateDDay}
                deleteDDay={deleteDDay}
                uploadDDayImage={uploadDDayImage}
            />
        </div>
    );
}
