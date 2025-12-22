"use client";

import { useState } from "react";

// components
import * as Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

// types
import { CycleSettingsFormProps } from "@/lib/types/periods";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

export function CycleSettingsForm({
    cycleLength,
    periodLength,
    onSave,
    isLoading = false,
}: CycleSettingsFormProps) {
    const [formData, setFormData] = useState({
        cycleLength: cycleLength.toString(),
        periodLength: periodLength.toString(),
    });
    const [errors, setErrors] = useState<{
        cycleLength?: string;
        periodLength?: string;
    }>({});

    const validateForm = () => {
        const newErrors: { cycleLength?: string; periodLength?: string } = {};

        const cycleLengthNum = parseInt(formData.cycleLength);
        const periodLengthNum = parseInt(formData.periodLength);

        if (
            isNaN(cycleLengthNum) ||
            cycleLengthNum < 20 ||
            cycleLengthNum > 45
        ) {
            newErrors.cycleLength =
                "Cycle length must be between 20 and 45 days";
        }

        if (
            isNaN(periodLengthNum) ||
            periodLengthNum < 1 ||
            periodLengthNum > 10
        ) {
            newErrors.periodLength =
                "Period length must be between 1 and 10 days";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave({
                cycleLength: parseInt(formData.cycleLength),
                periodLength: parseInt(formData.periodLength),
            });
        } catch (error) {
            // error handling is done in the parent component
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <Card.Card className="w-full gap-4">
            <Card.CardHeader>
                <div className="p-4 rounded-lg">
                    <Card.CardTitle className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Cycle Settings
                    </Card.CardTitle>
                    <Card.CardDescription className="pt-2">
                        Configure your cycle and period length for accurate
                        predictions
                    </Card.CardDescription>
                </div>
                <Separator />
            </Card.CardHeader>

            <Card.CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex flex-col gap-2 w-full">
                            <Label htmlFor="cycleLength" className="px-3">
                                Cycle Length (days)
                            </Label>
                            <Input
                                id="cycleLength"
                                type="number"
                                min="20"
                                max="45"
                                value={formData.cycleLength}
                                onChange={(e) =>
                                    handleInputChange(
                                        "cycleLength",
                                        e.target.value
                                    )
                                }
                                placeholder="28"
                                className={cn("bg-card inset-shadow-sm", {
                                    "border-red-500": errors.cycleLength,
                                })}
                            />
                            {errors.cycleLength && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.cycleLength}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1 px-3">
                                Average length of your menstrual cycle (20-45
                                days)
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <Label htmlFor="periodLength" className="px-3">
                                Period Length (days)
                            </Label>
                            <Input
                                id="periodLength"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.periodLength}
                                onChange={(e) =>
                                    handleInputChange(
                                        "periodLength",
                                        e.target.value
                                    )
                                }
                                placeholder="5"
                                className={cn("bg-card inset-shadow-sm", {
                                    "border-red-500": errors.periodLength,
                                })}
                            />
                            {errors.periodLength && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.periodLength}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1 px-3">
                                Average length of your period (1-10 days)
                            </p>
                        </div>
                    </div>

                    <div className="w-full flex justify-end">
                        <Button
                            type="submit"
                            size={"sm"}
                            className="w-fit flex items-center gap-2 px-4"
                            disabled={isLoading}
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </form>
            </Card.CardContent>
        </Card.Card>
    );
}
