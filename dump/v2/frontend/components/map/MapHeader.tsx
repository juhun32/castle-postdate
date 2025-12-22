import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export function MapHeader({
    addingPin,
    setAddingPin,
}: {
    addingPin: boolean;
    setAddingPin: (v: boolean) => void;
}) {
    useEffect(() => {
        if (addingPin) {
            toast.info("Click on the map to place your pin");
        }
    }, [addingPin]);

    return (
        <div className="flex justify-between items-center h-fit">
            <Button
                onClick={() => setAddingPin(!addingPin)}
                size="sm"
                variant={"outline"}
                className="rounded-full bg-card dark:bg-card"
            >
                {addingPin ? (
                    <p className="flex items-center gap-2">
                        <X />
                        Cancel
                    </p>
                ) : (
                    <p className="flex items-center gap-2">
                        <Plus />
                        Add New Pin
                    </p>
                )}
            </Button>
        </div>
    );
}
