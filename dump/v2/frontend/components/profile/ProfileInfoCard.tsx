import * as Card from "@/components/ui/card";
import { User, Mail, Calendar, Clock } from "lucide-react";

import { ProfileInfoCardProps } from "@/lib/types/profile";

export const ProfileInfoCard = ({ email }: ProfileInfoCardProps) => {
    return (
        <Card.Card className="gap-4">
            <Card.CardHeader>
                <Card.CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Information
                </Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent className="space-y-4">
                <div className="">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Email :</span>
                        <span className="text-muted-foreground">{email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Member since :</span>
                        <span className="text-muted-foreground">
                            {new Date().toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Last active :</span>
                        <span className="text-muted-foreground">Today</span>
                    </div>
                </div>
            </Card.CardContent>
        </Card.Card>
    );
};
