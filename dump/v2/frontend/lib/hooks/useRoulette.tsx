import { useState, useEffect, useCallback } from "react";

const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function useRoulette() {
    const [rouletteItems, setRouletteItems] = useState<string[]>([]);

    const fetchRoulette = useCallback(async () => {
        try {
            const response = await fetch(`${backendUrl}/api/roulette`);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch rouletteItems: ${response.status}`
                );
            }
            const data: string[] = await response.json();
            setRouletteItems(data);
        } catch (error) {
            console.error("Error fetching rouletteItems:", error);
        }
    }, []);

    useEffect(() => {
        fetchRoulette();
    }, [fetchRoulette]);

    const addRouletteItem = useCallback(async (item: string) => {
        try {
            const response = await fetch(`${backendUrl}/api/roulette`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ item }),
            });
            if (!response.ok) {
                throw new Error(
                    `Failed to add roulette item: ${response.status}`
                );
            }
            const newItem = await response.json();
            setRouletteItems((prevItems) => [...prevItems, newItem]);
        } catch (error) {
            console.error("Error adding roulette item:", error);
        }
    }, []);

    return { rouletteItems, addRouletteItem };
}
