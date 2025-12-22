"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Card from "@/components/ui/card";
import * as AlertDialog from "@/components/ui/alert-dialog";

// types
import { Connection, Invitation } from "@/lib/types/connection";
import { Blend } from "lucide-react";
import { Separator } from "../ui/separator";

export function ConnectionManager() {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("connection");
    const [inviteEmail, setInviteEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [connection, setConnection] = useState<Connection | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>(
        []
    );

    const fetchConnection = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connection`,
                {
                    credentials: "include",
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.connected) {
                    setConnection({
                        connectionId: data.connectionId,
                        partner: data.partner,
                    });
                } else {
                    setConnection(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch connection:", error);
        }
    };

    const fetchPendingInvitations = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connection/pending`,
                {
                    credentials: "include",
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Pending invitations:", data);
                setPendingInvitations(data.invitations || []);
            }
        } catch (error) {
            console.error("Failed to fetch invitations:", error);
        }
    };

    // load connection and invitations when dialog opens
    useEffect(() => {
        if (open) {
            fetchConnection();
            fetchPendingInvitations();
        }
    }, [open]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast("Invalid email");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connection/invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: inviteEmail.trim(),
                    }),
                }
            );

            if (response.ok) {
                toast(`Invitation sent to ${inviteEmail}`);
                setInviteEmail("");
            } else {
                const errorData = await response.json();
                console.error("Invitation error:", errorData);
                toast(
                    `Invitation Failed: ${errorData.error || "Unknown error"}`
                );
            }
        } catch (error) {
            toast("Failed to send invitation");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connection/${invitationId}/accept`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (response.ok) {
                toast("Invitation accepted");
                await fetchConnection();
                await fetchPendingInvitations();
                setActiveTab("connection");
            } else {
                const errorData = await response.json();
                toast(
                    "Failed to accept invitation",
                    errorData.error || "Something went wrong"
                );
            }
        } catch (error) {
            toast("Failed to accept invitation");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelInvitation = async (invitationId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/connection/${invitationId}/reject`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (response.ok) {
                toast("Invitation rejected");
                await fetchPendingInvitations();
            } else {
                const errorData = await response.json();
                toast(
                    "Failed to reject invitation",
                    errorData.error || "Something went wrong"
                );
            }
        } catch (error) {
            toast("Failed to reject invitation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // make container fill available height
        <div className="h-full flex flex-col">
            <div>
                <p className="text-lg">Manage your connection</p>
                <p className="text-sm text-muted-foreground">
                    Invite your partner!
                </p>
            </div>
            <Separator className="my-2" />
            {/* tabs take the remaining vertical space */}
            <Tabs
                defaultValue={activeTab}
                onValueChange={setActiveTab}
                className="w-full mt-4 flex-1 flex flex-col"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connection">My Connection</TabsTrigger>
                    {!connection ? (
                        <TabsTrigger
                            value="invitations"
                            data-count={pendingInvitations.length}
                        >
                            Invitations
                            {pendingInvitations.length > 0 &&
                                `(${pendingInvitations.length})`}
                        </TabsTrigger>
                    ) : (
                        <TabsTrigger
                            value="invitations"
                            data-count={pendingInvitations.length}
                            disabled
                        >
                            Invitations
                            {pendingInvitations.length > 0 &&
                                `(${pendingInvitations.length})`}
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent
                    value="connection"
                    className="flex-1 flex flex-col"
                >
                    {connection ? (
                        <Card.Card className="h-full flex flex-col">
                            <Card.CardHeader>
                                <Card.CardTitle>
                                    Connected Partner
                                </Card.CardTitle>
                                <Card.CardDescription className="pt-2">
                                    You are sharing with:
                                </Card.CardDescription>
                            </Card.CardHeader>
                            <Card.CardContent className="flex-1 overflow-auto">
                                <div className="flex flex-col bg-background dark:bg-background inset-shadow-sm p-4 rounded-md">
                                    <p className="font-medium">
                                        {connection.partner?.name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {connection.partner?.email}
                                    </p>
                                </div>
                            </Card.CardContent>
                        </Card.Card>
                    ) : (
                        <Card.Card className="h-full flex flex-col gap-4">
                            <Card.CardHeader>
                                <Card.CardTitle>No Connection</Card.CardTitle>
                                <Card.CardDescription>
                                    Invite someone to share your calple
                                </Card.CardDescription>
                            </Card.CardHeader>
                            <Card.CardContent className="flex-1 overflow-auto">
                                <div className="flex flex-col gap-1">
                                    <Label
                                        htmlFor="email"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Email address
                                    </Label>
                                    <div className="flex flex-col md:flex-row gap-2 lg:gap-4">
                                        <Input
                                            id="email"
                                            placeholder="partner@example.com"
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(e.target.value)
                                            }
                                            className="bg-background dark:bg-background inset-shadow-sm"
                                            disabled={
                                                isLoading ||
                                                pendingInvitations.length !== 0
                                            }
                                        />
                                        <Button
                                            onClick={handleInvite}
                                            className=" bg-background dark:bg-background inset-shadow-sm text-foreground"
                                            disabled={
                                                isLoading || !inviteEmail.trim()
                                            }
                                        >
                                            {isLoading
                                                ? "Sending..."
                                                : "Invite"}
                                        </Button>
                                    </div>
                                </div>
                            </Card.CardContent>
                        </Card.Card>
                    )}
                </TabsContent>

                <TabsContent
                    value="invitations"
                    className="flex-1 flex flex-col"
                >
                    {pendingInvitations.length === 0 ? (
                        <Card.Card className="h-full flex flex-col">
                            <Card.CardHeader>
                                <Card.CardTitle>
                                    No Pending Invitations
                                </Card.CardTitle>
                                <Card.CardDescription>
                                    You don't have any pending invitations.
                                </Card.CardDescription>
                            </Card.CardHeader>
                        </Card.Card>
                    ) : (
                        <div className="space-y-4 overflow-auto flex-1">
                            {pendingInvitations.map((invitation) => {
                                const isReceiver =
                                    invitation.role === "receiver";
                                console.log(invitation);
                                console.log(isReceiver);

                                return (
                                    <Card.Card
                                        key={invitation.id}
                                        className="flex flex-col"
                                    >
                                        <Card.CardHeader>
                                            <Card.CardTitle className="pb-2">
                                                Calple Invitation
                                            </Card.CardTitle>
                                            <Card.CardDescription>
                                                {isReceiver ? (
                                                    <div className="flex gap-2 items-center">
                                                        <p className="bg-background dark:bg-background inset-shadow-sm px-2 rounded-md">
                                                            {invitation.from_name
                                                                ? invitation.from_name
                                                                : invitation.from_email}
                                                        </p>
                                                        <p>wants to connect</p>
                                                    </div>
                                                ) : (
                                                    <p>Pending invitation</p>
                                                )}
                                            </Card.CardDescription>
                                        </Card.CardHeader>
                                        <Card.CardContent className="pt-2">
                                            <div className="bg-background dark:bg-background inset-shadow-sm p-4 rounded-md">
                                                <p className="text-sm">
                                                    {invitation.from_email}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Sent on{" "}
                                                    {new Date(
                                                        invitation.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Card.CardContent>
                                        {isReceiver && (
                                            <Card.CardFooter className="flex justify-between pt-2">
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleCancelInvitation(
                                                            invitation.id
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        handleAcceptInvitation(
                                                            invitation.id
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                >
                                                    Accept
                                                </Button>
                                            </Card.CardFooter>
                                        )}
                                    </Card.Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {connection && (
                <AlertDialog.AlertDialog>
                    <AlertDialog.AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            disabled={isLoading}
                            className=" inset-shadow-sm"
                        >
                            Disconnect
                        </Button>
                    </AlertDialog.AlertDialogTrigger>
                    <AlertDialog.AlertDialogContent>
                        <AlertDialog.AlertDialogHeader>
                            <AlertDialog.AlertDialogTitle>
                                Are you absolutely sure?
                            </AlertDialog.AlertDialogTitle>
                            <AlertDialog.AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your account and remove your
                                data from our servers.
                            </AlertDialog.AlertDialogDescription>
                        </AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogFooter>
                            <AlertDialog.AlertDialogCancel>
                                Cancel
                            </AlertDialog.AlertDialogCancel>
                            <AlertDialog.AlertDialogAction
                                onClick={() =>
                                    handleCancelInvitation(
                                        connection.connectionId
                                    )
                                }
                            >
                                Disconnect
                            </AlertDialog.AlertDialogAction>
                        </AlertDialog.AlertDialogFooter>
                    </AlertDialog.AlertDialogContent>
                </AlertDialog.AlertDialog>
            )}
        </div>
    );
}
