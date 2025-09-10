"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Users,
  Mail,
  BarChart2,
  Database,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar({ children }) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Your Name";

  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const prevHidden = localStorage.getItem("xeno_sidebar_hidden");
    const prevCollapsed = localStorage.getItem("xeno_sidebar_collapsed");
    if (prevHidden === "true") setHidden(true);
    if (prevCollapsed === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("xeno_sidebar_hidden", hidden ? "true" : "false");
  }, [hidden]);

  useEffect(() => {
    localStorage.setItem("xeno_sidebar_collapsed", collapsed ? "true" : "false");
  }, [collapsed]);

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      children: [
        { id: "customers", label: "Customers", icon: Users, href: "/dashboard/customers" },
        { id: "orders", label: "Orders", icon: Database, href: "/dashboard/orders" },
        { id: "campaigns", label: "Campaigns", icon: Mail, href: "/dashboard/campaigns" },
        { id: "logs", label: "Logs", icon: BarChart2, href: "/dashboard/logs" },
      ],
    },
  ];

  const listItem = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {!hidden && (
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className={`flex flex-col p-4 shadow-xl bg-gradient-to-b from-white to-white/95 border-r border-slate-100 transition-all duration-300 ease-out ${
              collapsed ? "w-20" : "w-72"
            }`}
            style={{ backdropFilter: "blur(6px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white shadow-md">
                  X
                </div>
                {!collapsed && (
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">XenoCRM</h3>
                    <p className="text-xs text-slate-500">Mini CRM · Dashboard</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCollapsed((s) => !s)}
                  className="p-2 rounded-md hover:bg-slate-100 transition"
                >
                  <ChevronLeft
                    className={`h-4 w-4 text-slate-700 transform ${collapsed ? "rotate-180" : "rotate-0"}`}
                  />
                </button>
                <button
                  onClick={() => setHidden(true)}
                  className="p-2 rounded-md hover:bg-slate-100 transition"
                >
                  <X className="h-4 w-4 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6 flex-1 overflow-y-auto py-2">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <motion.li key={item.id} variants={listItem}>
                    <a
                      href={item.href}
                      className={`flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-all ${
                        collapsed ? "justify-center" : ""
                      } font-semibold text-slate-800`}
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </a>

                    {/* Nested items */}
                    {!collapsed && item.children && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <motion.li key={child.id} variants={listItem}>
                            <a
                              href={child.href}
                              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-all text-sm text-slate-700"
                            >
                              <child.icon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className={`flex items-center gap-3 ${collapsed ? "flex-col" : ""}`}>
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium shadow-sm">
                  {userName?.charAt(0) || "U"}
                </div>
                {!collapsed && (
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">{userName}</div>
                    <div className="text-xs text-slate-500">Admin</div>
                  </div>
                )}
                <Button
                  size="sm"
                  className="h-9 px-3 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Logout</span>}
                  </div>
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        className="flex-1 flex flex-col overflow-auto transition-all duration-300 ease-out"
        style={{ marginLeft: hidden ? 0 : collapsed ? 80 : 288 }}
      >
        {children}
      </motion.main>

      {/* Mobile toggle button */}
      <div className="lg:hidden">
        <button
          onClick={() => setHidden((s) => !s)}
          className="fixed left-4 bottom-6 z-50 p-3 rounded-full shadow-xl bg-blue-600 text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
