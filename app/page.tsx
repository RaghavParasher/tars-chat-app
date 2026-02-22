"use strict";
"use client";

import { Sidebar } from "@/components/chat/sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { useState } from "react";
import { MessageSquareDashed } from "lucide-react";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar onSelectConversation={setSelectedConversation} />

      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f8faff] text-slate-400 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <MessageSquareDashed className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Select a friend to start chatting</h2>
          <p className="max-w-xs text-sm">
            Search for people by name or email in the sidebar to start a new conversation.
          </p>
        </div>
      )}
    </main>
  );
}
