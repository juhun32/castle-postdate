"use client";

import * as Card from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit } from "lucide-react";

import { SelectedDateDetailsProps } from "@/lib/types/periods";

export function SelectedDateDetails({
    date,
    periodData,
    onLogClick,
}: SelectedDateDetailsProps) {
    const hasData =
        periodData &&
        (periodData.symptoms.length > 0 ||
            periodData.mood.length > 0 ||
            periodData.sexActivity.length > 0 ||
            periodData.notes ||
            periodData.activities.length > 0);

    return (
        <Card.Card className="h-full gap-4">
            <Card.CardContent className="h-full flex flex-col">
                <Card.CardTitle>
                    <p className="text-lg font-semibold rounded h-7 w-fit px-2 inset-shadow-sm bg-card">
                        {date.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </Card.CardTitle>
                <Separator orientation="horizontal" className="my-4" />

                {!hasData ? (
                    <div className="h-full flex flex-col justify-between">
                        <div className="text-muted-foreground flex flex-col items-start gap-2">
                            <p>No data logged for this date</p>
                            <p className="text-xs">
                                Click on the Log tab to add data
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col justify-between">
                        <div className="space-y-4">
                            {periodData.symptoms.length > 0 && (
                                <div>
                                    <h4 className="text-sm mb-2">Symptoms</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {periodData.symptoms.map((symptom) => (
                                            <Badge
                                                key={symptom}
                                                variant="secondary"
                                                className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"
                                            >
                                                {symptom}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {periodData.mood.length > 0 && (
                                <div>
                                    <h4 className="text-sm mb-2">Mood</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {periodData.mood.map((mood) => (
                                            <Badge
                                                key={mood}
                                                variant="secondary"
                                                className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                                            >
                                                {mood}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {periodData.activities.length > 0 && (
                                <div>
                                    <h4 className="text-sm mb-2">Activities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {periodData.activities.map(
                                            (activity) => (
                                                <Badge
                                                    key={activity}
                                                    variant="secondary"
                                                    className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                                >
                                                    {activity}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {periodData.sexActivity.length > 0 && (
                                <div>
                                    <h4 className="text-sm mb-2">
                                        Sexual Activity
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {periodData.sexActivity.map(
                                            (activity) => (
                                                <Badge
                                                    key={activity}
                                                    variant="secondary"
                                                    className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                                >
                                                    {activity}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {periodData.notes && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                        Notes
                                    </h4>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                        {periodData.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card.CardContent>
            <Card.CardFooter className="flex justify-end">
                {hasData ? (
                    <Button
                        className="w-full text-foreground"
                        variant="outline"
                        onClick={onLogClick}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Log
                    </Button>
                ) : (
                    <Button
                        className="w-full text-foreground"
                        variant="outline"
                        onClick={onLogClick}
                    >
                        <Plus className="w-4 h-4" />
                        Log Data
                    </Button>
                )}
            </Card.CardFooter>
        </Card.Card>
    );
}
