export interface Invitation {
    id: string;
    from_email: string;
    from_name: string | null;
    role: "receiver" | "initiator";
    createdAt: string;
}

export interface Connection {
    connectionId: string;
    partner: {
        email: string;
        name: string;
    } | null;
}
