// components
import { Button } from "@/components/ui/button";
import * as AlertDialog from "@/components/ui/alert-dialog";
import { DoorOpen, LogOut } from "lucide-react";

// utils
import { cn } from "@/lib/utils";

// types
import { AccountSettingsCardProps } from "@/lib/types/profile";
import { Separator } from "../ui/separator";

export const AccountSettingsCard = ({
    isDeleting,
    onDeleteAccount,
    onLogout,
}: AccountSettingsCardProps) => {
    return (
        <div className="gap-4">
            <div>
                <p className="flex items-center gap-2 text-lg">
                    Manage your account
                </p>
                <p className="text-sm text-muted-foreground">
                    Manage your account.
                </p>
            </div>
            <Separator className="my-2" />
            <div className="flex flex-col gap-2 mt-4">
                <AlertDialog.AlertDialog>
                    <AlertDialog.AlertDialogTrigger asChild>
                        <div className="grid sm:grid-cols-[1fr_2fr] items-center gap-4">
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                className="flex items-center gap-2 px-3 py-1 text-sm w-full bg-background dark:bg-background hover:cursor-pointer"
                            >
                                <DoorOpen className="w-4 h-4" />
                                Delete Account
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete the account and remove access
                                to all data.
                            </p>
                        </div>
                    </AlertDialog.AlertDialogTrigger>
                    <AlertDialog.AlertDialogContent>
                        <AlertDialog.AlertDialogHeader>
                            <AlertDialog.AlertDialogTitle>
                                Are you absolutely sure?
                            </AlertDialog.AlertDialogTitle>
                            <AlertDialog.AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your account.
                            </AlertDialog.AlertDialogDescription>
                        </AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogFooter>
                            <AlertDialog.AlertDialogCancel>
                                Cancel
                            </AlertDialog.AlertDialogCancel>
                            <AlertDialog.AlertDialogAction
                                onClick={onDeleteAccount}
                                disabled={isDeleting}
                                className={cn(
                                    "bg-destructive hover:bg-destructive/90 inset-shadow-sm"
                                )}
                            >
                                {isDeleting ? "Deleting..." : "Continue"}
                            </AlertDialog.AlertDialogAction>
                        </AlertDialog.AlertDialogFooter>
                    </AlertDialog.AlertDialogContent>
                </AlertDialog.AlertDialog>

                <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                    <Button
                        variant="outline"
                        className="w-full bg-background dark:bg-background"
                        size={"sm"}
                        onClick={onLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};
