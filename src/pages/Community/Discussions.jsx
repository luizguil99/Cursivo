import React from "react";
import LiveChat from "@/components/community/LiveChat";
import OnlineUsers from "@/components/community/OnlineUsers";
import ChatLayout from "@/components/layouts/ChatLayout";

function Discussions() {
  return (
    <ChatLayout>
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-sm rounded-lg shadow-lg border">
          <OnlineUsers />
          <div className="flex-1 border-l">
            <LiveChat />
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}

export default Discussions;
