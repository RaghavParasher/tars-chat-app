import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        participants: v.array(v.id("users")),
        isGroup: v.boolean(),
        name: v.optional(v.string()),
        lastMessageId: v.optional(v.id("messages")),
    }),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        unreadCount: v.number(),
        lastSeenMessageId: v.optional(v.id("messages")),
    }).index("by_conversationId_userId", ["conversationId", "userId"])
        .index("by_userId", ["userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        type: v.string(), // "text", "image", etc.
        isDeleted: v.optional(v.boolean()),
        reactions: v.optional(v.array(v.object({
            emoji: v.string(),
            userId: v.id("users"),
        }))),
    })
        .index("by_conversationId", ["conversationId"]),

    presence: defineTable({
        userId: v.id("users"),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        updatedAt: v.number(),
    }).index("by_conversationId_userId", ["conversationId", "userId"]),
});
