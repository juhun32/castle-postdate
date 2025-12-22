"use client";

import * as Card from "@/components/ui/card";

export function InsightsCard() {
    return (
        <Card.Card>
            <Card.CardHeader>
                <Card.CardTitle>Cycle Insights</Card.CardTitle>
                <Card.CardDescription>
                    Your personalized health insights
                </Card.CardDescription>
            </Card.CardHeader>
            <Card.CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Cycle Regularity
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your cycles have been regular for the past 3 months
                    </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                        Common Symptoms
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Cramps and fatigue are most common during days 1-3
                    </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                        Fertility Pattern
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Your fertility window typically occurs on days 11-17
                    </p>
                </div>
            </Card.CardContent>
        </Card.Card>
    );
}
