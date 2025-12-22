"use client";

// components
import * as Card from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplets, Calendar, Heart, Moon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// types
import { CycleStatusCardProps } from "@/lib/types/periods";

export function CycleStatusCard({
    currentCycleDay,
    cycleLength,
    daysUntilNextPeriod,
    nextPeriod,
    hasPeriodData,
    fertileStart,
    fertileEnd,
    isPartnerData = false,
}: CycleStatusCardProps) {
    if (!hasPeriodData) {
        return (
            <Card.Card className="w-full h-full">
                <Card.CardContent>
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                    <div className="mt-4">
                        <h2 className="text-sm font-semibold">
                            {isPartnerData
                                ? "No Partner Data Yet"
                                : "No Period Data Yet"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isPartnerData
                                ? "Your partner hasn't started tracking their period yet. Once they begin tracking, you'll see their cycle information here."
                                : "Start tracking your period by right-clicking on dates in the overview or calendar to mark them as period days."}
                        </p>
                    </div>
                </Card.CardContent>
            </Card.Card>
        );
    }

    return (
        <Card.Card className="w-full h-full">
            <Card.CardContent>
                <div className="flex items-baseline gap-2">
                    <p className="text-lg font-semibold h-7 px-2 inset-shadow-sm bg-card rounded">
                        Day {currentCycleDay ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        of {isPartnerData ? "partner's" : "your"} cycle
                    </p>
                </div>

                <Separator orientation="horizontal" className="my-4" />

                <div>
                    <div className="flex items-baseline justify-between">
                        <div className="flex gap-1 lg:gap-2">
                            <span className="text-sm text-muted-foreground">
                                {currentCycleDay
                                    ? Math.round(
                                          (currentCycleDay / cycleLength) * 100
                                      )
                                    : "—"}
                                %
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1 text-center">
                            <div className="text-lg font-semibold bg-card p-0 px-0 py-0 rounded h-7 w-7 inset-shadow-sm">
                                {daysUntilNextPeriod ?? "—"}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                days until{" "}
                                {isPartnerData ? "partner's" : "next"} period
                            </p>
                        </div>
                    </div>
                    <Progress
                        value={
                            currentCycleDay
                                ? (currentCycleDay / cycleLength) * 100
                                : 0
                        }
                        className="mt-1"
                    />
                </div>

                <div className="grid">
                    <div className="mt-2 lg:mt-4 inset-shadow-sm rounded-lg bg-card">
                        <div className="flex items-center gap-4 px-4 py-4">
                            <Droplets className="w-4 h-4 text-rose-500" />
                            <div>
                                <p className="text-sm font-medium">
                                    {isPartnerData ? "Partner's" : "Next"}{" "}
                                    Period Expected
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {nextPeriod
                                        ? nextPeriod.toLocaleDateString(
                                              "en-US",
                                              {
                                                  weekday: "long",
                                                  month: "long",
                                                  day: "numeric",
                                              }
                                          )
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 lg:mt-4 inset-shadow-sm rounded-lg px-4 py-4 bg-card">
                        <Heart className="w-4 h-4 text-blue-400" />
                        <div>
                            <p className="text-sm font-medium">
                                {isPartnerData ? "Partner's" : ""} Fertility
                                Window
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {fertileStart
                                    ? fertileStart.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "—"}{" "}
                                -{" "}
                                {fertileEnd
                                    ? fertileEnd.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 lg:mt-4 inset-shadow-sm rounded-lg px-4 py-4 bg-card">
                        <Moon className="w-4 h-4 text-yellow-500" />
                        <div>
                            <p className="text-sm font-medium">
                                {isPartnerData ? "Partner's" : ""} Cycle Length
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {cycleLength} days average
                            </p>
                        </div>
                    </div>
                </div>
            </Card.CardContent>
        </Card.Card>
    );
}
