import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: { participants: v.array(v.id("users")), isGroup: v.boolean(), name: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // Check if a one-on-one conversation already exists
        if (!args.isGroup && args.participants.length === 2) {
            const existing = await ctx.db
                .query("conversations")
                .filter((q) =>
                    q.and(
                        q.eq(q.field("isGroup"), false),
                        q.or(
                            q.eq(q.field("participants"), args.participants),
                            q.eq(q.field("participants"), [args.participants[1], args.participants[0]])
                        )
                    )
                )
                .unique();

            if (existing) return existing._id;
        }

        return await ctx.db.insert("conversations", {
            participants: args.participants,
            isGroup: args.isGroup,
            name: args.name,
        });
    },
});

export const get = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .collect();

        // Filter conversations where the user is a participant
        // Note: In a real app, you'd use an index or search for efficiency
        const myConversations = conversations.filter(c => c.participants.includes(args.userId));

        const conversationsWithDetails = await Promise.all(
            myConversations.map(async (c) => {
                const otherParticipantId = c.participants.find((p) => p !== args.userId);
                const otherParticipant = otherParticipantId
                    ? await ctx.db.get(otherParticipantId)
                    : null;

                const lastMessage = c.lastMessageId
                    ? await ctx.db.get(c.lastMessageId)
                    : null;

                const memberInfo = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId_userId", (q) =>
                        q.eq("conversationId", c._id).eq("userId", args.userId)
                    )
                    .unique();

                return {
                    ...c,
                    otherParticipant,
                    lastMessage,
                    unreadCount: memberInfo?.unreadCount || 0,
                };
            })
        );

        return conversationsWithDetails;
    },
});
