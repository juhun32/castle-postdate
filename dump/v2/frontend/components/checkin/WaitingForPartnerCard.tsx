import * as Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw } from "lucide-react";
import type { WaitingForPartnerCardProps } from "@/lib/types/checkin";

export const WaitingForPartnerCard = ({
    isRefreshingPartner,
    loadPartnerData,
}: WaitingForPartnerCardProps) => (
    <Card.Card className="w-full flex flex-col gap-4">
        <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Waiting for Partner's data
            </Card.CardTitle>
        </Card.CardHeader>
        <Card.CardContent className="flex-1 flex flex-col gap-4">
            <Button
                onClick={loadPartnerData}
                variant="outline"
                className="w-full"
                disabled={isRefreshingPartner}
            >
                {isRefreshingPartner ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    <RefreshCw className="w-4 h-4" />
                )}
                Refresh Partner Data
            </Button>
        </Card.CardContent>
    </Card.Card>
);
