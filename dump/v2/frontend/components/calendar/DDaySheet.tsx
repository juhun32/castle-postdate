// FIX: undated events aren't showing up

"use client";

import { useState } from "react";

// componetns
import * as Sheet from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import * as Table from "@/components/ui/table";

// icons
import { Calendar, CircleSmall } from "lucide-react";

// types
import { DDaySheetProps, type DDay } from "@/lib/types/calendar";

// constants
import { selectGroups } from "@/lib/constants/calendar";
import { DDayIndicator } from "./DDayIndicator";

// individual row component for the events table used by DDaySheet
function DDayRow({
    dday,
    updateDDay,
    deleteDDay,
}: {
    dday: DDay; // the event to display from useDDays hook data
    updateDDay: DDaySheetProps["updateDDay"]; // function to update event from useDDays hook
    deleteDDay: DDaySheetProps["deleteDDay"]; // function to delete event from useDDays hook
}) {
    // state for tracking drag operations; used by DDayIndicator onDraggingChange prop
    const [isDragging, setIsDragging] = useState(false);

    // style to hide row during drag operations
    const style: React.CSSProperties = {
        visibility: isDragging ? "hidden" : "visible",
    };

    return (
        <Table.TableRow style={style}>
            <Table.TableCell className="md:max-w-[10rem]">
                <DDayIndicator
                    dday={dday}
                    updateDDay={updateDDay}
                    deleteDDay={deleteDDay}
                    context="sheet"
                    onDraggingChange={setIsDragging}
                />
            </Table.TableCell>
            <Table.TableCell className="text-muted-foreground">
                <p className=" bg-background inset-shadow-sm rounded px-2 text-sm text-foreground">
                    {dday.date ? dday.date.toLocaleDateString() : "(No Date)"}
                </p>
            </Table.TableCell>
            <Table.TableCell className="text-right">
                <p className=" bg-background inset-shadow-sm rounded px-2 text-sm text-foreground">
                    {dday.date ? dday.days : "-"}
                </p>
            </Table.TableCell>
        </Table.TableRow>
    );
}

// main event sheet component for displaying events in a table format used by calendar page
export function DDaySheet({ ddays, updateDDay, deleteDDay }: DDaySheetProps) {
    // sort events by date (unscheduled events first, then by date) used for consistent display order
    const allDdays = [...ddays].sort((a, b) => {
        if (!a.date && b.date) return -1;
        if (a.date && !b.date) return 1;
        if (a.date && b.date) {
            return a.date.getTime() - b.date.getTime();
        }
        return 0;
    });

    const renderTable = () => (
        <div className="overflow-y-auto shadow-sm rounded-lg bg-card">
            <Table.Table>
                <Table.TableHeader>
                    <Table.TableRow>
                        <Table.TableHead className="w-1/2 pl-3 text-xs">
                            Event
                        </Table.TableHead>
                        <Table.TableHead className="w-1/3 text-xs">
                            Date
                        </Table.TableHead>
                        <Table.TableHead className="w-1/6 text-right text-xs">
                            Count
                        </Table.TableHead>
                    </Table.TableRow>
                </Table.TableHeader>
                <Table.TableBody>
                    {allDdays.map((day) => (
                        <DDayRow
                            key={day.id}
                            dday={day}
                            updateDDay={updateDDay}
                            deleteDDay={deleteDDay}
                        />
                    ))}
                </Table.TableBody>
            </Table.Table>
        </div>
    );

    return (
        <>
            <div className="flex lg:hidden">
                <Sheet.Sheet>
                    <Sheet.SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="rounded-full h-8 w-8 sm:w-fit"
                        >
                            <Calendar className="h-6" />
                            <p className="hidden sm:flex">D-Days</p>
                        </Button>
                    </Sheet.SheetTrigger>
                    <Sheet.SheetContent side="top">
                        <Sheet.SheetHeader className="px-4">
                            <Sheet.SheetTitle>D-Days</Sheet.SheetTitle>
                            <Sheet.SheetDescription>
                                Days until or since, and the date of the event.
                            </Sheet.SheetDescription>
                        </Sheet.SheetHeader>
                        <div className="flex-1 overflow-hidden px-4">
                            {renderTable()}
                        </div>
                        <Sheet.SheetFooter className="max-w-screen flex flex-row px-8 justify-center">
                            <Sheet.SheetClose asChild>
                                <Button
                                    variant="outline"
                                    type="submit"
                                    className="w-1/2 hover:cursor-pointer rounded-full"
                                >
                                    Close
                                </Button>
                            </Sheet.SheetClose>
                        </Sheet.SheetFooter>
                    </Sheet.SheetContent>
                </Sheet.Sheet>
            </div>

            <div className="hidden lg:flex flex-col h-full gap-4">
                {allDdays.length > 0 ? (
                    renderTable()
                ) : (
                    <div className="border border-dashed rounded-lg flex flex-col gap-2 items-center justify-center h-full p-4">
                        <p className="text-sm text-muted-foreground">
                            Add your first event!
                        </p>
                    </div>
                )}
            </div>

            <div className="hidden lg:grid grid-cols-3 gap-1 p-2 px-4 border border-dashed rounded-lg inset-shadow-sm bg-card">
                {selectGroups.map((group, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                        <CircleSmall
                            className={`h-4 w-4 ${group.color}`}
                            strokeWidth={1.5}
                        />
                        <span className="text-xs font-medium">
                            {group.label}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
