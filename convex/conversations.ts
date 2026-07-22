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
        // Query the conversation memberships for this user using the by_userId index
        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const conversationsWithDetails = await Promise.all(
            memberships.map(async (member) => {
                const c = await ctx.db.get(member.conversationId);
                if (!c) return null;

                const otherParticipantId = c.participants.find((p) => p !== args.userId);
                const otherParticipant = otherParticipantId
                    ? await ctx.db.get(otherParticipantId)
                    : null;

                const lastMessage = c.lastMessageId
                    ? await ctx.db.get(c.lastMessageId)
                    : null;

                return {
                    ...c,
                    otherParticipant,
                    lastMessage,
                    unreadCount: member.unreadCount,
                };
            })
        );

        // Filter out any null conversations (e.g. if a conversation was deleted but membership remains)
        return conversationsWithDetails.filter((c) => c !== null) as any;
    },
});
