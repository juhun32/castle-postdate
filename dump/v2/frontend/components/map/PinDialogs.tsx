import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    CalendarIcon,
    Edit2,
    Map,
    Pencil,
    SquareChevronRight,
    Trash2,
} from "lucide-react";

// types
import { DatePin } from "@/lib/types/map";
import { Label } from "../ui/label";
import {
    AlertDialogCancel,
    AlertDialogDescription,
} from "@radix-ui/react-alert-dialog";

export function ViewPinDialog({
    selectedPin,
    isEditing,
    setSelectedPin,
    editPin,
}: {
    selectedPin: DatePin | null;
    isEditing: boolean;
    setSelectedPin: (pin: DatePin | null) => void;
    editPin: (pin: DatePin) => void;
}) {
    return (
        <AlertDialog
            open={!!selectedPin && !isEditing}
            onOpenChange={(open) => {
                if (!open) setSelectedPin(null);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex w-full justify-between items-center text-xl">
                        {selectedPin?.title}
                        <p className="text-sm text-muted-foreground bg-card px-2 py-1 rounded inset-shadow-sm">
                            [{selectedPin?.lat.toPrecision(6)}
                            {", "}
                            {selectedPin?.lng.toPrecision(6)}]
                        </p>
                    </AlertDialogTitle>
                    <AlertDialogDescription
                        className="text-muted-foreground"
                        asChild
                    >
                        <div className="flex w-full justify-between items-center text-muted-foreground">
                            {selectedPin?.location}
                            <p className="text-sm text-muted-foreground bg-card px-2 py-1 rounded inset-shadow-sm">
                                {selectedPin && format(selectedPin.date, "PPP")}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-4 p-2 px-4 bg-card dark:bg-card rounded-lg inset-shadow-sm">
                    <div className="py-2">
                        {selectedPin?.description ? (
                            <p className="text-sm">{selectedPin.description}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">N/A</p>
                        )}
                    </div>
                </div>

                <AlertDialogFooter className="flex flex-row justify-end w-full rounded-full">
                    <Button
                        variant="outline"
                        onClick={() => selectedPin && editPin(selectedPin)}
                        className="rounded-full"
                    >
                        Edit
                    </Button>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" className="rounded-full">
                            Close
                        </Button>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function EditPinDialog({
    isEditing,
    setIsEditing,
    setAddingPin,
    selectedPin,
    formData,
    setFormData,
    savePin,
    deletePin,
}: {
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    setAddingPin: (v: boolean) => void;
    selectedPin: DatePin | null;
    formData: Omit<DatePin, "id">;
    setFormData: (f: Omit<DatePin, "id">) => void;
    savePin: () => void;
    deletePin: (id: string) => Promise<void>;
}) {
    return (
        <AlertDialog
            open={isEditing}
            onOpenChange={(open) => {
                setIsEditing(open);
                if (!open) setAddingPin(false);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {selectedPin ? "Edit Pin" : "Add Pin"}
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="grid grid-cols-[1fr_4fr] gap-4">
                    <Label className="text-sm">
                        <Pencil className="h-4 w-4" />
                        Title:
                    </Label>
                    <Input
                        placeholder="Title"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        className="border-none bg-card inset-shadow-sm rounded-full text-sm"
                    />
                    <Label className="text-sm">
                        <Map className="h-4 w-4" />
                        Location:
                    </Label>
                    <Input
                        placeholder="(Optional)"
                        value={formData.location}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                location: e.target.value,
                            })
                        }
                        className="border-none bg-card inset-shadow-sm rounded-full text-sm"
                    />
                    <Label className="text-sm">
                        <SquareChevronRight className="h-4 w-4" />
                        Description:
                    </Label>
                    <Input
                        placeholder="(Optional)"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        className="border-none bg-card inset-shadow-sm rounded-full text-sm"
                    />
                    <Label className="text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        Date:
                    </Label>
                    <Popover>
                        <PopoverTrigger
                            asChild
                            className="border-none rounded-full"
                        >
                            <Button
                                variant="outline"
                                className="bg-card w-full justify-start text-left"
                            >
                                {format(formData.date, "PPP")}
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            className="p-0 z-50"
                        >
                            <Calendar
                                mode="single"
                                selected={formData.date}
                                onSelect={(d) =>
                                    d && setFormData({ ...formData, date: d })
                                }
                                autoFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {isEditing && selectedPin ? (
                    <AlertDialogFooter className="flex flex-row justify-between sm:justify-between w-full">
                        <Button
                            variant="destructive"
                            onClick={() =>
                                selectedPin && deletePin(selectedPin.id)
                            }
                            className="rounded-full"
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                className="rounded-full"
                            >
                                Cancel
                            </Button>
                            <Button onClick={savePin} className="rounded-full">
                                Save
                            </Button>
                        </div>
                    </AlertDialogFooter>
                ) : (
                    <AlertDialogFooter className="flex flex-row justify-end items-center w-full rounded-full">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button onClick={savePin} className="rounded-full">
                            Add
                        </Button>
                    </AlertDialogFooter>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
