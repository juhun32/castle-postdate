"use client";

import { useRouter } from "next/navigation";

// utils
import { login } from "@/lib/utils";

// components
import { useAuth } from "@/components/auth-provider";

// ui
import { Button } from "@/components/ui/button";

// icons
import { Calendar, Droplets, SquareCheckBig } from "lucide-react";
import Start from "./start";

export default function Home() {
    const { authState } = useAuth();
    const router = useRouter();

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center pt-16 mx-auto">
            <Start />
        </div>
    );
}
