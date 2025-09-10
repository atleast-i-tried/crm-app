"use client";

import Sidebar from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
