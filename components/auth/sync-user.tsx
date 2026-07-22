"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SyncUser() {
    const { user, isLoaded } = useUser();
    const storeUser = useMutation(api.users.store);
    
    // Load database users and conversations directly on the client
    const dbUser = useQuery(api.users.me, user ? { clerkId: user.id } : "skip");
    const allUsers = useQuery(api.users.getUsers);
    const conversations = useQuery(api.conversations.get, dbUser ? { userId: dbUser._id } : "skip");

    const createConversation = useMutation(api.conversations.create);
    const sendMessage = useMutation(api.messages.send);

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

    // Client-side welcome chats auto-generator
    useEffect(() => {
        if (!isLoaded || !user || !dbUser || !allUsers || !conversations) return;

        const setupWelcomeChats = async () => {
            // Find all mock users created in the dashboard (ending in @mock.com)
            const mocks = allUsers.filter(u => u.email.endsWith("@mock.com"));
            
            for (const mock of mocks) {
                // Check if a conversation already exists with this mock user
                const hasChat = conversations.some((c: any) => 
                    c.participants.includes(mock._id)
                );

                if (!hasChat) {
                    try {
                        // 1. Create the conversation
                        const conversationId = await createConversation({
                            participants: [dbUser._id, mock._id],
                            isGroup: false,
                        });

                        // 2. Send the welcome message from the mock user
                        const welcomeText = mock.name.includes("Assistant")
                            ? `Hello ${dbUser.name}! I am Tars Assistant. I can help guide you through the app features. Try replying to me!`
                            : `Hey! I'm ${mock.name.split(" ")[0]}. Nice to connect with you.`;

                        await sendMessage({
                            conversationId,
                            senderId: mock._id,
                            content: welcomeText,
                            type: "text",
                        });
                    } catch (err) {
                        console.error("Failed to create welcome conversation:", err);
                    }
                }
            }
        };

        setupWelcomeChats();
    }, [user, isLoaded, dbUser, allUsers, conversations, createConversation, sendMessage]);

    return null;
}
