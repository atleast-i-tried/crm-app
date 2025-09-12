"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Users, ShoppingCart, Mail, Trophy } from "lucide-react";
import { toast } from "sonner";

/**
 * DashboardHome
 * - Replaced top-row "New Customers" with "Total Customers".
 * - Removed the left-column "Total Customers" card.
 * - Hook order fixed previously: all hooks run before any early returns.
 */

function StatCard({ title, value, subtitle, icon, trend }) {
  const trendColor =
    trend?.tone === "positive"
      ? "bg-green-50 text-green-700 ring-green-100"
      : trend?.tone === "negative"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-slate-50 text-slate-700 ring-slate-100";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-lg p-5 transform transition-transform hover:scale-[1.02]">
      <div className="pointer-events-none absolute -top-10 -right-20 h-40 w-40 opacity-10 blur-2xl bg-gradient-to-br from-blue-400 to-violet-400 group-hover:opacity-20 transition-opacity" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-xs font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
        </div>
        <div className="ml-4 flex flex-col items-end space-y-2">
          <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
            {icon}
          </div>
          {trend && (
            <div className={`text-[11px] font-semibold px-2 py-1 rounded-full ring-1 ${trendColor}`}>
              {trend.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopCustomerCard({ topCustomer }) {
  const hasData = Boolean(topCustomer?.id);
  const formattedRevenue = hasData ? `₹${topCustomer.revenue.toLocaleString()}` : "₹0";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 shadow-lg p-5 transform transition hover:scale-[1.02]">
      <div className="pointer-events-none absolute -left-10 -bottom-6 h-36 w-36 opacity-8 blur-2xl bg-gradient-to-tr from-amber-300 to-orange-400 group-hover:opacity-15 transition-opacity" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-xs font-medium text-slate-500">Top Customer</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800 font-semibold shadow-sm">
              {hasData
                ? topCustomer.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "—"}
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">{hasData ? topCustomer.name : "No customers"}</div>
              <div className="text-xs text-slate-400">{hasData ? `${topCustomer.ordersCount} orders` : "No orders yet"}</div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
              <Trophy className="h-4 w-4 text-amber-700" />
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Contribution</div>
            <div className="text-lg font-bold">{formattedRevenue}</div>
            {hasData && (
              <div className="mt-1 text-[11px] font-semibold px-2 py-1 inline-block rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-100">
                {((topCustomer.revenue / Math.max(topCustomer.totalRevenue, 1)) * 100).toFixed(1)}% of total
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    customers: [],
    orders: [],
    campaigns: [],
    logs: [],
  });

  const displayName = session?.user?.name ?? session?.user?.email ?? "User";

  const fetchAllData = async () => {
    try {
      const [customersRes, ordersRes, campaignsRes, logsRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
        fetch("/api/campaigns"),
        fetch("/api/logs"),
      ]);

      if (!customersRes.ok) throw new Error("Failed to fetch customers");
      if (!ordersRes.ok) throw new Error("Failed to fetch orders");
      if (!campaignsRes.ok) throw new Error("Failed to fetch campaigns");
      if (!logsRes.ok) throw new Error("Failed to fetch logs");

      const customersData = await customersRes.json();
      const ordersData = await ordersRes.json();
      const campaignsData = await campaignsRes.json();
      const logsData = await logsRes.json();

      setMetrics({
        customers: customersData,
        orders: ordersData,
        campaigns: campaignsData,
        logs: logsData,
      });
    } catch (error) {
      toast.error("An error occurred while fetching dashboard data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // CHART DATA
  const chartData = useMemo(() => {
    const recentCampaigns = metrics.campaigns
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return recentCampaigns.map((campaign) => {
      const relatedLogs = metrics.logs.filter((log) => log.campaign?._id === campaign._id);
      const sent = relatedLogs.filter((log) => log.status === "SENT").length;
      const failed = relatedLogs.length - sent;
      return {
        name: campaign.name,
        sent,
        failed,
      };
    });
  }, [metrics]);

  // totalRevenue
  const totalRevenue = useMemo(() => {
    return metrics.orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [metrics.orders]);

  // TOP CUSTOMER
  const topCustomer = useMemo(() => {
    if (!metrics.orders.length || !metrics.customers.length) return null;

    const map = new Map();
    for (const order of metrics.orders) {
      let cid = undefined;
      if (order.customer && typeof order.customer === "object") {
        cid = order.customer._id ?? order.customer.id ?? undefined;
      }
      if (!cid && (order.customerId || order.customer_id)) {
        cid = order.customerId ?? order.customer_id;
      }
      cid = cid ?? "_unknown_";

      const prev = map.get(cid) ?? { revenue: 0, ordersCount: 0 };
      prev.revenue += order.amount || 0;
      prev.ordersCount += 1;
      map.set(cid, prev);
    }

    let best = { id: null, revenue: 0, ordersCount: 0, name: null };
    for (const [id, stats] of map.entries()) {
      const cust = metrics.customers.find((c) => c._id === id || c.id === id);
      const name = cust ? (cust.name ?? cust.fullName ?? cust.email ?? "Customer") : id === "_unknown_" ? "Unknown" : id;
      if (stats.revenue > best.revenue) {
        best = { id, revenue: stats.revenue, ordersCount: stats.ordersCount, name };
      }
    }

    if (best.id === null) return null;
    return { ...best, totalRevenue: totalRevenue || 0 };
  }, [metrics.orders, metrics.customers, totalRevenue]);

  // EARLY RETURNS
  if (status === "loading" || loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-60 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-[150px] rounded-2xl" />
          <Skeleton className="h-[150px] rounded-2xl" />
          <Skeleton className="h-[150px] rounded-2xl" />
        </div>
        <Separator className="my-8" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Welcome, <span className="font-semibold">{displayName}</span>
          </p>
        </div>
        <Link href="/dashboard/campaigns" passHref>
          <Button className="bg-blue-600 hover:bg-blue-700 transition">
            <Mail className="h-4 w-4 mr-2" /> Launch New Campaign
          </Button>
        </Link>
      </div>

      <Separator className="my-6" />

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue}`}
          subtitle="Trending up this month — Visitors for the last 6 months"
          icon={<svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none"><path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          trend={{ text: "+12.5%", tone: "positive" }}
        />

        {/* Replaced: show Total Customers in top row */}
        <StatCard
          title="Total Customers"
          value={metrics.customers.length ? metrics.customers.length : 0}
          subtitle="Count of registered users in the CRM"
          icon={<Users className="h-5 w-5 text-slate-600" />}
          trend={{ text: "Stable", tone: "neutral" }}
        />

        <TopCustomerCard topCustomer={topCustomer} />

        <StatCard
          title="Growth Rate"
          value="4.5%"
          subtitle="Steady performance increase"
          icon={<svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none"><path d="M3 12h4l4-8 4 16 4-10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          trend={{ text: "+4.5%", tone: "neutral" }}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: removed the Total Customers card as requested */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl ring-1 ring-slate-100 shadow-lg">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="p-2 bg-slate-50 rounded-md"><ShoppingCart className="h-4 w-4 text-slate-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue}</div>
              <p className="text-xs text-slate-400">Total revenue from all orders</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl ring-1 ring-slate-100 shadow-lg">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <div className="p-2 bg-slate-50 rounded-md"><Mail className="h-4 w-4 text-slate-600" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.campaigns.length}</div>
              <p className="text-xs text-slate-400">Total campaigns launched</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart column */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl ring-1 ring-slate-100 shadow-xl overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Recent Campaign Performance</CardTitle>
                  <p className="text-sm text-slate-400">Delivery statistics for the last 5 campaigns.</p>
                </div>
                <div>
                  <Badge className="text-sm">Last 5</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="w-full h-96 p-4">
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.12} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      wrapperStyle={{ borderRadius: 8, boxShadow: "0 6px 18px rgba(15, 23, 42, 0.12)" }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="sent" fill="url(#gradSent)" stroke="#16a34a" name="Sent" fillOpacity={1} />
                    <Area type="monotone" dataKey="failed" fill="url(#gradFailed)" stroke="#dc2626" name="Failed" fillOpacity={1} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
