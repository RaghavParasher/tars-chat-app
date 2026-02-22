"use strict";
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Search, MessageSquare, Users } from "lucide-react";

export function Sidebar({ onSelectConversation }: { onSelectConversation: (id: any) => void }) {
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useUser();
    const dbUser = useQuery(api.users.me, user ? { clerkId: user.id } : "skip");
    const allUsers = useQuery(api.users.getUsers);
    const conversations = useQuery(api.conversations.get, dbUser ? { userId: dbUser._id } : "skip");

    const filteredUsers = allUsers?.filter(u =>
        u.clerkId !== user?.id &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="w-80 h-full border-r flex flex-col bg-white">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                <h1 className="font-bold text-xl text-indigo-600">Tars Chat</h1>
                <UserButton afterSignOutUrl="/" />
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                    <div className="px-2">
                        <h2 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                            <Users className="w-3 h-3 mr-1" /> People
                        </h2>
                        {filteredUsers?.map((u) => (
                            <button
                                key={u._id}
                                onClick={() => onSelectConversation(u)}
                                className="w-full flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <img src={u.imageUrl} className="w-10 h-10 rounded-full mr-3 border" alt={u.name} />
                                <div className="text-left">
                                    <p className="font-medium text-sm text-slate-900">{u.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="px-2">
                        <h2 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" /> Conversations
                        </h2>
                        {conversations?.map((c: any) => (
                            <button
                                key={c._id}
                                onClick={() => onSelectConversation(c)}
                                className="w-full flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <img src={c.otherParticipant?.imageUrl} className="w-10 h-10 rounded-full mr-3 border" alt={c.otherParticipant?.name} />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-sm text-slate-900">{c.otherParticipant?.name}</p>
                                        {c.lastMessage && (
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(c.lastMessage._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                        {c.lastMessage?.content || "No messages yet"}
                                    </p>
                                </div>
                                {c.unreadCount > 0 && (
                                    <div className="ml-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {c.unreadCount}
                                    </div>
                                )}
                            </button>
                        ))}
                        {conversations?.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-sm italic">
                                Search for users to start a chat!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
