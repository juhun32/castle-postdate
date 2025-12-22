import { useEffect, useState } from "react";
import { EventPosition, type DDay } from "@/lib/types/calendar";
import { toast } from "sonner";
import { calculateDDay } from "@/lib/utils";

// main hook for managing calendar events
export function useDDays(currentDate: Date = new Date()) {
    // array of all D-day events for the current month
    // passed to CalendarGrid, DDaySheet, and other components
    const [ddays, setDdays] = useState<DDay[]>([]);

    // loading state for API calls used by calendar page for loading indicators
    const [loading, setLoading] = useState(true);

    // error state for failed operations used by calendar page for error handling
    const [error, setError] = useState<string | null>(null);
    // map of event IDs to their row positions for multi-day layout used by CalendarGrid for visual
    const [eventLayout, setEventLayout] = useState<Map<string, number>>(
        new Map()
    );

    // parse date string from API format (YYYYMMDD) to Date object
    const parseDateString = (dateStr: string): Date => {
        if (dateStr.match(/^\d{8}$/)) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            return new Date(year, month, day);
        }
        return new Date(dateStr);
    };

    // format Date object to API format (YYYYMMDD); used when sending data to go
    const formatDateForAPI = (date: Date | undefined): string => {
        if (!date) return "";
        return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
            2,
            "0"
        )}${String(date.getDate()).padStart(2, "0")}`;
    };

    // calculate layout positions for multiday events to ensure visual continuity
    const calculateEventLayout = (events: DDay[]): Map<string, number> => {
        const layout = new Map<string, number>();
        const daySlots = new Map<string, boolean[]>(); // date string -> occupied rows

        // sort events by start date, then by duration
        // longer events first
        const sortedEvents = [...events].sort((a, b) => {
            if (!a.date || !b.date) return 0;
            const aStart = a.date.getTime();
            const bStart = b.date.getTime();
            if (aStart !== bStart) return aStart - bStart;

            const aEnd = a.endDate?.getTime() || aStart;
            const bEnd = b.endDate?.getTime() || bStart;

            // longer events first
            return bEnd - aEnd;
        });

        sortedEvents.forEach((event) => {
            if (!event.date) return;

            let row = 0;
            while (true) {
                let isRowAvailable = true;
                const eventEndDate = event.endDate || event.date;

                // check if this row is available for all days of the event
                for (
                    let d = new Date(event.date);
                    d <= eventEndDate;
                    d.setDate(d.getDate() + 1)
                ) {
                    const dateString = d.toISOString().split("T")[0];
                    if (daySlots.get(dateString)?.[row]) {
                        isRowAvailable = false;
                        break;
                    }
                }

                if (isRowAvailable) {
                    layout.set(event.id, row);

                    // mark this row as occupied for all days of the event
                    for (
                        let d = new Date(event.date);
                        d <= eventEndDate;
                        d.setDate(d.getDate() + 1)
                    ) {
                        const dateString = d.toISOString().split("T")[0];
                        if (!daySlots.has(dateString)) {
                            daySlots.set(dateString, []);
                        }
                        daySlots.get(dateString)![row] = true;
                    }
                    break;
                }
                row++;
            }
        });
        return layout;
    };

    // fetch dday events from the API for the current month
    // called when month changes or after CRUD operations
    const fetchDDays = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, "0");
            const view = `${year}${month}`;

            const base =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const response = await fetch(`${base}/api/ddays?view=${view}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch D-days: ${response.status}`);
            }

            const data = await response.json();

            const formattedDdays = data.ddays.map((dday: any) => ({
                id: dday.id,
                title: dday.title,
                group: dday.group || "others",
                description: dday.description || "",
                imageUrl: dday.imageUrl || "",
                date: dday.date ? parseDateString(dday.date) : undefined,
                endDate: dday.endDate
                    ? parseDateString(dday.endDate)
                    : undefined,
                days: dday.date
                    ? calculateDDay(parseDateString(dday.date))
                    : "Unscheduled",
                isAnnual: dday.isAnnual,
                createdBy: dday.createdBy,
                connectedUsers: dday.connectedUsers || [],
                editable: dday.editable,
            }));

            setDdays(formattedDdays);
            setEventLayout(calculateEventLayout(formattedDdays));
            setError(null);
        } catch (err) {
            console.error("Failed to fetch D-days:", err);
            setError("Failed to load calendar events");
        } finally {
            setLoading(false);
        }
    };

    // fetch events when month changes
    useEffect(() => {
        fetchDDays();
    }, [currentDate.getFullYear(), currentDate.getMonth()]);

    // get all events for a specific day
    // used by CalendarGrid to display events in day cells
    // this is responsible for multi day events showing indicators.
    // this is also responsible for annual events showing in the correct month
    const getDDaysForDay = (day: number | null, currentDate: Date) => {
        if (!day) return [];

        return ddays.filter((dday) => {
            if (!dday.date) return false;

            const eventStart = dday.date;
            const eventEnd = dday.endDate || dday.date;
            const cellDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
            );

            if (dday.isAnnual) {
                return (
                    cellDate.getMonth() === eventStart.getMonth() &&
                    cellDate.getDate() >= eventStart.getDate() &&
                    cellDate.getDate() <= eventEnd.getDate()
                );
            } else {
                return cellDate >= eventStart && cellDate <= eventEnd;
            }
        });
    };

    // get events for a day with layout positions
    // used by CalendarGrid for visual
    const getRenderableDDaysForDay = (
        day: number | null,
        currentDate: Date
    ): (DDay | null)[] => {
        const eventsForDay = getDDaysForDay(day, currentDate);
        const renderableEvents: (DDay | null)[] = [];

        eventsForDay.forEach((event) => {
            const row = eventLayout.get(event.id);
            if (row !== undefined) {
                // make sure array is long enough
                while (renderableEvents.length <= row) {
                    renderableEvents.push(null);
                }
                renderableEvents[row] = event;
            }
        });

        return renderableEvents;
    };

    // create a new dday event
    // called by AddDdayDialog and DDayForm
    const createDDay = async (
        dday: Omit<DDay, "days" | "id">
    ): Promise<boolean> => {
        try {
            const payload = {
                title: dday.title,
                group: dday.group,
                description: dday.description,
                imageUrl: dday.imageUrl,
                isAnnual: dday.isAnnual,
                connectedUsers: dday.connectedUsers || [],
                createdBy: dday.createdBy,
                date: formatDateForAPI(dday.date),
                endDate: formatDateForAPI(dday.endDate),
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ddays`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create D-day: ${response.status}`);
            }

            await fetchDDays();
            return true;
        } catch (error) {
            console.error("Failed to create D-day:", error);
            return false;
        }
    };

    // update an existing dday event
    // called by EditDdayDialog and DDayForm
    const updateDDay = async (
        id: string,
        updates: Partial<Omit<DDay, "days" | "id">>
    ): Promise<boolean> => {
        try {
            const payload: { [key: string]: any } = { ...updates };

            if (updates.date !== undefined) {
                payload.date = formatDateForAPI(updates.date);
            }
            if (updates.endDate !== undefined) {
                payload.endDate = formatDateForAPI(updates.endDate);
            }
            if (updates.imageUrl !== undefined) {
                payload.imageUrl = updates.imageUrl;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ddays/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update D-day: ${response.status}`);
            }

            await fetchDDays();
            return true;
        } catch (error) {
            console.error("Failed to update D-day:", error);
            return false;
        }
    };

    // upload an image file and return the public URL
    const uploadDDayImage = async (file: File): Promise<string | null> => {
        try {
            // get presigned URL from go
            // send the file size so go can enforce size limits (5MB max)
            const presignedUrlResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ddays/upload-url`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ fileSize: file.size }),
                }
            );

            if (!presignedUrlResponse.ok) {
                const errorData = await presignedUrlResponse.json();
                toast.error(
                    `Failed to get upload URL: ${
                        errorData.message || "Unknown error"
                    }`
                );
                return null;
            }

            const { uploadUrl, publicUrl } = await presignedUrlResponse.json();

            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadResponse.ok) {
                console.error("Failed to upload file to R2");
                return null;
            }
            // return public URL of uploaded image
            return publicUrl;
        } catch (error) {
            console.error("Error in uploadDDayImage:", error);
            return null;
        }
    };

    // delete a dday event
    // called by EditDdayDialog and DDayIndicator
    const deleteDDay = async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ddays/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete D-day: ${response.status}`);
            }

            setDdays((prev) => prev.filter((dday) => dday.id !== id));
            return true;
        } catch (error) {
            console.error("Failed to delete D-day:", error);
            return false;
        }
    };

    return {
        ddays, // array of all dday events; passed to CalendarGrid, DDaySheet, etc.
        loading, // loading state; used by calendar page for loading indicators
        error, // error state; used by calendar page for error handling
        getDDaysForDay, // get events for a specific day; passed to CalendarGrid
        getRenderableDDaysForDay, // get events with layout positions; passed to CalendarGrid
        createDDay, // create new event; passed to AddDdayDialog and DDayForm
        updateDDay, // update existing event; passed to EditDdayDialog and DDayForm
        uploadDDayImage, // upload image for an event; passed to DDayForm
        deleteDDay, // delete event; passed to EditDdayDialog and DDayIndicator
        refreshDDays: fetchDDays, // refresh events from API; used for manual refresh
    };
}

// determine the visual position of an event in a multiday layout
// used by CalendarGrid and DDayIndicator
export function getEventPosition(event: DDay, date: Date): EventPosition {
    if (!event.date) return "single";

    const eventStart = new Date(event.date);
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
    const current = new Date(date);

    // normalize all dates to start of day
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    if (current < eventStart || current > eventEnd) return "single";

    if (eventStart.getTime() === eventEnd.getTime()) return "single";
    if (current.getTime() === eventStart.getTime()) return "start";
    if (current.getTime() === eventEnd.getTime()) return "end";
    return "middle";
}
