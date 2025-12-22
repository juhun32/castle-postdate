"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

// components
import { useAuth } from "@/components/auth-provider";

// utils
import { calculateDDay, login, logout } from "@/lib/utils";

// ui
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@/components/ui/dropdown-menu";

// assets
import { Logo } from "@/lib/assets/logo";

// icons
import {
    LogOut,
    Paintbrush,
    Sun,
    Moon,
    Menu,
    User,
    Flower,
    Home,
    Calendar,
    SquareCheckBig,
    Droplets,
    MessageSquarePlus,
    MapPinnedIcon,
    Link,
} from "lucide-react";

// api
import { getUserMetadata } from "@/lib/api/profile";

export function NavBar() {
    const { setTheme } = useTheme();
    const { authState } = useAuth();
    const pathname = usePathname();

    const activeClass = (href: string) =>
        pathname === href
            ? "text-foreground underline"
            : "text-muted-foreground";

    console.log(authState);

    const [startedDating, setStartedDating] = useState<Date | null>(null);

    useEffect(() => {
        let mounted = true;
        async function fetchMetadata() {
            // dont call server when user is not authenticated
            if (!authState?.isAuthenticated) {
                if (mounted) setStartedDating(null);
                return;
            }

            try {
                const metadata = await getUserMetadata();
                if (!mounted) return;
                setStartedDating(
                    metadata && metadata.startedDating
                        ? new Date(metadata.startedDating)
                        : null
                );
            } catch (err) {
                if (mounted) setStartedDating(null);
            }
        }

        fetchMetadata();
        return () => {
            mounted = false;
        };
    }, [authState?.isAuthenticated]);

    const startedDatingDday = startedDating
        ? calculateDDay(startedDating)
        : null;

    return (
        <>
            <div className="fixed z-50 h-16 w-full flex justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 font-sans">
                {authState.isAuthenticated ? (
                    <div className="flex items-center justify-between w-full px-4 md:px-8 gap-2">
                        <div className="flex items-center justify-center">
                            <a href="/" className="flex relative mx-3 sm:mr-6">
                                <Logo />
                            </a>

                            <div className="hidden sm:flex items-center">
                                {startedDatingDday ? (
                                    <a
                                        href="/profile"
                                        className=" rounded w-fit h-6 flex items-center gap-2 justify-center text-sm h-8 font-light"
                                    >
                                        <Link
                                            className="h-3.5 w-3.5"
                                            strokeWidth={1.5}
                                        />
                                        {startedDatingDday}
                                    </a>
                                ) : (
                                    <a
                                        href="/profile"
                                        className=" rounded w-fit px-3 h-6 flex items-center gap-2 justify-center text-sm h-8"
                                    >
                                        <Link className="h-3.5 w-3.5" />-
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:flex flex flex-row gap-1 items-center  rounded px-2 h-8 absolute left-1/2 -translate-x-1/2">
                            <Button
                                variant="link"
                                size="sm"
                                className={`px-3 hover:cursor-pointer [&_svg:not([class*='size-'])]:size-4 h-6 w-6 ${activeClass(
                                    "/"
                                )}`}
                                onClick={() => {
                                    window.location.href = "/";
                                }}
                            >
                                <Home strokeWidth={2} />
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className={`px-3 h-6 w-fit hover:cursor-pointer ${activeClass(
                                    "/checkin"
                                )}`}
                                onClick={() => {
                                    window.location.href = "/checkin";
                                }}
                            >
                                {/* <SquareCheckBig strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Check-In
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className={`px-3 h-6 w-fit hover:cursor-pointer ${activeClass(
                                    "/calendar"
                                )}`}
                                onClick={() => {
                                    window.location.href = "/calendar";
                                }}
                            >
                                {/* <Calendar strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Calendar
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className={`px-3 h-6 w-fit hover:cursor-pointer ${activeClass(
                                    "/tracker"
                                )}`}
                                onClick={() => {
                                    window.location.href = "/tracker";
                                }}
                            >
                                {/* <Droplets strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Cycle
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className={`px-3 h-6 w-fit hover:cursor-pointer ${activeClass(
                                    "/map"
                                )}`}
                                onClick={() => {
                                    window.location.href = "/map";
                                }}
                            >
                                {/* <MapPinned strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Map
                                </span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            <a
                                className="hidden lg:flex items-center gap-2 bg-muted rounded h-6 px-2"
                                href="/profile"
                            >
                                <span className="text-sm flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {authState.user?.name}
                                </span>
                            </a>

                            <div className="flex items-center gap-2 rounded h-8">
                                <div className="hidden sm:flex">
                                    <DropdownMenu.DropdownMenu>
                                        <DropdownMenu.DropdownMenuTrigger
                                            asChild
                                        >
                                            <Button
                                                className="rounded-full"
                                                variant="outline"
                                                size="icon"
                                            >
                                                <Paintbrush />
                                            </Button>
                                        </DropdownMenu.DropdownMenuTrigger>
                                        <DropdownMenu.DropdownMenuContent
                                            align="end"
                                            className="font-sans"
                                        >
                                            <DropdownMenu.DropdownMenuLabel>
                                                Rose
                                            </DropdownMenu.DropdownMenuLabel>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() => setTheme("pink")}
                                            >
                                                <Flower className="mr-2 h-4 w-4 text-rose-400" />
                                                Light
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    setTheme("pinkdark")
                                                }
                                            >
                                                <Flower className="mr-2 h-4 w-4 text-purple-800/70" />
                                                Dark
                                            </DropdownMenu.DropdownMenuItem>

                                            <DropdownMenu.DropdownMenuSeparator />

                                            <DropdownMenu.DropdownMenuLabel>
                                                Default
                                            </DropdownMenu.DropdownMenuLabel>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    setTheme("light")
                                                }
                                            >
                                                <Sun className="mr-2 h-4 w-4 text-yellow-500" />
                                                Light
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() => setTheme("dark")}
                                            >
                                                <Moon className="mr-2 h-4 w-4 text-sky-700/70" />
                                                Dark
                                            </DropdownMenu.DropdownMenuItem>
                                        </DropdownMenu.DropdownMenuContent>
                                    </DropdownMenu.DropdownMenu>
                                </div>

                                <DropdownMenu.DropdownMenu>
                                    <DropdownMenu.DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-full"
                                            size="icon"
                                        >
                                            <Menu className="h-4" />
                                        </Button>
                                    </DropdownMenu.DropdownMenuTrigger>
                                    <DropdownMenu.DropdownMenuContent className="w-56 font-sans">
                                        <DropdownMenu.DropdownMenuGroup className="lg:hidden">
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/profile")
                                                }
                                            >
                                                <span className="text-sm flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {authState.user?.name}
                                                </span>
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuSeparator />
                                        </DropdownMenu.DropdownMenuGroup>
                                        <DropdownMenu.DropdownMenuGroup className="md:hidden">
                                            <DropdownMenu.DropdownMenuLabel>
                                                Directory
                                            </DropdownMenu.DropdownMenuLabel>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href = "/")
                                                }
                                                className=""
                                            >
                                                <Home className="h-4 w-4" />
                                                Home
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/checkin")
                                                }
                                                className=""
                                            >
                                                <SquareCheckBig className="h-4 w-4" />
                                                Check-In
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/calendar")
                                                }
                                                className=""
                                            >
                                                <Calendar className="h-4 w-4" />
                                                Calendar
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/tracker")
                                                }
                                                className=""
                                            >
                                                <Droplets className="h-4 w-4" />
                                                Cycle
                                            </DropdownMenu.DropdownMenuItem>

                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/map")
                                                }
                                                className=""
                                            >
                                                <MapPinnedIcon className="h-4 w-4" />
                                                Map
                                            </DropdownMenu.DropdownMenuItem>
                                            <DropdownMenu.DropdownMenuSeparator />
                                        </DropdownMenu.DropdownMenuGroup>

                                        <DropdownMenu.DropdownMenuLabel>
                                            Ideas
                                        </DropdownMenu.DropdownMenuLabel>
                                        <DropdownMenu.DropdownMenuGroup>
                                            <DropdownMenu.DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        "/feedback")
                                                }
                                                className=""
                                            >
                                                <MessageSquarePlus className="h-4 w-4" />
                                                Feedback
                                            </DropdownMenu.DropdownMenuItem>
                                        </DropdownMenu.DropdownMenuGroup>
                                        <DropdownMenu.DropdownMenuGroup className="sm:hidden">
                                            <DropdownMenu.DropdownMenuSeparator />
                                            <DropdownMenu.DropdownMenuLabel>
                                                Themes
                                            </DropdownMenu.DropdownMenuLabel>
                                            <DropdownMenu.DropdownMenuItem>
                                                <Button
                                                    onClick={() =>
                                                        setTheme("pink")
                                                    }
                                                    size="icon"
                                                    variant="outline"
                                                    className="dark:bg-background rounded-full w-7 h-7"
                                                >
                                                    <Flower className="h-4 w-4 text-rose-300" />
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        setTheme("pinkdark")
                                                    }
                                                    size="icon"
                                                    variant="outline"
                                                    className="dark:bg-background rounded-full w-7 h-7"
                                                >
                                                    <Flower className="h-4 w-4 text-purple-600" />
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        setTheme("light")
                                                    }
                                                    size="icon"
                                                    variant="outline"
                                                    className="dark:bg-background rounded-full w-7 h-7"
                                                >
                                                    <Sun className="h-4 w-4 text-yellow-400" />
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        setTheme("dark")
                                                    }
                                                    size="icon"
                                                    variant="outline"
                                                    className="dark:bg-background rounded-full w-7 h-7"
                                                >
                                                    <Moon className="h-4 w-4 text-sky-600" />
                                                </Button>
                                            </DropdownMenu.DropdownMenuItem>
                                        </DropdownMenu.DropdownMenuGroup>
                                        <DropdownMenu.DropdownMenuSeparator />
                                        <DropdownMenu.DropdownMenuItem
                                            onClick={logout}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="">Logout</span>
                                        </DropdownMenu.DropdownMenuItem>
                                    </DropdownMenu.DropdownMenuContent>
                                </DropdownMenu.DropdownMenu>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full px-4 md:px-8 gap-2">
                        <a href="/" className="flex relative mx-3 sm:mr-6">
                            <Logo />
                        </a>

                        <div className="hidden md:flex flex flex-row gap-1 items-center  rounded px-2 h-8 absolute left-1/2 -translate-x-1/2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="px-3 hover:cursor-pointer [&_svg:not([class*='size-'])]:size-4 h-6 w-6 text-muted-foreground"
                                onClick={() => {
                                    window.location.href = "/";
                                }}
                            >
                                <Home strokeWidth={2} />
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className="px-3 h-6 w-fit hover:cursor-pointer text-muted-foreground"
                                onClick={() => {
                                    window.location.href = "/checkin";
                                }}
                            >
                                {/* <SquareCheckBig strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Check-In
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className="px-3 h-6 w-fit hover:cursor-pointer text-muted-foreground"
                                onClick={() => {
                                    window.location.href = "/calendar";
                                }}
                            >
                                {/* <Calendar strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Calendar
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className="px-3 h-6 w-fit hover:cursor-pointer text-muted-foreground"
                                onClick={() => {
                                    window.location.href = "/tracker";
                                }}
                            >
                                {/* <Droplets strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Cycle
                                </span>
                            </Button>

                            <Button
                                variant="link"
                                size="sm"
                                className="px-3 h-6 w-fit hover:cursor-pointer text-muted-foreground"
                                onClick={() => {
                                    window.location.href = "/map";
                                }}
                            >
                                {/* <MapPinned strokeWidth={1.7} /> */}
                                <span className="flex font-normal h-6 items-center">
                                    Map
                                </span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size={"sm"}
                                className="rounded-full w-fit text-sm font-normal gap-2"
                                onClick={login}
                            >
                                <div className="gsi-material-button-icon">
                                    <svg
                                        version="1.1"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 48 48"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                        style={{ display: "block" }}
                                    >
                                        <path
                                            fill="#EA4335"
                                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                        ></path>
                                        <path
                                            fill="#4285F4"
                                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                        ></path>
                                        <path
                                            fill="#FBBC05"
                                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                        ></path>
                                        <path
                                            fill="#34A853"
                                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                        ></path>
                                        <path
                                            fill="none"
                                            d="M0 0h48v48H0z"
                                        ></path>
                                    </svg>
                                </div>
                                <span className="hidden lg:inline">
                                    Sign in with Google
                                </span>
                                <span className="inline lg:hidden">
                                    Sign in
                                </span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
