import { Marker } from "react-leaflet";
import { DatePin } from "@/lib/types/map";
import { divIcon } from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const LucideIcon = divIcon({
    className: "text-pink-500",
    html: renderToStaticMarkup(<MapPin size={32} strokeWidth={2} />),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

export function MapPins({
    pins,
    setSelectedPin,
    setIsEditing,
}: {
    pins: DatePin[];
    setSelectedPin: (pin: DatePin) => void;
    setIsEditing: (v: boolean) => void;
}) {
    return (
        <>
            {pins.map((pin) => (
                <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    icon={LucideIcon}
                    eventHandlers={{
                        click: () => {
                            setSelectedPin(pin);
                            setIsEditing(false);
                        },
                    }}
                />
            ))}
        </>
    );
}
