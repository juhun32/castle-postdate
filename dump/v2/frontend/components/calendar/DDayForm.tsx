"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { DateRange } from "react-day-picker";

// utils
import { cn } from "@/lib/utils";
import { selectGroups } from "@/lib/constants/calendar";

// components
import * as Popover from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import * as Select from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// icons
import {
    Calendar as CalendarIcon,
    CircleSmall,
    Pencil,
    SquareChevronRight,
    Settings,
    Loader2,
    ImageDown,
    ImageIcon,
    CircleX,
} from "lucide-react";

// types
import { DDayFormData, DDayFormProps } from "@/lib/types/calendar";

export function DDayForm({
    initialData,
    onSubmit,
    uploadImage,
    onCancel,
    onDelete,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    deleteLabel = "Delete",
    isSubmitting = false,
    isDeleting = false,
}: DDayFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [group, setGroup] = useState(initialData?.group || "");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isAnnual, setIsAnnual] = useState(false);
    const [connectedEmail, setConnectedEmail] = useState(
        initialData?.connectedUsers?.[0] || ""
    );
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || "");
            setGroup(initialData.group || "");
            setDescription(initialData.description || "");
            setImageUrl(initialData.imageUrl || "");
            setIsAnnual(initialData.isAnnual || false);
            setConnectedEmail(initialData.connectedUsers?.[0] || "");

            if (initialData.date) {
                const fromDate = new Date(initialData.date);
                const toDate = initialData.endDate
                    ? new Date(initialData.endDate)
                    : fromDate;
                setDateRange({ from: fromDate, to: toDate });

                const shouldBeMultiDay =
                    fromDate.getTime() !== toDate.getTime();
                setIsMultiDay(shouldBeMultiDay);
            }
        }
    }, [initialData]);

    // handle file selection and enforce size limit
    // no upload happens here, just file selection
    // the actual upload is handled in the handleSubmit function
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxFileSize = 5 * 1024 * 1024; // 5MB limit
        if (file.size > maxFileSize) {
            toast.error(
                `Please select a file smaller than ${
                    maxFileSize / 1024 / 1024
                }MB.`
            );
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
        setImageUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageUrl("");
        setSelectedFile(null);
    };

    const handleSubmit = async () => {
        if (!title || !uploadImage) return;

        setIsUploading(true);
        let finalImageUrl = imageUrl;

        if (selectedFile) {
            const publicUrl = await uploadImage(selectedFile);
            if (publicUrl) {
                finalImageUrl = publicUrl;
            } else {
                console.error("Upload failed, aborting form submission.");
                setIsUploading(false);
                return;
            }
        } else if (imageUrl === "" && initialData?.imageUrl) {
            finalImageUrl = "";
        }

        const connectedUsers = connectedEmail ? [connectedEmail] : [];
        const formData: DDayFormData = {
            title,
            group: group || "others",
            description,
            imageUrl: finalImageUrl,
            isAnnual,
            connectedUsers,
        };

        if (dateRange?.from) {
            formData.date = dateRange.from;
            if (isMultiDay && dateRange.to && dateRange.to >= dateRange.from) {
                formData.endDate = dateRange.to;
            }
        }

        const success = await onSubmit(formData);
        setIsUploading(false);

        if (success) {
            setTitle("");
            setGroup("");
            setDescription("");
            setImageUrl("");
            setSelectedFile(null);
            setIsAnnual(false);
            setConnectedEmail("");
            setDateRange(undefined);
            setIsMultiDay(false);
        }
    };

    const formatDateDisplay = () => {
        if (!dateRange?.from) return <span>(Optional)</span>;

        if (isMultiDay && dateRange.to) {
            return (
                <>
                    <span className="hidden sm:inline">
                        {format(dateRange.from, "PP")} to{" "}
                        {format(dateRange.to, "PP")}
                    </span>
                    <span className="sm:hidden">
                        {format(dateRange.from, "M/d/yy")} to{" "}
                        {format(dateRange.to, "M/d/yy")}
                    </span>
                </>
            );
        }

        return (
            <>
                <span className="hidden sm:inline">
                    {format(dateRange.from, "PPP")}
                </span>
                <span className="sm:hidden">
                    {format(dateRange.from, "M/d/yy")}
                </span>
            </>
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_4fr] gap-2 items-center">
                <Label
                    className={cn(
                        "text-sm font-medium",
                        !title ? "text-muted-foreground" : "text-foreground"
                    )}
                >
                    <Pencil className="h-4 w-4" />
                    Title:
                </Label>
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn(
                        "rounded-md text-sm w-full focus:text-foreground rounded-full px-4 bg-card",
                        !title ? "text-muted-foreground" : "text-foreground"
                    )}
                    placeholder="Title"
                />

                <Label
                    className={cn(
                        "text-sm font-medium",
                        !group ? "text-muted-foreground" : "text-foreground"
                    )}
                >
                    <CircleSmall className="h-4 w-4" />
                    Group:
                </Label>
                <Select.Select
                    value={group || "others"}
                    onValueChange={setGroup}
                >
                    <Select.SelectTrigger className="border-none inset-shadow-sm w-full text-sm rounded-full px-4 bg-card shadow-none">
                        <Select.SelectValue placeholder="Others" />
                    </Select.SelectTrigger>
                    <Select.SelectContent className="w-full">
                        <Select.SelectGroup>
                            {selectGroups.map((selectGroup) => (
                                <Select.SelectItem
                                    key={selectGroup.value}
                                    value={selectGroup.value}
                                    className="cursor-pointer text-sm"
                                >
                                    <CircleSmall
                                        className={selectGroup.color}
                                    />
                                    <p className="text-foreground">
                                        {selectGroup.label}
                                    </p>
                                </Select.SelectItem>
                            ))}
                        </Select.SelectGroup>
                    </Select.SelectContent>
                </Select.Select>

                <Label
                    className={cn(
                        "text-sm font-medium",
                        !description
                            ? "text-muted-foreground"
                            : "text-foreground"
                    )}
                >
                    <SquareChevronRight className="h-4 w-4" />
                    Description:
                </Label>
                <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(
                        "rounded-md text-sm w-full focus:text-foreground rounded-full px-4 bg-card",
                        !description
                            ? "text-muted-foreground"
                            : "text-foreground"
                    )}
                    placeholder="(Optional)"
                />

                <Label
                    className={cn(
                        "text-sm font-medium",
                        !dateRange?.from
                            ? "text-muted-foreground"
                            : "text-foreground"
                    )}
                >
                    <CalendarIcon className="h-4 w-4" />
                    Date:
                </Label>
                <Popover.Popover>
                    <Popover.PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "border-none inset-shadow-sm justify-start text-left font-normal w-full text-foreground rounded-full px-4 bg-card",
                                !dateRange?.from && "text-muted-foreground"
                            )}
                        >
                            {formatDateDisplay()}
                        </Button>
                    </Popover.PopoverTrigger>
                    <Popover.PopoverContent
                        className="w-auto p-0 z-50"
                        align="start"
                        key={`calendar-${isMultiDay ? "range" : "single"}`}
                    >
                        {isMultiDay ? (
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                className="pointer-events-auto"
                                numberOfMonths={2}
                            />
                        ) : (
                            <Calendar
                                mode="single"
                                selected={dateRange?.from}
                                onSelect={(date) =>
                                    setDateRange(
                                        date
                                            ? { from: date, to: date }
                                            : undefined
                                    )
                                }
                                className="pointer-events-auto"
                                numberOfMonths={1}
                            />
                        )}
                    </Popover.PopoverContent>
                </Popover.Popover>

                <Label className="text-sm font-medium text-foreground">
                    <Settings className="h-4 w-4" />
                    Options:
                </Label>
                <div className="flex items-center gap-4 p-2">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={isMultiDay ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                console.log(
                                    "Multi-day button clicked, current state:",
                                    isMultiDay
                                );
                                const newIsMultiDay = !isMultiDay;
                                console.log(
                                    "Setting isMultiDay to:",
                                    newIsMultiDay
                                );
                                setIsMultiDay(newIsMultiDay);

                                if (dateRange?.from) {
                                    if (newIsMultiDay) {
                                        setDateRange({
                                            from: dateRange.from,
                                            to: dateRange.from,
                                        });
                                    } else {
                                        setDateRange({
                                            from: dateRange.from,
                                            to: dateRange.from,
                                        });
                                    }
                                }
                            }}
                            className="h-6 px-2 text-xs bg-card"
                        >
                            Multi-day {isMultiDay ? "✓" : ""}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={isAnnual ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                console.log(
                                    "Annual button clicked, current state:",
                                    isAnnual
                                );
                                setIsAnnual(!isAnnual);
                            }}
                            className="h-6 px-2 text-xs bg-card"
                        >
                            Annual {isAnnual ? "✓" : ""}
                        </Button>
                    </div>
                </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-[1fr_4fr] gap-2 items-center">
                <Label htmlFor="event-image" className="text-sm font-medium">
                    <ImageIcon className="h-4 w-4" />
                    Image:
                </Label>
                {isUploading ? (
                    <div className="flex items-center justify-center w-full h-32 mt-1 border-2 border-dashed rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : imageUrl ? (
                    <div className="relative h-70 lg:h-90 w-full border-2 border-dashed rounded-lg">
                        <Image
                            src={imageUrl}
                            alt="Event image preview"
                            fill
                            className="rounded-lg object-contain p-2"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full"
                            onClick={handleRemoveImage}
                        >
                            <CircleX className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <Input
                            id="event-image"
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="hidden"
                        />
                        <Label
                            htmlFor="event-image"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 bg-card inset-shadow-sm"
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <ImageDown className="w-7 h-7 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG, GIF (max. 5MB)
                                </p>
                            </div>
                        </Label>
                    </>
                )}
            </div>

            <div className="flex justify-between items-center gap-2 pt-4">
                <div>
                    {onDelete && (
                        <Button
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isDeleting || isSubmitting}
                            className="rounded-full inset-shadow-sm"
                        >
                            {isDeleting ? "Deleting..." : deleteLabel}
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {onCancel && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isDeleting || isSubmitting}
                            className="rounded-full"
                        >
                            {cancelLabel}
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={isDeleting || isSubmitting || !title}
                        className="rounded-full"
                    >
                        {isSubmitting ? "Saving..." : submitLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
