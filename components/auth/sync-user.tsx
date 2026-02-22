"use strict";
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SyncUser() {
    const { user, isLoaded } = useUser();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const sync = async () => {
            try {
                await storeUser({
                    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Anonymous",
                    email: user.emailAddresses[0]?.emailAddress || "",
                    imageUrl: user.imageUrl,
                    clerkId: user.id,
                });
            } catch (error) {
                console.error("Error syncing user to Convex:", error);
            }
        };

        sync();
    }, [user, isLoaded, storeUser]);

    return null;
}
