"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function DashboardHome() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? "User";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard Overview</h1>
          <p className="text-sm text-slate-600">
            Welcome, <span className="font-medium">{displayName}</span>
          </p>
        </div>

        <div>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div>
        <p>Welcome! Use the sidebar to manage Customers, Orders, Campaigns, and Logs.</p>
        {/* Other dashboard content goes here */}
      </div>
    </div>
  );
}
