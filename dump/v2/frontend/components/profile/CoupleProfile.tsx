"use client";
import { useState } from "react";

// auth
import { useAuth } from "@/components/auth-provider";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, Heart, PenLine } from "lucide-react";

export default function Dates() {
    const [date, setDate] = useState<Date>();
    const [isEditing, setIsEditing] = useState(false);
    const { authState } = useAuth();

    return (
        <div className="container h-full px-8 pt-20 pb-8">
            <div className="flex items-center pb-8">
                <Button variant="ghost" size="icon" className="mr-2">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold">Couple Profile</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    <PenLine className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex flex-col items-center justify-center">
                {isEditing ? (
                    <Card className="w-full">
                        <div className="flex justify-center">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-24 h-24 rounded-full"
                            >
                                <Avatar className="w-24 h-24 border-4 border-secondary">
                                    <AvatarImage
                                        src="/placeholder.svg?height=96&width=96"
                                        alt="Profile"
                                    />
                                    <AvatarFallback>Avatar</AvatarFallback>
                                </Avatar>
                            </Button>
                        </div>

                        <CardHeader>
                            <div className="space-y-4">
                                <Label htmlFor="coupleName">
                                    Couple's Name / Your Name
                                </Label>
                                <Input
                                    id="coupleName"
                                    defaultValue={
                                        authState.user?.name || "Jane & John"
                                    } // Populate with actual data
                                />
                            </div>
                            <div className="space-y-4 pt-4">
                                <Label htmlFor="anniversaryDate">
                                    Together Since
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="anniversaryDate"
                                            variant={"outline"}
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? (
                                                format(date, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="relationshipStatus">
                                    Relationship Status
                                </Label>
                                <div className="flex items-center mt-4">
                                    <Heart
                                        className="w-4 h-4 mr-2 text-rose-500"
                                        fill="currentColor"
                                    />
                                    <Input
                                        id="relationshipStatus"
                                        defaultValue="In a relationship" // Populate with actual data
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label htmlFor="aboutUs">About Us</Label>
                                {/* Consider using Textarea for multi-line input if available and imported */}
                                <Input // Or Textarea
                                    id="aboutUs"
                                    defaultValue="We met at a coffee shop in 2019 and have been inseparable ever since. We love hiking, cooking together, and movie nights." // Populate with actual data
                                    className="mt-1"
                                    placeholder="Tell us a bit about your relationship..."
                                />
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <Label htmlFor="favoriteDate">
                                            Favorite Date Activity
                                        </Label>
                                        <Input
                                            id="favoriteDate"
                                            defaultValue="Dinner & Movie" // Populate with actual data
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label htmlFor="specialDay">
                                            Special Day of the Week
                                        </Label>
                                        <Input
                                            id="specialDay"
                                            defaultValue="Friday" // Populate with actual data
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Add save logic here
                                        setIsEditing(false);
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full">
                        <div className="flex justify-center">
                            <Avatar className="w-24 h-24 border-4 border-secondary">
                                <AvatarImage
                                    src="/placeholder.svg?height=96&width=96"
                                    alt="Profile"
                                />
                                <AvatarFallback>Avatar</AvatarFallback>
                            </Avatar>
                        </div>

                        <CardHeader>
                            <CardTitle>Name</CardTitle>
                            <CardDescription>
                                Together since ...
                            </CardDescription>
                        </CardHeader>

                        <Separator className="my-2" />

                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Relationship Status
                                </h3>
                                <p className="flex items-center mt-2">
                                    <Heart
                                        className="w-4 h-4 mr-2 text-rose-500"
                                        fill="currentColor"
                                    />
                                    In a relationship
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    About Us
                                </h3>
                                <p className="mt-2 text-sm">example about us</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex flex-col gap-2 text-sm rounded-md">
                                    <span className="font-medium">
                                        Favorite Date:
                                    </span>
                                    Dinner & Movie
                                </div>
                                <div className="flex flex-col gap-2 text-sm rounded-md">
                                    <span className="font-medium">
                                        Special Day:
                                    </span>
                                    Friday
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
