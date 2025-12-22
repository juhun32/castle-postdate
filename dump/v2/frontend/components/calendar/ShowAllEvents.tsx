"use client";

// components
import * as AlertDialog from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { EditDdayDialog } from "./EditDdayDialog";

// hooks
import { useAuth } from "@/components/auth-provider";

// types
import { ShowAllEventsProps, type DDay } from "@/lib/types/calendar";

// utils
import { cn } from "@/lib/utils";

// icons
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

// dialog component for showing all events when there are more than 3 events on a day - used by CalendarGrid
export function ShowAllEvents({
    ddays = [],
    updateDDay,
    deleteDDay,
    uploadDDayImage,
}: ShowAllEventsProps) {
    const { authState } = useAuth();
    const [editingDDay, setEditingDDay] = useState<DDay | null>(null);

    return (
        <>
            <AlertDialog.AlertDialog>
                <AlertDialog.AlertDialogTrigger asChild>
                    <div className="h-5 w-full flex items-center justify-center gap-1 px-1 rounded-full text-xs font-normal border border-dashed hover:cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" strokeWidth={1} />
                    </div>
                </AlertDialog.AlertDialogTrigger>
                <AlertDialog.AlertDialogContent>
                    <AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogTitle className="flex gap-2 items-baseline">
                            <p className="text-sm text-muted-foreground">
                                All Events for
                            </p>
                            {ddays[0]?.date?.toLocaleDateString("default", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </AlertDialog.AlertDialogTitle>
                    </AlertDialog.AlertDialogHeader>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ddays.map((dday) => {
                            const isOwner =
                                authState.user?.email === dday.createdBy;
                            return (
                                <div
                                    key={dday.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                dday.group === "indigo" &&
                                                    "bg-indigo-400",
                                                dday.group === "blue" &&
                                                    "bg-blue-400",
                                                dday.group === "emerald" &&
                                                    "bg-emerald-400",
                                                dday.group === "amber" &&
                                                    "bg-amber-400",
                                                dday.group === "rose" &&
                                                    "bg-rose-400"
                                            )}
                                        />
                                        <span className="font-medium">
                                            {dday.title}
                                        </span>
                                    </div>
                                    {isOwner && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setEditingDDay(dday)
                                                }
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() =>
                                                    deleteDDay(dday.id)
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <AlertDialog.AlertDialogFooter>
                        <AlertDialog.AlertDialogCancel>
                            Close
                        </AlertDialog.AlertDialogCancel>
                    </AlertDialog.AlertDialogFooter>
                </AlertDialog.AlertDialogContent>
            </AlertDialog.AlertDialog>

            {editingDDay && (
                <EditDdayDialog
                    dday={editingDDay}
                    isOpen={!!editingDDay}
                    onOpenChange={(open) => !open && setEditingDDay(null)}
                    updateDDay={updateDDay}
                    deleteDDay={deleteDDay}
                    uploadDDayImage={uploadDDayImage}
                />
            )}
        </>
    );
}
