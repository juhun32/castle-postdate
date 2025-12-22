// compontents
import * as Card from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User, Venus, Mars } from "lucide-react";

// utils
import { cn } from "@/lib/utils";

// types
import { GenderSettingsCardProps } from "@/lib/types/profile";
import { Separator } from "../ui/separator";
import { Think } from "@/lib/assets/think";

export const GenderSettingsCard = ({
    userSex,
    isLoading,
    onSexChange,
}: GenderSettingsCardProps) => {
    return (
        <div className="gap-4">
            <div>
                <p className="flex items-center gap-2 text-lg">
                    Tell us about yourself
                </p>
                <p className="text-sm text-muted-foreground">
                    Cycle data visibility and editing permissions
                </p>
            </div>
            <Separator className="my-2" />
            <div className="mt-4">
                <div className="flex flex-col justify-center items-center gap-4 mb-2">
                    <span
                        className={cn(
                            "text-sm select-none",
                            userSex === "female"
                                ? "text-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <Venus className="inline-block w-4 h-4 mr-2" />I am
                        sharing my cycle data to my partner
                    </span>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={userSex === "male"}
                            onCheckedChange={(val) =>
                                onSexChange(val ? "male" : "female")
                            }
                            className="m-1"
                            disabled={isLoading}
                            id="Toggle sex"
                        />
                        {userSex && (
                            <Badge
                                variant="outline"
                                className="w-fit bg-background dark:bg-background inset-shadow-sm border-none"
                            >
                                Current Setting :{" "}
                                {userSex === "female" ? "Female" : "Male"}
                            </Badge>
                        )}
                    </div>

                    <span
                        className={cn(
                            "text-sm select-none",
                            userSex === "male"
                                ? "text-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <Mars className="inline-block w-4 h-4 mr-2" />I am
                        shared my partner's cycle data
                    </span>
                </div>

                <div className="pt-2 flex gap-4 items-center">
                    <p className="text-muted-foreground text-sm">
                        I am using this information to know if you are the one
                        sharing! Only personalized experience purposes, I am not
                        using this data for anything else.
                    </p>
                    <Think className="w-40 h-auto" />
                </div>
            </div>
        </div>
    );
};
