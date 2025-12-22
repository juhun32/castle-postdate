"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { redirect } from "next/navigation";

// components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Plus, Settings, Users } from "lucide-react";
import {
    CycleStatusCard,
    TodaysSummary,
    SelectedDateDetails,
    DayButtonRow,
    LogForm,
    ButtonRowCalendar,
    CycleSettingsForm,
} from "@/components/tracker";
import { toast } from "sonner";

// hooks
import { usePeriods } from "@/lib/hooks/usePeriod";

// api
import { getUserMetadata } from "@/lib/api/profile";
import { getPartnerPeriodDays } from "@/lib/api/periods";
import { Education } from "@/components/Education";

const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// parse date key back to Date
const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
};

export default function Tracker() {
    const { authState } = useAuth();
    const {
        periodDaysSet,
        allLogDataSet,
        cycleSettings,
        togglePeriodDay,
        updatePeriodDay,
        getLogForDate,
        updateSettings,
    } = usePeriods();

    if (!authState.isAuthenticated && typeof window !== "undefined") {
        redirect("/");
    }

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedTab, setSelectedTab] = useState("overview");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [userSex, setUserSex] = useState<"male" | "female" | null>(null);
    const [hasPartner, setHasPartner] = useState(false);
    const [partnerPeriodDays, setPartnerPeriodDays] = useState<Set<string>>(
        new Set()
    );
    useState<Date | null>(null);
    const [partnerCycleData, setPartnerCycleData] = useState<{
        mostRecentPeriodStart: Date | null;
        cycleLength: number;
        nextPeriod: Date | null;
        daysUntilNextPeriod: number | null;
        currentCycleDay: number | null;
        fertileStart: Date | null;
        fertileEnd: Date | null;
        daysUntilOvulation: number | null;
    } | null>(null);

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const userMeta = await getUserMetadata();
                if (!userMeta) {
                    toast.error("Failed to load user metadata");
                    return;
                }
                setUserSex(userMeta.sex as "male" | "female");

                try {
                    setHasPartner(true);
                } catch (error) {
                    setHasPartner(false);
                }
            } catch (error) {
                console.error("Failed to load metadata:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to load user settings";
                toast(errorMessage, {
                    description:
                        "Please try refreshing the page or contact support if the issue persists.",
                });
            }
        };

        loadMetadata();
    }, []);

    // calc partner cycle data based on period days
    const calculatePartnerCycleData = (periodDays: Set<string>) => {
        if (periodDays.size === 0) {
            setPartnerCycleData(null);
            return;
        }

        const sortedDates = Array.from(periodDays)
            .map(parseDateKey)
            .sort((a, b) => a.getTime() - b.getTime());

        // date groups of potential periods: within 3 days of each other
        const potentialPeriods: Date[][] = [];
        let currentPeriod: Date[] = [];

        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            if (currentPeriod.length === 0) {
                currentPeriod.push(currentDate);
            } else {
                const lastDate = currentPeriod[currentPeriod.length - 1];
                const daysDiff = Math.ceil(
                    (currentDate.getTime() - lastDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                );

                if (daysDiff <= 3) {
                    currentPeriod.push(currentDate);
                } else {
                    if (currentPeriod.length > 0) {
                        potentialPeriods.push([...currentPeriod]);
                    }
                    currentPeriod = [currentDate];
                }
            }
        }
        if (currentPeriod.length > 0) {
            potentialPeriods.push(currentPeriod);
        }

        // extracting start dates from each period
        const periodStartDates = potentialPeriods.map((period) => period[0]);

        // calc average cycle length default 28
        let avgCycleLength = 28;
        if (periodStartDates.length > 1) {
            let totalCycleDays = 0;
            for (let i = 1; i < periodStartDates.length; i++) {
                const diff = Math.ceil(
                    (periodStartDates[i].getTime() -
                        periodStartDates[i - 1].getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                totalCycleDays += diff;
            }
            avgCycleLength = Math.round(
                totalCycleDays / (periodStartDates.length - 1)
            );
        }

        let periodStart: Date | null = null;
        if (potentialPeriods.length > 0) {
            const mostRecentPeriod =
                potentialPeriods[potentialPeriods.length - 1];
            periodStart = mostRecentPeriod[0];
        }

        // calc next period date
        const nextPeriod = periodStart
            ? (() => {
                  const next = new Date(periodStart);
                  next.setDate(periodStart.getDate() + avgCycleLength);
                  return next;
              })()
            : null;

        // calc days until next period
        const today = new Date();
        const daysUntilNextPeriod = nextPeriod
            ? Math.ceil(
                  (nextPeriod.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
              )
            : null;

        // calc current cycle day
        const currentCycleDay = periodStart
            ? (() => {
                  const daysSinceLastPeriod = Math.ceil(
                      (today.getTime() - periodStart.getTime()) /
                          (1000 * 60 * 60 * 24)
                  );
                  const cycleDay = daysSinceLastPeriod % avgCycleLength;
                  return cycleDay === 0 ? avgCycleLength : cycleDay;
              })()
            : null;

        // calc fertile window
        const fertileStart = periodStart
            ? (() => {
                  const start = new Date(periodStart);
                  start.setDate(periodStart.getDate() + 11);
                  return start;
              })()
            : null;

        const fertileEnd = periodStart
            ? (() => {
                  const end = new Date(periodStart);
                  end.setDate(periodStart.getDate() + 17);
                  return end;
              })()
            : null;

        // calc until ovulation
        const daysUntilOvulation = periodStart
            ? (() => {
                  const ovulationDate = new Date(periodStart);
                  ovulationDate.setDate(periodStart.getDate() + 14);
                  const daysDiff = Math.ceil(
                      (ovulationDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                  );
                  return daysDiff;
              })()
            : null;

        setPartnerCycleData({
            mostRecentPeriodStart: periodStart,
            cycleLength: avgCycleLength,
            nextPeriod,
            daysUntilNextPeriod,
            currentCycleDay,
            fertileStart,
            fertileEnd,
            daysUntilOvulation,
        });
    };

    const loadPartnerData = async () => {
        if (!hasPartner) return;

        try {
            const response = await getPartnerPeriodDays();
            const partnerDays = new Set<string>();

            response.periodDays.forEach((day) => {
                if (day.isPeriod) {
                    partnerDays.add(day.date);
                }
            });

            setPartnerPeriodDays(partnerDays);
            calculatePartnerCycleData(partnerDays);
        } catch (error) {
            console.error("Failed to load partner period data:", error);
        }
    };

    useEffect(() => {
        loadPartnerData();
    }, [hasPartner]);

    const sexualActivityDays = useMemo(() => {
        const activityDays = new Set<string>();
        for (const day of allLogDataSet.values()) {
            if (day.sexActivity && day.sexActivity.length > 0) {
                activityDays.add(day.date);
            }
        }
        return activityDays;
    }, [allLogDataSet]);

    const periodLength = cycleSettings?.periodLength || 5;

    // calculate most recent period start/end dates and average cycle length
    const { mostRecentPeriodStart, calculatedCycleLength } = useMemo(() => {
        if (periodDaysSet.size === 0) {
            return {
                mostRecentPeriodStart: null,
                mostRecentPeriodEnd: null,
                calculatedCycleLength: cycleSettings?.cycleLength || 28,
            };
        }

        const sortedDates = Array.from(periodDaysSet)
            .map(parseDateKey)
            .sort((a, b) => a.getTime() - b.getTime());

        // date groups of potential periods: within 3 days of each other
        const potentialPeriods: Date[][] = [];
        let currentPeriod: Date[] = [];

        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            if (currentPeriod.length === 0) {
                currentPeriod.push(currentDate);
            } else {
                const lastDate = currentPeriod[currentPeriod.length - 1];
                const daysDiff = Math.ceil(
                    (currentDate.getTime() - lastDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                );

                if (daysDiff <= 3) {
                    currentPeriod.push(currentDate);
                } else {
                    if (currentPeriod.length > 0) {
                        potentialPeriods.push([...currentPeriod]);
                    }
                    currentPeriod = [currentDate];
                }
            }
        }
        if (currentPeriod.length > 0) {
            potentialPeriods.push(currentPeriod);
        }

        // extracting start dates from each period
        const periodStartDates = potentialPeriods.map((period) => period[0]);

        // average cycle length
        let avgCycleLength = cycleSettings?.cycleLength || 28;
        if (periodStartDates.length > 1) {
            let totalCycleDays = 0;
            for (let i = 1; i < periodStartDates.length; i++) {
                const diff = Math.ceil(
                    (periodStartDates[i].getTime() -
                        periodStartDates[i - 1].getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                totalCycleDays += diff;
            }
            avgCycleLength = Math.round(
                totalCycleDays / (periodStartDates.length - 1)
            );
        }

        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;
        if (potentialPeriods.length > 0) {
            const mostRecentPeriod =
                potentialPeriods[potentialPeriods.length - 1];
            periodStart = mostRecentPeriod[0];
            periodEnd = mostRecentPeriod[mostRecentPeriod.length - 1];
        }

        return {
            mostRecentPeriodStart: periodStart,
            mostRecentPeriodEnd: periodEnd,
            calculatedCycleLength: avgCycleLength,
        };
    }, [periodDaysSet, cycleSettings?.cycleLength]);

    const cycleLength = calculatedCycleLength;

    // check if user has any period data
    const hasPeriodData = mostRecentPeriodStart !== null;

    // calculate next period date only if we have period data
    const nextPeriod =
        hasPeriodData && mostRecentPeriodStart
            ? (() => {
                  const next = new Date(mostRecentPeriodStart);
                  next.setDate(mostRecentPeriodStart.getDate() + cycleLength);
                  return next;
              })()
            : null;

    // calculate days until next period only if we have period data
    const today = new Date();
    const daysUntilNextPeriod =
        hasPeriodData && nextPeriod
            ? Math.ceil(
                  (nextPeriod.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
              )
            : null;

    // calculate current cycle day only if we have period data
    const currentCycleDay =
        hasPeriodData && mostRecentPeriodStart
            ? (() => {
                  const daysSinceLastPeriod = Math.ceil(
                      (today.getTime() - mostRecentPeriodStart.getTime()) /
                          (1000 * 60 * 60 * 24)
                  );
                  const cycleDay = daysSinceLastPeriod % cycleLength;
                  return cycleDay === 0 ? cycleLength : cycleDay;
              })()
            : null;

    // calculate fertility window only if we have period data
    const fertileStart =
        hasPeriodData && mostRecentPeriodStart
            ? (() => {
                  const start = new Date(mostRecentPeriodStart);
                  start.setDate(mostRecentPeriodStart.getDate() + 11);
                  return start;
              })()
            : null;

    const fertileEnd =
        hasPeriodData && mostRecentPeriodStart
            ? (() => {
                  const end = new Date(mostRecentPeriodStart);
                  end.setDate(mostRecentPeriodStart.getDate() + 17);
                  return end;
              })()
            : null;

    // Calculate days until ovulation (typically day 14 of cycle)
    const daysUntilOvulation =
        hasPeriodData && mostRecentPeriodStart
            ? (() => {
                  const ovulationDate = new Date(mostRecentPeriodStart);
                  ovulationDate.setDate(mostRecentPeriodStart.getDate() + 14);
                  const daysDiff = Math.ceil(
                      (ovulationDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                  );
                  return daysDiff;
              })()
            : null;

    // generate predicted period days only if we have period data
    const generatePredictedPeriodDays = () => {
        if (!hasPeriodData || !mostRecentPeriodStart) return new Set<string>();

        const predicted = new Set<string>();

        // add the expected period days for the current period
        if (mostRecentPeriodStart) {
            // check if the current period is complete by counting period days
            let confirmedDays = 0;
            for (let day = 0; day < periodLength; day++) {
                const periodDay = new Date(mostRecentPeriodStart);
                periodDay.setDate(mostRecentPeriodStart.getDate() + day);
                const periodDayKey = formatDateKey(periodDay);

                if (periodDaysSet.has(periodDayKey)) {
                    confirmedDays++;
                }
            }

            // only show predicted days if the period is not complete
            // which is when period days are less than the period length
            if (confirmedDays < periodLength) {
                for (let day = 0; day < periodLength; day++) {
                    const periodDay = new Date(mostRecentPeriodStart);
                    periodDay.setDate(mostRecentPeriodStart.getDate() + day);
                    const periodDayKey = formatDateKey(periodDay);

                    if (!periodDaysSet.has(periodDayKey)) {
                        predicted.add(periodDayKey);
                    }
                }
            }
        }

        // start from the most recent period start and predict future periods
        let currentPeriodStart = new Date(mostRecentPeriodStart);

        // add cycle length to get to the next period start which is
        currentPeriodStart.setDate(
            mostRecentPeriodStart.getDate() + cycleLength
        );

        // Generate 3 future periods
        for (let i = 0; i < 3; i++) {
            // For each period, add periodLength days starting from the period start
            for (let day = 0; day < periodLength; day++) {
                const periodDay = new Date(currentPeriodStart);
                periodDay.setDate(currentPeriodStart.getDate() + day);
                predicted.add(formatDateKey(periodDay));
            }
            // Move to the next period start
            currentPeriodStart.setDate(
                currentPeriodStart.getDate() + cycleLength
            );
        }
        return predicted;
    };

    // Generate fertility window days (only if we have period data)
    const generateFertilityWindowDays = () => {
        if (!hasPeriodData || !mostRecentPeriodStart) return new Set<string>();

        const fertilityDays = new Set<string>();

        // Generate fertility window for current cycle
        if (mostRecentPeriodStart) {
            for (let day = 11; day <= 17; day++) {
                const fertilityDay = new Date(mostRecentPeriodStart);
                fertilityDay.setDate(mostRecentPeriodStart.getDate() + day);
                fertilityDays.add(formatDateKey(fertilityDay));
            }
        }

        // Generate fertility windows for future cycles
        let currentPeriodStart = new Date(mostRecentPeriodStart);

        // Add cycle length to get to the next period start
        currentPeriodStart.setDate(
            mostRecentPeriodStart.getDate() + cycleLength
        );

        // Generate 3 future fertility windows
        for (let i = 0; i < 3; i++) {
            for (let day = 11; day <= 17; day++) {
                const fertilityDay = new Date(currentPeriodStart);
                fertilityDay.setDate(currentPeriodStart.getDate() + day);
                fertilityDays.add(formatDateKey(fertilityDay));
            }
            // Move to the next period start
            currentPeriodStart.setDate(
                currentPeriodStart.getDate() + cycleLength
            );
        }
        return fertilityDays;
    };

    const predictedPeriodDays = generatePredictedPeriodDays();
    const fertilityWindowDays = generateFertilityWindowDays();

    // Handle period day toggle using backend API
    const handlePeriodToggle = async (date: Date) => {
        const dateKey = formatDateKey(date);
        try {
            await togglePeriodDay(dateKey);
        } catch (error) {
            console.error("Tracker: Period day toggle failed:", error);
        }
    };

    // Wrapper functions for LogForm
    const handleSaveLog = async (log: {
        date: string;
        symptoms: string[];
        crampIntensity: number;
        mood: string[];
        activities: string[];
        sexActivity: string[];
        notes: string;
    }) => {
        await updatePeriodDay(log.date, {
            symptoms: log.symptoms,
            crampIntensity: log.crampIntensity,
            mood: log.mood,
            activities: log.activities,
            sexActivity: log.sexActivity,
            notes: log.notes,
        });
    };

    const handleUpdateLog = async (log: {
        date: string;
        symptoms: string[];
        crampIntensity: number;
        mood: string[];
        activities: string[];
        sexActivity: string[];
        notes: string;
    }) => {
        await updatePeriodDay(log.date, {
            symptoms: log.symptoms,
            crampIntensity: log.crampIntensity,
            mood: log.mood,
            activities: log.activities,
            sexActivity: log.sexActivity,
            notes: log.notes,
        });
    };

    const handleSaveSettings = async (settings: {
        cycleLength: number;
        periodLength: number;
    }) => {
        setIsSavingSettings(true);
        try {
            await updateSettings(settings);
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <div className="pt-16 md:pt-20 pb-12 md:pb-16 flex flex-col gap-8">
            <div className="container mx-auto flex flex-col px-4 md:px-8">
                <Tabs
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                    className="flex flex-col flex-1"
                >
                    {userSex !== "male" && (
                        <TabsList className="w-full">
                            <TabsTrigger
                                value="overview"
                                className="flex items-center gap-2"
                            >
                                <Activity className="w-4 h-4" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="log"
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Log
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </TabsTrigger>
                        </TabsList>
                    )}

                    {/* <TabsTrigger
                            value="insights"
                            className="flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Insights
                        </TabsTrigger> */}

                    <TabsContent
                        value="overview"
                        className="flex-1 flex flex-col gap-4"
                    >
                        {userSex !== "male" && (
                            <DayButtonRow
                                currentDate={date || new Date()}
                                onDateSelect={setDate}
                                periodDays={periodDaysSet}
                                onPeriodToggle={handlePeriodToggle}
                                predictedPeriodDays={predictedPeriodDays}
                                fertilityWindowDays={fertilityWindowDays}
                                sexualActivityDays={sexualActivityDays}
                            />
                        )}

                        {userSex !== "female" ? (
                            <div className="grid md:grid-cols-[1fr_1fr] gap-4 flex-1">
                                <TodaysSummary
                                    todaysData={getLogForDate(
                                        formatDateKey(new Date())
                                    )}
                                    daysUntilNextPeriod={
                                        hasPartner
                                            ? partnerCycleData?.daysUntilNextPeriod ??
                                              undefined
                                            : daysUntilNextPeriod
                                    }
                                    daysUntilOvulation={
                                        hasPartner
                                            ? partnerCycleData?.daysUntilOvulation ??
                                              undefined
                                            : daysUntilOvulation
                                    }
                                    currentCycleDay={
                                        hasPartner
                                            ? partnerCycleData?.currentCycleDay ??
                                              undefined
                                            : currentCycleDay
                                    }
                                    cycleLength={
                                        hasPartner
                                            ? partnerCycleData?.cycleLength ??
                                              cycleLength
                                            : cycleLength
                                    }
                                    hasPeriodData={
                                        hasPartner
                                            ? partnerPeriodDays.size > 0
                                            : hasPeriodData
                                    }
                                    periodDaysSet={
                                        hasPartner
                                            ? partnerPeriodDays
                                            : periodDaysSet
                                    }
                                    mostRecentPeriodStart={
                                        hasPartner
                                            ? partnerCycleData?.mostRecentPeriodStart ??
                                              undefined
                                            : mostRecentPeriodStart
                                    }
                                    isPartnerData={hasPartner}
                                />

                                <CycleStatusCard
                                    currentCycleDay={
                                        hasPartner
                                            ? partnerCycleData?.currentCycleDay ??
                                              undefined
                                            : currentCycleDay
                                    }
                                    cycleLength={
                                        hasPartner
                                            ? partnerCycleData?.cycleLength ??
                                              cycleLength
                                            : cycleLength
                                    }
                                    daysUntilNextPeriod={
                                        hasPartner
                                            ? partnerCycleData?.daysUntilNextPeriod ??
                                              undefined
                                            : daysUntilNextPeriod
                                    }
                                    nextPeriod={
                                        hasPartner
                                            ? partnerCycleData?.nextPeriod ??
                                              undefined
                                            : nextPeriod
                                    }
                                    hasPeriodData={
                                        hasPartner
                                            ? partnerPeriodDays.size > 0
                                            : hasPeriodData
                                    }
                                    fertileStart={
                                        hasPartner
                                            ? partnerCycleData?.fertileStart ??
                                              undefined
                                            : fertileStart
                                    }
                                    fertileEnd={
                                        hasPartner
                                            ? partnerCycleData?.fertileEnd ??
                                              undefined
                                            : fertileEnd
                                    }
                                    isPartnerData={hasPartner}
                                />
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-[4fr_2fr_2fr] gap-4 flex-1">
                                <TodaysSummary
                                    todaysData={getLogForDate(
                                        formatDateKey(new Date())
                                    )}
                                    daysUntilNextPeriod={daysUntilNextPeriod}
                                    daysUntilOvulation={daysUntilOvulation}
                                    currentCycleDay={currentCycleDay}
                                    cycleLength={cycleLength}
                                    hasPeriodData={hasPeriodData}
                                    periodDaysSet={periodDaysSet}
                                    mostRecentPeriodStart={
                                        mostRecentPeriodStart
                                    }
                                />

                                <CycleStatusCard
                                    currentCycleDay={currentCycleDay}
                                    cycleLength={cycleLength}
                                    daysUntilNextPeriod={daysUntilNextPeriod}
                                    nextPeriod={nextPeriod}
                                    hasPeriodData={hasPeriodData}
                                    fertileStart={fertileStart}
                                    fertileEnd={fertileEnd}
                                />

                                {date && (
                                    <SelectedDateDetails
                                        date={date}
                                        periodData={getLogForDate(
                                            formatDateKey(date)
                                        )}
                                        onLogClick={() => setSelectedTab("log")}
                                    />
                                )}
                            </div>
                        )}

                        {userSex !== "female" && (
                            <div className="bg-muted/50 border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    <h3 className="font-medium text-sm">
                                        Limited Access
                                    </h3>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <p>
                                        You can view your partner's cycle
                                        information but cannot edit period data.
                                    </p>
                                    <p className="mt-1">
                                        Only your partner can track and manage
                                        their period information.
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {userSex !== "male" && (
                        <>
                            <TabsContent
                                value="log"
                                className="flex-1 flex flex-col"
                            >
                                <div className="grid md:grid-cols-[auto_1fr] gap-4 flex-1">
                                    <ButtonRowCalendar
                                        currentDate={date || new Date()}
                                        onDateSelect={setDate}
                                        periodDays={periodDaysSet}
                                        onPeriodToggle={handlePeriodToggle}
                                        predictedPeriodDays={
                                            predictedPeriodDays
                                        }
                                        fertilityWindowDays={
                                            fertilityWindowDays
                                        }
                                        sexualActivityDays={sexualActivityDays}
                                    />

                                    <LogForm
                                        date={date || new Date()}
                                        existingLog={
                                            date
                                                ? getLogForDate(
                                                      formatDateKey(date)
                                                  )
                                                : null
                                        }
                                        onSave={handleSaveLog}
                                        onUpdate={handleUpdateLog}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="settings"
                                className="flex-1 flex flex-col"
                            >
                                <div className="flex-1 flex justify-center items-start">
                                    <CycleSettingsForm
                                        cycleLength={cycleLength}
                                        periodLength={periodLength}
                                        onSave={handleSaveSettings}
                                        isLoading={isSavingSettings}
                                    />
                                </div>
                            </TabsContent>
                        </>
                    )}

                    {/* <TabsContent value="insights" className="space-y-4">
                        <InsightsCard />
                    </TabsContent> */}
                </Tabs>
            </div>
        </div>
    );
}
