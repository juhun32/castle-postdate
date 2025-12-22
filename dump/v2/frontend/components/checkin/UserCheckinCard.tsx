// components
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { CheckinSummary } from "@/components/checkin/CheckinSummary";
import * as Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, XCircle } from "lucide-react";

// types
import type { UserCheckinCardProps } from "@/lib/types/checkin";

export const UserCheckinCard = ({
    todayCheckin,
    userName,
    isDeleting,
    handleDeleteCheckin,
    formState,
    formSetters,
    isSubmitting,
    handleSubmit,
}: UserCheckinCardProps) => {
    return (
        <Card.Card className="w-full flex flex-col">
            <Card.CardHeader>
                <Card.CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Today
                    {todayCheckin && (
                        <div className="ml-auto flex">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteCheckin}
                                disabled={isDeleting}
                                className=""
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent className="space-y-4 flex-1">
                {todayCheckin ? (
                    <CheckinSummary
                        checkin={todayCheckin}
                        userName={userName}
                    />
                ) : (
                    <CheckinForm
                        formState={formState}
                        formSetters={formSetters}
                        isSubmitting={isSubmitting}
                        handleSubmit={handleSubmit}
                    />
                )}
            </Card.CardContent>
        </Card.Card>
    );
};
