"use client";

import { useState } from "react";

// components
import * as AlertDialog from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// icons
import { Plus } from "lucide-react";

// internal components
import { DDayForm } from "./DDayForm";

// types
import { DDayFormData, type AddDDayDialogProps } from "@/lib/types/calendar";

export function AddDDayDialog({
    isOpen,
    onOpenChange,
    initialDate,
    createDDay,
    uploadDDayImage,
}: AddDDayDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);

    const handleSubmit = async (formData: DDayFormData) => {
        setIsSubmitting(true);

        const ddayData = {
            ...formData,
            createdBy: "",
        };

        const success = await createDDay(ddayData);
        setIsSubmitting(false);

        if (success) {
            if (onOpenChange) {
                onOpenChange(false);
            } else {
                setInternalOpen(false);
            }
        }

        return success;
    };

    // determine if this dialog is controlled (has external open state) or uncontrolled
    // affects trigger button rendering
    const isControlled = isOpen !== undefined && onOpenChange !== undefined;

    // use external or internal open state
    const dialogOpen = isControlled ? isOpen : internalOpen;
    const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

    // handle cancel button click
    const handleCancel = () => {
        if (onOpenChange) {
            onOpenChange(false);
        } else {
            setInternalOpen(false);
        }
    };

    return (
        <AlertDialog.AlertDialog
            open={dialogOpen}
            onOpenChange={handleOpenChange}
        >
            {!isControlled && (
                <AlertDialog.AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="rounded-full flex items-center gap-2 hover:cursor-pointer sm:w-fit h-8 w-8 bg-card dark:bg-card"
                    >
                        <Plus className="h-6" />
                        <span className="hidden sm:flex">Add Event</span>
                    </Button>
                </AlertDialog.AlertDialogTrigger>
            )}
            <AlertDialog.AlertDialogContent>
                <AlertDialog.AlertDialogHeader>
                    <AlertDialog.AlertDialogTitle>
                        Add Event
                    </AlertDialog.AlertDialogTitle>
                    <AlertDialog.AlertDialogDescription asChild>
                        <DDayForm
                            initialData={
                                initialDate ? { date: initialDate } : undefined
                            }
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            submitLabel="Add"
                            cancelLabel="Cancel"
                            isSubmitting={isSubmitting}
                            uploadImage={uploadDDayImage}
                        />
                    </AlertDialog.AlertDialogDescription>
                </AlertDialog.AlertDialogHeader>
            </AlertDialog.AlertDialogContent>
        </AlertDialog.AlertDialog>
    );
}
