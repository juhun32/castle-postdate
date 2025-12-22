import { Analytics } from "@vercel/analytics/next";

import type { Metadata } from "next";
import { Bricolage_Grotesque, Lora } from "next/font/google";
import "./globals.css";

import { cookies } from "next/headers";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { NavBar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { Education } from "@/components/Education";
import { articles } from "@/lib/constants/articles";

const lora = Lora({
    subsets: ["latin"],
    variable: "--font-serif",
    weight: ["400", "500", "600", "700"],
});
const bricolageGrotesque = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-sans",
    weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const metadata: Metadata = {
    title: "Calple",
    description: "For your healthier dating life",
};

async function getAuthStatus() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("calple_session");

    if (!sessionCookie) return { isAuthenticated: false, user: null };

    try {
        const headers = new Headers();
        headers.append(
            "Cookie",
            `${sessionCookie.name}=${sessionCookie.value}`
        );
        headers.append("Content-Type", "application/json");

        const response = await fetch(`${BACKEND_URL}/api/auth/status`, {
            headers,
            cache: "no-store",
        });

        if (!response.ok) {
            console.log("Auth status error:", response.status);
            return { isAuthenticated: false, user: null };
        }

        const data = await response.json();
        console.log("Auth status response:", data);
        return {
            isAuthenticated: data.authenticated,
            user: data.user,
        };
    } catch {
        return { isAuthenticated: false, user: null };
    }
}

function getRandomArticles(count = 2) {
    const shuffled = [...articles].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const authState = await getAuthStatus();

    // Precompute random articles on the server
    const randomArticles = getRandomArticles();

    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${lora.variable} ${bricolageGrotesque.variable}`}
        >
            <head />
            <body className="h-full flex flex-col">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider initialState={authState}>
                        <Analytics />
                        <NavBar />
                        <div className="h-full">
                            {children}
                            <div className="container mx-auto px-4 md:px-8">
                                <Education articles={randomArticles} />
                            </div>
                        </div>
                        <footer className="fixed bottom-0 left-0 h-8 w-full flex justify-center z-50 border-t px-4 md:px-8 backdrop-blur">
                            <div className="container flex items-center justify-between">
                                <div className="flex sm:px-8 py-2 container text-muted-foreground text-xs">
                                    Juhun &copy; 2025
                                </div>
                                <div className="flex items-center justify-end gap-2 sm:px-8 py-2 container text-muted-foreground text-xs w-fit">
                                    <a
                                        href="/privacy"
                                        className="text-muted-foreground hover:text-stone-500 underline"
                                    >
                                        [Privacy]
                                    </a>
                                    <a
                                        href="https://github.com/juhun32/calple"
                                        target="_blank"
                                        className="text-muted-foreground hover:text-stone-500 underline"
                                    >
                                        [GitHub]
                                    </a>
                                    <p className="text-nowrap">For Emily</p>
                                </div>
                            </div>
                        </footer>
                    </AuthProvider>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
