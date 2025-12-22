"use client";

import { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

// components
import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import * as Tooltip from "@/components/ui/tooltip";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CircleSmall,
    Info,
} from "lucide-react";

// utils
import { cn } from "@/lib/utils";

// types
import { DayButtonRowProps } from "@/lib/types/periods";

export const DayButtonRow = memo(function DayButtonRow({
    currentDate,
    onDateSelect,
    periodDays,
    onPeriodToggle,
    predictedPeriodDays,
    fertilityWindowDays,
    sexualActivityDays,
}: DayButtonRowProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(0);

    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isFutureDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate > today;
    };

    const isSelected = (date: Date) => {
        return formatDateKey(date) === formatDateKey(currentDate);
    };

    const isPeriodDay = (date: Date) => {
        return periodDays.has(formatDateKey(date));
    };

    const isPredictedPeriodDay = (date: Date) => {
        return predictedPeriodDays.has(formatDateKey(date));
    };

    const isFertilityWindowDay = (date: Date) => {
        return fertilityWindowDays.has(formatDateKey(date));
    };

    const isSexualActivityDay = (date: Date) => {
        return sexualActivityDays.has(formatDateKey(date));
    };

    const handlePeriodToggle = (date: Date) => {
        if (isFutureDate(date)) return;
        onPeriodToggle(date);
    };

    // Get the number of days to show based on screen size
    const getDaysPerPage = () => {
        if (typeof window !== "undefined") {
            return window.innerWidth < 768 ? 7 : 11; // 7 days for mobile, 11 for desktop
        }
        return 11; // Default for SSR
    };

    const [daysPerPage, setDaysPerPage] = useState(11); // Always start with 11 for SSR consistency
    const [isClient, setIsClient] = useState(false);

    // Set client flag and initial days per page after hydration
    useEffect(() => {
        setIsClient(true);
        setDaysPerPage(getDaysPerPage());
    }, []);

    // Update days per page when window resizes
    useEffect(() => {
        if (!isClient) return; // Only run on client

        const handleResize = () => {
            setDaysPerPage(getDaysPerPage());
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isClient]);

    const allDates = useMemo(() => {
        const today = new Date();
        const dates = [];
        const todayIndex = 38;
        const daysBefore = todayIndex;
        const daysAfter = 38;

        for (let i = -daysBefore; i <= daysAfter; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, []);

    useEffect(() => {
        const todayIndex = 38;
        const pageForToday = Math.floor(todayIndex / daysPerPage);
        setCurrentPage(pageForToday);
    }, [allDates, daysPerPage]);

    const getCurrentPageDates = () => {
        const startIndex = currentPage * daysPerPage;
        return allDates.slice(startIndex, startIndex + daysPerPage);
    };

    const currentPageDates = getCurrentPageDates();

    const paginate = (newDirection: number) => {
        const maxPage = Math.floor(allDates.length / daysPerPage) - 1;
        const newPageIndex = currentPage + newDirection;

        if (newPageIndex >= 0 && newPageIndex <= maxPage) {
            setDirection(newDirection);
            setCurrentPage(newPageIndex);
        }
    };

    useEffect(() => {
        if (currentPageDates.length > 0) {
            const today = new Date();
            const todayInPage = currentPageDates.find(
                (date) =>
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear()
            );
        }
    }, [currentPage, currentPageDates, onDateSelect]);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
        }),
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const handleDragEnd = (
        e: MouseEvent | TouchEvent | PointerEvent,
        { offset, velocity }: PanInfo
    ) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -swipeConfidenceThreshold) {
            paginate(1);
        } else if (swipe > swipeConfidenceThreshold) {
            paginate(-1);
        }
    };

    return (
        <Card.Card>
            <Card.CardHeader>
                <Card.CardTitle className="flex flex-col items-center">
                    <div className="flex items-center justify-between w-full">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => paginate(-1)}
                            disabled={currentPage === 0}
                            className="p-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="flex items-center justify-center text-center rounded w-40 h-7 inset-shadow-sm bg-card">
                            {(() => {
                                // Calculate middle day index based on days per page
                                const middleDayIndex = Math.floor(
                                    daysPerPage / 2
                                );
                                const middleDate =
                                    currentPageDates[middleDayIndex] ||
                                    new Date();
                                return middleDate.toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                });
                            })()}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => paginate(1)}
                            disabled={
                                currentPage >=
                                Math.floor(allDates.length / daysPerPage) - 1
                            }
                            className="p-1"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                </Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent>
                <div className="relative h-24 overflow-x-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                opacity: { duration: 0.2 },
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={handleDragEnd}
                            className="absolute top-0 left-0 w-full flex justify-center items-center gap-1"
                        >
                            {currentPageDates.map((date, index) => {
                                const isCurrentDay = isToday(date);
                                const isSelectedDay = isSelected(date);
                                const isPeriod = isPeriodDay(date);
                                const isPredicted = isPredictedPeriodDay(date);
                                const isFertility = isFertilityWindowDay(date);
                                const isSexual = isSexualActivityDay(date);
                                const isFuture = isFutureDate(date);

                                let buttonVariant:
                                    | "default"
                                    | "secondary"
                                    | "destructive"
                                    | "outline"
                                    | "ghost"
                                    | "link" = "outline";
                                let className =
                                    "w-7 sm:w-10 md:w-12 h-24 rounded-lg text-xs font-medium flex flex-col items-center justify-center p-0 has-[>svg]:px-0 bg-card";

                                if (isPeriod) {
                                    buttonVariant = "outline";
                                    className +=
                                        " bg-rose-400 text-white hover:bg-rose-500 border-rose-400 " +
                                        " dark:bg-rose-400 dark:border-rose-400 dark:hover:bg-rose-500 " +
                                        " pink:bg-pink-500 pink:border-pink-500 pink:hover:bg-pink-600 " +
                                        " pinkdark:bg-primary pinkdark:border-primary pinkdark:hover:bg-rose-600";
                                } else if (isPredicted) {
                                    buttonVariant = "ghost";
                                    className +=
                                        " border border-dashed border-rose-400 text-rose-400";
                                } else if (isFertility) {
                                    buttonVariant = "ghost";
                                    className +=
                                        " border border-dashed border-blue-400 text-blue-400";
                                } else if (isSelectedDay) {
                                    buttonVariant = "secondary";
                                    className +=
                                        " bg-secondary text-primary border border-accent";
                                } else if (isCurrentDay) {
                                    buttonVariant = "secondary";
                                }

                                return (
                                    <Button
                                        key={index}
                                        variant={buttonVariant}
                                        className={className}
                                        onClick={() => handlePeriodToggle(date)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            onDateSelect(date);
                                        }}
                                        disabled={isFuture}
                                        title={`${date.toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                            }
                                        )}${isPeriod ? " (Period Day)" : ""}${
                                            isPredicted
                                                ? " (Predicted Period)"
                                                : ""
                                        }${
                                            isFertility
                                                ? " (Fertility Window)"
                                                : ""
                                        }${
                                            isFuture
                                                ? " (Future date - cannot edit)"
                                                : ""
                                        }`}
                                    >
                                        <div className="hidden lg:flex text-xs font-normal">
                                            {date.toLocaleDateString("en-US", {
                                                weekday: "short",
                                            })}
                                        </div>
                                        <div className="flex lg:hidden text-xs font-normal">
                                            {date.toLocaleDateString("en-US", {
                                                weekday: "narrow",
                                            })}
                                        </div>
                                        <CircleSmall
                                            className={cn(
                                                "h-2 w-2",
                                                isSexual && "text-purple-500",
                                                !isSexual && "text-transparent"
                                            )}
                                        />
                                        <div className="text-sm lg:text-lg font-semibold">
                                            {date.getDate()}
                                        </div>
                                    </Button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="text-center pt-2">
                    <p className="flex lg:hidden text-xs text-muted-foreground justify-center">
                        Tap to log period - Drag to navigate
                    </p>
                    <div className="hidden lg:flex items-center justify-center gap-2">
                        <Tooltip.Tooltip>
                            <Tooltip.TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-fit w-fit has-[>svg]:px-1 has-[>svg]:py-1"
                                >
                                    <Info />
                                </Button>
                            </Tooltip.TooltipTrigger>
                            <Tooltip.TooltipContent>
                                <p>
                                    Left click to log period - Right click to
                                    view details - Drag to navigate
                                </p>
                            </Tooltip.TooltipContent>
                        </Tooltip.Tooltip>
                    </div>
                </div>
            </Card.CardContent>
        </Card.Card>
    );
});
