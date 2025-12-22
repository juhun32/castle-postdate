import { useState, useMemo } from "react";

// components
import * as AlertDialog from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// types
import { DDayFormData, EditDdayDialogProps } from "@/lib/types/calendar";
import { DDayForm } from "./DDayForm";

export function EditDdayDialog({
    dday,
    isOpen,
    onOpenChange,
    updateDDay,
    deleteDDay,
    uploadDDayImage,
}: EditDdayDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const handleSubmit = async (formData: DDayFormData) => {
        if (!dday.id) {
            toast("Missing event ID");
            return false;
        }

        setIsSubmitting(true);

        try {
            const success = await updateDDay(dday.id, formData);

            if (success) {
                toast("Your event has been updated successfully");
                onOpenChange(false);
            } else {
                toast("Failed to update event. Please try again.");
            }

            return success;
        } catch (error) {
            console.error("Error updating event:", error);
            toast("Something went wrong. Please try again.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!dday.id) return;
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!dday.id) return;
        setIsDeleting(true);
        try {
            const success = await deleteDDay(dday.id);

            if (success) {
                toast.success("Your event has been deleted successfully");
                onOpenChange(false);
            } else {
                toast.error("Failed to delete event. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
        }
    };

    // memoize initial data to prevent it from being recreated on every render
    // to stabilize the prop and prevent the DDayForm's useEffect from re-running unnecessarily
    const initialData = useMemo(
        () => ({
            title: dday.title,
            group: dday.group,
            description: dday.description,
            imageUrl: dday.imageUrl,
            date: dday.date,
            endDate: dday.endDate,
            isAnnual: dday.isAnnual,
            connectedUsers: dday.connectedUsers || [],
        }),
        [dday]
    );

    return (
        <>
            <AlertDialog.AlertDialog open={isOpen} onOpenChange={onOpenChange}>
                <AlertDialog.AlertDialogContent>
                    <AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogTitle>
                            Edit Event
                        </AlertDialog.AlertDialogTitle>
                        <AlertDialog.AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <DDayForm
                                    initialData={initialData}
                                    onSubmit={handleSubmit}
                                    onCancel={() => onOpenChange(false)}
                                    onDelete={handleDelete}
                                    submitLabel="Save"
                                    cancelLabel="Cancel"
                                    deleteLabel="Delete Event"
                                    isSubmitting={isSubmitting}
                                    isDeleting={isDeleting}
                                    uploadImage={uploadDDayImage}
                                />
                            </div>
                        </AlertDialog.AlertDialogDescription>
                    </AlertDialog.AlertDialogHeader>
                </AlertDialog.AlertDialogContent>
            </AlertDialog.AlertDialog>

            <AlertDialog.AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialog.AlertDialogContent>
                    <AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialog.AlertDialogTitle>
                        <AlertDialog.AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the event.
                        </AlertDialog.AlertDialogDescription>
                    </AlertDialog.AlertDialogHeader>
                    <AlertDialog.AlertDialogFooter>
                        <AlertDialog.AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialog.AlertDialogCancel>
                        <AlertDialog.AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-card hover:bg-destructive/90 inset-shadow-sm"
                        >
                            {isDeleting ? "Deleting..." : "Delete event"}
                        </AlertDialog.AlertDialogAction>
                    </AlertDialog.AlertDialogFooter>
                </AlertDialog.AlertDialogContent>
            </AlertDialog.AlertDialog>
        </>
    );
}
