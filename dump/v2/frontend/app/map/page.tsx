"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// components
import { MapHeader } from "@/components/map/MapHeader";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

import { DatePin } from "@/lib/types/map";
import { fetchPins } from "@/lib/api/map";

// dynamically import leaflet map component
// this is needed to prevent server side rendering issues cause leftlet relies on the DOM
// and nextjs tries to render components on the server side
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
    ssr: false,
});

export default function MapPage() {
    const [addingPin, setAddingPin] = useState(false);

    // all pins fetched from the server
    const [pins, setPins] = useState<DatePin[]>([]);
    const [selectedPin, setSelectedPin] = useState<DatePin | null>(null);

    const reloadPins = useCallback(async () => {
        try {
            const all = await fetchPins();
            setPins(all);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        reloadPins();
    }, [reloadPins]);

    return (
        <div className="flex-1 relative min-h-screen lg:grid lg:grid-cols-[2fr_1fr] px-4 md:px-8 pt-20 pb-12 md:pb-16 container mx-auto gap-8 space-y-4">
            <LeafletMap
                key="main-map"
                addingPin={addingPin}
                setAddingPin={setAddingPin}
                selectedPin={selectedPin}
                setSelectedPin={setSelectedPin}
                pins={pins}
                reloadPins={reloadPins}
            />

            <div className="flex flex-col">
                <MapHeader addingPin={addingPin} setAddingPin={setAddingPin} />
                <Separator orientation="horizontal" className="my-4" />

                <div className="overflow-auto rounded-lg p-2 bg-card dark:bg-card shadow-md">
                    <Table className="rounded-lg">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Title</TableHead>
                                <TableHead className="hidden lg:flex align-middle text-xs w-fit">
                                    <p className="flex items-center">
                                        Lat, Lng
                                    </p>
                                </TableHead>
                                <TableHead className="text-xs">
                                    Location
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pins.map((pin) => (
                                <TableRow
                                    key={pin.id}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedPin(pin)}
                                >
                                    <TableCell>
                                        <p className="max-w-[200px] truncate">
                                            {pin.title}
                                        </p>
                                    </TableCell>
                                    <TableCell className="hidden lg:block w-fit">
                                        <p className="bg-background dark:bg-background px-2 rounded inset-shadow-sm w-fit">
                                            [{pin.lat.toFixed(2)},{" "}
                                            {pin.lng.toFixed(2)}]
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="max-w-[200px] truncate">
                                            {pin.location}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
