"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ChevronLeft,
  Home,
  Users,
  Mail,
  BarChart2,
  Database,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Orders", href: "/dashboard/orders", icon: Database },
  { name: "Logs", href: "/dashboard/logs", icon: BarChart2 },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Mail },
];

export default function Sidebar({ children }) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Your Name";
  const userImage =
    session?.user?.image || "https://placehold.co/40x40/0b66ff/FFFFFF?text=X";
  const pathName = usePathname();

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const prev = localStorage.getItem("xeno_sidebar_hidden");
    if (prev === "true") setHidden(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("xeno_sidebar_hidden", hidden ? "true" : "false");
  }, [hidden]);

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-slate-700">
      <AnimatePresence>
        {!hidden && (
          <motion.aside
            initial={{ x: -36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -36, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="flex flex-col w-72 p-5 bg-white border-r border-slate-200 shadow-sm rounded-tr-2xl rounded-br-2xl"
            aria-label="Main sidebar"
          >
            {/* Brand */}
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: "linear-gradient(135deg,#f2f8ff,#eef6ff)",
                  }}
                >
                  {/* simple icon (keeps theme clean) */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 12h18M12 3v18"
                      stroke="#0b66ff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    xenoCRM
                  </h3>
                  <p className="text-xs text-slate-500">Mini CRM</p>
                </div>
              </Link>

              <div>
                <button
                  onClick={() => setHidden(true)}
                  className="p-2 rounded-md hover:bg-slate-50 transition"
                  aria-label="Collapse sidebar"
                  title="Collapse"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-900" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6 flex-1 overflow-y-auto py-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 uppercase">
                  Home
                </h4>

                <div className="flex flex-col gap-2 mt-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathName === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-900 hover:bg-slate-50 hover:text-blue-600"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-md ${
                            isActive ? "bg-white/10" : "bg-transparent"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                            }`}
                            aria-hidden="true"
                          />
                        </div>

                        {/* match Dashboard text sizing */}
                        <span className="truncate text-sm font-medium">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={userImage}
                    alt="User Avatar"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white bg-green-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2 rounded-md text-slate-700 hover:bg-slate-50"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* main content area */}
      <motion.main className="flex-1 flex flex-col overflow-auto transition-all duration-300 ease-out">
        {children}
      </motion.main>

      {/* Collapsed mini button */}
      <AnimatePresence>
        {hidden && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="absolute top-4 left-4"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={() => setHidden(false)}
              className="bg-white border shadow-sm"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4 text-blue-600" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
