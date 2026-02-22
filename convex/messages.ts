import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content,
            type: args.type,
        });

        // Update conversation's last message
        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        // Increment unread count for other participants
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            for (const participantId of conversation.participants) {
                if (participantId !== args.senderId) {
                    const member = await ctx.db
                        .query("conversationMembers")
                        .withIndex("by_conversationId_userId", (q) =>
                            q.eq("conversationId", args.conversationId).eq("userId", participantId)
                        )
                        .unique();

                    if (member) {
                        await ctx.db.patch(member._id, { unreadCount: member.unreadCount + 1 });
                    } else {
                        await ctx.db.insert("conversationMembers", {
                            conversationId: args.conversationId,
                            userId: participantId,
                            unreadCount: 1,
                        });
                    }
                }
            }
        }

        return messageId;
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const member = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();

        if (member) {
            await ctx.db.patch(member._id, { unreadCount: 0 });
        } else {
            await ctx.db.insert("conversationMembers", {
                conversationId: args.conversationId,
                userId: args.userId,
                unreadCount: 0,
            });
        }
    },
});

export const getByConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();
    },
});

export const setTypingIndicator = mutation({
    args: { conversationId: v.id("conversations"), userId: v.id("users"), isTyping: v.boolean() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();

        if (args.isTyping) {
            if (existing) {
                await ctx.db.patch(existing._id, { updatedAt: Date.now() });
            } else {
                await ctx.db.insert("typingIndicators", {
                    conversationId: args.conversationId,
                    userId: args.userId,
                    updatedAt: Date.now(),
                });
            }
        } else if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const getTypingIndicators = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        // Return all indicators updated in the last 10 seconds
        const threshold = Date.now() - 10000;
        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        return indicators.filter(i => i.updatedAt > threshold);
    },
});

export const remove = mutation({
    args: { id: v.id("messages") },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.id);
        if (!message) return;

        await ctx.db.patch(args.id, {
            content: "This message was deleted",
            isDeleted: true,
        });
    },
});
