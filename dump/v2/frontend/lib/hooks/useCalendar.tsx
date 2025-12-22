import { useState } from "react";

// main hook for managing calendar state and navigation - used by calendar page and CalendarHeader
export function useCalendar() {
    // currently displayed month/year in the calendar view - passed to CalendarGrid and CalendarHeader
    const [currentDate, setCurrentDate] = useState(new Date());
    // currently selected date (for highlighting) - used by CalendarGrid for day selection
    const [selectedDate, setSelectedDate] = useState(new Date());

    // calculate the number of days in a given month - used internally by generateMonthData
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // get the day of week (0-6) for the first day of a given month - used internally by generateMonthData
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    // generate the calendar grid data for the current month - returned to calendar page for CalendarGrid
    // returns array with null for empty cells and day numbers for actual days
    const generateMonthData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);

        const days = [];
        // add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    // navigate to the next month - called by CalendarHeader next button
    const goToNextMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    // navigate to the previous month - called by CalendarHeader previous button
    const goToPrevMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    // navigate to today's date and select it - called by CalendarHeader today button
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // check if a given day is today - used by CalendarGrid for today highlighting
    const isToday = (day: number | null) => {
        if (!day) return false;
        const today = new Date();
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        );
    };

    // check if a given day is currently selected - used by CalendarGrid for selection highlighting
    const isSelected = (day: number | null) => {
        if (!day) return false;
        return (
            day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear()
        );
    };

    // select a specific day - called by CalendarGrid when user clicks on a day
    const selectDate = (day: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(day);
        setSelectedDate(newDate);
    };

    return {
        currentDate, // currently displayed month/year - passed to CalendarGrid and CalendarHeader
        selectedDate, // currently selected date - used by CalendarGrid for selection state
        monthData: generateMonthData(), // calendar grid data - passed to CalendarGrid
        goToNextMonth, // navigate to next month - passed to CalendarHeader
        goToPrevMonth, // navigate to previous month - passed to CalendarHeader
        goToToday, // navigate to today - passed to CalendarHeader
        isToday, // check if day is today - passed to CalendarGrid
        isSelected, // check if day is selected - passed to CalendarGrid
        selectDate, // select a specific day - passed to CalendarGrid
    };
}
