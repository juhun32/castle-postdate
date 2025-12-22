"use client";

import RouletteSocial from "@/components/roulette/RouletteSocial";
import RouletteLists from "@/components/roulette/RouletteLists";

export default function Roulette() {
    return (
        <div className="container h-full px-8 pt-20 pb-16 mx-auto grid grid-cols-2 gap-8">
            <div className="flex flex-col h-full items-center justify-between gap-4">
                <RouletteLists />
            </div>

            <div className="flex flex-col h-full items-center justify-between overflow-y-scroll no-scrollbar border-b">
                <RouletteSocial />
            </div>
        </div>
    );
}
