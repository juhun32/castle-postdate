"use client";

import { useAuth } from "@/components/auth-provider";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

// components
import { toast } from "sonner";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { GenderSettingsCard } from "@/components/profile/GenderSettingsCard";
import { AccountSettingsCard } from "@/components/profile/AccountSettingsCard";
import { DatingInfoCard } from "@/components/profile/DatingInfoCard";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar";

// api
import { getUserMetadata, updateUserMetadata } from "@/lib/api/profile";

// utils
import { logout } from "@/lib/utils";
import { Link, Settings, User, Users } from "lucide-react";
import { ConnectionManager } from "@/components/profile/ConnectionHandler";

export default function Profile() {
    const { authState } = useAuth();
    const [userSex, setUserSex] = useState<"male" | "female">("female");
    const [startedDating, setStartedDating] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedNav, setSelectedNav] = useState<string>("About Us");

    const data = {
        nav: [
            { name: "About Us", icon: Users },
            { name: "About Me", icon: User },
            { name: "My Partner", icon: Link },
            { name: "My Account", icon: Settings },
        ],
    };

    if (!authState.isAuthenticated && typeof window !== "undefined") {
        redirect("/");
    }

    useEffect(() => {
        const loadUserMetadata = async () => {
            try {
                const metadata = await getUserMetadata();
                if (metadata) {
                    setUserSex(metadata.sex as "male" | "female");
                    if (metadata.startedDating) {
                        setStartedDating(metadata.startedDating);
                    }
                }
            } catch (error) {
                console.error("Failed to load user metadata:", error);
            }
        };

        loadUserMetadata();
    }, []);

    const handleSexChange = async (sex: "male" | "female") => {
        setIsLoading(true);
        try {
            await updateUserMetadata({ sex });
            setUserSex(sex);
            toast("Gender setting updated successfully");
        } catch (error) {
            console.error("Failed to update Gender setting:", error);
            toast("Failed to update Gender setting");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDatingDate = async (date: string) => {
        setIsLoading(true);
        try {
            const updatedMetadata = await updateUserMetadata({
                startedDating: date,
            });
            if (updatedMetadata.startedDating) {
                setStartedDating(updatedMetadata.startedDating);
            }
            toast.success("Dating date updated successfully");
        } catch (error) {
            console.error("Failed to update dating date:", error);
            toast.error("Failed to update dating date");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete account from server.");
            }

            toast.success("Account deleted successfully.");
            await logout();
        } catch (error) {
            console.error("Account deletion failed:", error);
            toast.error("An error occurred while deleting your account.");
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen container mx-auto max-w-5xl flex pt-20 pb-12 lg:pb-16 px-4 lg:px-8 gap-4">
            <div className="hidden sm:grid min-h-170 grid-cols-[1fr_auto] mx-auto my-auto border rounded-lg">
                <SidebarProvider className="items-start">
                    <Sidebar collapsible="none" className="flex rounded-l-lg">
                        <SidebarHeader className="border-b">
                            <ProfileHeader
                                name={authState.user?.name}
                                email={authState.user?.email}
                            />
                        </SidebarHeader>

                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {data.nav.map((item) => {
                                            const Icon =
                                                item.icon as React.ComponentType<
                                                    React.SVGProps<SVGSVGElement>
                                                >;
                                            return (
                                                <SidebarMenuItem
                                                    key={item.name}
                                                >
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={
                                                            selectedNav ===
                                                            item.name
                                                        }
                                                    >
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setSelectedNav(
                                                                    item.name
                                                                );
                                                            }}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span>
                                                                {item.name}
                                                            </span>
                                                        </a>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                    </Sidebar>
                </SidebarProvider>

                <SidebarInset className="w-2xl p-4">
                    {selectedNav === "About Us" && (
                        <DatingInfoCard
                            startedDating={startedDating}
                            onUpdate={handleUpdateDatingDate}
                            isLoading={isLoading}
                        />
                    )}

                    {selectedNav === "About Me" && (
                        <GenderSettingsCard
                            userSex={userSex}
                            isLoading={isLoading}
                            onSexChange={handleSexChange}
                        />
                    )}

                    {selectedNav === "My Partner" && <ConnectionManager />}

                    {selectedNav === "My Account" && (
                        <AccountSettingsCard
                            isDeleting={isDeleting}
                            onDeleteAccount={handleDeleteAccount}
                            onLogout={logout}
                        />
                    )}
                </SidebarInset>
            </div>

            <div className="sm:hidden flex flex-col gap-8">
                <div className="border rounded-lg p-2">
                    <DatingInfoCard
                        startedDating={startedDating}
                        onUpdate={handleUpdateDatingDate}
                        isLoading={isLoading}
                    />
                </div>

                <div className="border rounded-lg p-2">
                    <GenderSettingsCard
                        userSex={userSex}
                        isLoading={isLoading}
                        onSexChange={handleSexChange}
                    />
                </div>

                <div className="border rounded-lg p-2">
                    <ConnectionManager />
                </div>

                <div className="border rounded-lg p-2">
                    <AccountSettingsCard
                        isDeleting={isDeleting}
                        onDeleteAccount={handleDeleteAccount}
                        onLogout={logout}
                    />
                </div>
            </div>
        </div>
    );
}
