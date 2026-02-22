"use strict";
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Image as ImageIcon, MoreVertical } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";

export function ChatArea({ conversation, onBack }: { conversation: any, onBack?: () => void }) {
    const { user } = useUser();
    const dbUser = useQuery(api.users.me, user ? { clerkId: user.id } : "skip");
    const [content, setContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // If conversation is actually a user (from search), we need to create/get the conversation first
    const createConversation = useMutation(api.conversations.create);
    const [activeConversationId, setActiveConversationId] = useState<any>(
        conversation._id?.startsWith("users") ? null : conversation._id
    );

    useEffect(() => {
        if (conversation._id?.startsWith("users") && dbUser) {
            const initConv = async () => {
                const id = await createConversation({
                    participants: [dbUser._id, conversation._id],
                    isGroup: false
                });
                setActiveConversationId(id);
            };
            initConv();
        } else {
            setActiveConversationId(conversation._id);
        }
    }, [conversation, dbUser, createConversation]);

    const messages = useQuery(api.messages.getByConversation,
        activeConversationId ? { conversationId: activeConversationId } : "skip"
    );

    const sendMessage = useMutation(api.messages.send);
    const setTyping = useMutation(api.messages.setTypingIndicator);
    const markAsRead = useMutation(api.messages.markAsRead);
    const deleteMessage = useMutation(api.messages.remove);

    const typingIndicators = useQuery(api.messages.getTypingIndicators,
        activeConversationId ? { conversationId: activeConversationId } : "skip"
    );

    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        if (activeConversationId && dbUser) {
            markAsRead({ conversationId: activeConversationId, userId: dbUser._id });
        }
    }, [activeConversationId, dbUser, markAsRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !dbUser || !activeConversationId) return;

        await sendMessage({
            conversationId: activeConversationId,
            senderId: dbUser._id,
            content: content.trim(),
            type: "text",
        });
        setContent("");
        setTyping({ conversationId: activeConversationId, userId: dbUser._id, isTyping: false });
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isAtBottom);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
        if (dbUser && activeConversationId) {
            setTyping({ conversationId: activeConversationId, userId: dbUser._id, isTyping: e.target.value.length > 0 });
        }
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const formatTimestamp = (time: number) => {
        const date = new Date(time);
        if (isToday(date)) return format(date, "h:mm a");
        if (isThisYear(date)) return format(date, "MMM d, h:mm a");
        return format(date, "MMM d, yyyy, h:mm a");
    };

    if (!activeConversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <div className="animate-pulse">Loading conversation...</div>
            </div>
        );
    }

    const otherUser = conversation.otherParticipant || conversation;
    const isTyping = typingIndicators?.some(ti => ti.userId !== dbUser?._id);

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden mr-4 text-slate-600">
                            ←
                        </button>
                    )}
                    <img src={otherUser.imageUrl} className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm" alt={otherUser.name} />
                    <div>
                        <h2 className="font-semibold text-slate-800 text-sm md:text-base">{otherUser.name}</h2>
                        <p className="text-[10px] text-green-500 font-medium flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" /> Online
                        </p>
                    </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faff]" onScroll={handleScroll}>
                {messages?.map((m: any) => {
                    const isMe = m.senderId === dbUser?._id;
                    return (
                        <div key={m._id} className={`flex group ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] md:max-w-[70%] p-3 rounded-2xl shadow-sm text-sm relative ${isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                                }`}>
                                {m.isDeleted ? (
                                    <span className="italic opacity-70">This message was deleted</span>
                                ) : (
                                    <>
                                        {m.content}
                                        {isMe && (
                                            <button
                                                onClick={() => deleteMessage({ id: m._id })}
                                                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <MoreVertical className="w-3 h-3" />
                                            </button>
                                        )}
                                    </>
                                )}
                                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                                    {formatTimestamp(m._creationTime)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {showScrollButton && (
                <button
                    onClick={() => scrollRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="absolute bottom-20 right-8 bg-white border border-slate-200 shadow-xl rounded-full px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50 transition-all z-20 flex items-center animate-bounce"
                >
                    ↓ New messages
                </button>
            )}

            <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center gap-2">
                <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                </button>
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 py-2 px-4 bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    value={content}
                    onChange={handleInputChange}
                />
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
