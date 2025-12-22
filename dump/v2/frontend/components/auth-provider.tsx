"use client";
import { createContext, useContext, useState } from "react";

type AuthContextType = {
    authState: { isAuthenticated: boolean; user: any };
    setAuthState: React.Dispatch<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    children,
    initialState,
}: {
    children: React.ReactNode;
    initialState: any;
}) {
    const [authState, setAuthState] = useState(initialState);
    return (
        <AuthContext.Provider value={{ authState, setAuthState }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
