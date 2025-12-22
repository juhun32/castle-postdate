// represents a calendar event with all its properties; used by useDDays hook and all calendar components
export type DDay = {
    id: string;
    title: string;
    group: string;
    date?: Date;
    endDate?: Date;
    description: string;
    days: string; // day count ex)"Today", "D+3" by useDDays hook
    isAnnual: boolean;
    createdBy: string; // user id
    connectedUsers?: string[];
    imageUrl?: string;
    editable?: boolean; // if the event can be edited by the user
};

// defines the visual position of an event in a multiday layout (DDayIndicator, calendar grid)
export type EventPosition = "start" | "middle" | "end" | "single";

// props for the main calendar grid component passed from calendar page to CalendarGrid
export interface CalendarGridProps {
    currentDate: Date; // currently displayed month/year
    monthData: (number | null)[]; // array of day numbers (null for empty cells) from useCalendar hook
    isSelected: (day: number | null) => boolean; // check if a day is selected
    isToday: (day: number | null) => boolean; // check if a day is today
    selectDate: (day: number) => void; // select a date
    getDDaysForDay: (day: number | null, currentDate: Date) => (DDay | null)[]; // get events for a specific day
    createDDay: (dday: Omit<DDay, "id" | "days">) => Promise<boolean>; // create new event
    updateDDay: (
        id: string,
        updates: Partial<Omit<DDay, "id" | "days">>
    ) => Promise<boolean>; // update existing event
    deleteDDay: (id: string) => Promise<boolean>; // delete an event
    activeDDay: DDay | null; // currently dragged event for dnd from calendar page drag state
    uploadDDayImage?: (file: File) => Promise<string | null>; // image upload function
}

// props for the add event dialog component (CalendarGrid)
export interface AddDDayDialogProps {
    isOpen?: boolean; // is dialog open?
    onOpenChange?: (open: boolean) => void; // callback when dialog open state changes passed down to CalendarGrid
    initialDate?: Date | null; // preselected date for the new event when adding new evet
    createDDay: (dday: Omit<DDay, "id" | "days">) => Promise<boolean>; // create event
    uploadDDayImage?: (file: File) => Promise<string | null>; // upload event image
}

// props for individual event indicator components (CalendarGrid, DDaySheet, ShowAllEvents)
export interface DDayIndicatorProps {
    dday: DDay; // the event to display
    updateDDay: (
        id: string,
        updates: Partial<Omit<DDay, "id" | "days">>
    ) => Promise<boolean>;
    deleteDDay: (id: string) => Promise<boolean>;
    onDraggingChange?: (isDragging: boolean) => void; // callback for drag state changes; used by DDaySheet
    context?: "sheet" | "grid"; // where the indicator is being used (affects styling and behavior)
    length?: "short" | "long"; // display length for title truncation (ShowAllEvents for table display)
    position?: EventPosition; // visual position in multiday layout
    dayIndex?: number; // index of the day in the grid (CalendarGrid for week highlighting)
    droppableId?: string; // id for dnd functionality
    currentDate?: Date; // current date for context (CalendarGrid for date calculations)
    uploadDDayImage?: (file: File) => Promise<string | null>; // image upload function
}

// props for the calendar header component; passed from calendar page to CalendarHeader
export interface CalendarHeaderProps {
    currentDate: Date; // currently displayed month/year
    goToNextMonth: () => void;
    goToPrevMonth: () => void;
    goToToday: () => void; // navigate to current month
}

// props for the edit event dialog component; used by DDayIndicator for editing events
export interface EditDdayDialogProps {
    dday: DDay;
    isOpen: boolean; // is dialog open?
    onOpenChange: (open: boolean) => void; // callback when dialog state changes
    updateDDay: (
        id: string,
        updates: Partial<Omit<DDay, "days" | "id">>
    ) => Promise<boolean>;
    deleteDDay: (id: string) => Promise<boolean>;
    uploadDDayImage?: (file: File) => Promise<string | null>;
}

// data structure for event form inputs; used by DDayForm and shared between AddDdayDialog and EditDdayDialog
export interface DDayFormData {
    title: string;
    group: string; // event category/group for color and filtering
    description: string;
    date?: Date; // start date
    endDate?: Date; // end date for mult;day events
    isAnnual: boolean;
    connectedUsers: string[];
    imageUrl?: string;
}

// props for the shared event form component; used by AddDdayDialog and EditDdayDialog
export interface DDayFormProps {
    initialData?: Partial<DDay>; // prepopulated form data from existing event or user input
    onSubmit: (data: DDayFormData) => Promise<boolean>;
    uploadImage?: (file: File) => Promise<string | null>;
    onCancel?: () => void;
    onDelete?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    deleteLabel?: string;
    isSubmitting?: boolean;
    isDeleting?: boolean;
}

// props for the show all events dialog component; used by CalendarGrid only when there are 4+ events on a day
export interface ShowAllEventsProps {
    ddays: DDay[]; // array of events to display
    updateDDay: (
        id: string,
        updates: Partial<Omit<DDay, "id" | "days">>
    ) => Promise<boolean>;
    deleteDDay: (id: string) => Promise<boolean>;
    uploadDDayImage?: (file: File) => Promise<string | null>;
}

export type DDaySheetProps = {
    ddays: DDay[]; // array of events to display from useDDays hook
    updateDDay: (
        id: string,
        updates: Partial<Omit<any, "id" | "days">>
    ) => Promise<boolean>;
    deleteDDay: (id: string) => Promise<boolean>;
};
