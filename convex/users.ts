import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Insert or update the user in the database.
 */
export const store = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                email: args.email,
                imageUrl: args.imageUrl,
            });
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            clerkId: args.clerkId,
        });

        // Fetch the mock users (emails ending with @mock.com)
        const allUsers = await ctx.db.query("users").collect();
        const mocks = allUsers.filter(u => u.email.endsWith("@mock.com"));

        // Auto-create direct chats and welcome messages
        for (const mock of mocks) {
            const conversationId = await ctx.db.insert("conversations", {
                participants: [userId, mock._id],
                isGroup: false,
            });

            // Set up members
            await ctx.db.insert("conversationMembers", { conversationId, userId, unreadCount: 1 });
            await ctx.db.insert("conversationMembers", { conversationId, userId: mock._id, unreadCount: 0 });

            // Create welcome message
            const welcomeText = mock.name.includes("Assistant") 
                ? `Hello ${args.name}! I am Tars Assistant. I can help guide you through the app features. Try replying to me!`
                : `Hey! I'm ${mock.name.split(" ")[0]}. Nice to connect with you.`;

            const messageId = await ctx.db.insert("messages", {
                conversationId,
                senderId: mock._id,
                content: welcomeText,
                type: "text",
            });

            // Set conversation last message reference
            await ctx.db.patch(conversationId, { lastMessageId: messageId });
        }

        return userId;
    },
});

export const getUsers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

export const me = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();
    },
});
