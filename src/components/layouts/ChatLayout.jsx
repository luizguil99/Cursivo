import React from "react";
import TopNav from "@/components/TopNav";
import CommunitySidebar from "@/components/community/CommunitySidebar";

function ChatLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="flex h-[calc(100vh-4rem)]">
        <CommunitySidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export default ChatLayout;
