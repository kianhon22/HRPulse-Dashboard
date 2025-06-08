"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";
import { UserProfile } from "@/components/user-profile";
import { Suspense } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Always start collapsed

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex min-h-screen">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <MainContent isCollapsed={isCollapsed}>{children}</MainContent>
        <UserProfile />
      </div>
    </Suspense>
  );
}