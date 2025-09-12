"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function LogsPage() {
  const { status } = useSession();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    campaignName: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState(null);
  const logsPerPage = 15;

  // Summary dialog state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchLogs();
    }
  }, [status]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  // group logs by campaign name
  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach((log) => {
      const campaignName = log.campaign?.name || "Unknown Campaign";
      if (!groups[campaignName]) {
        groups[campaignName] = {
          name: campaignName,
          logs: [],
        };
      }
      groups[campaignName].logs.push(log);
    });

    // apply filters
    const filteredGroups = Object.values(groups).filter((group) => {
      const campaignMatch = group.name
        .toLowerCase()
        .includes(filters.campaignName.toLowerCase());
      const statusMatch = filters.status
        ? group.logs.some((log) =>
            (log.status || "")
              .toString()
              .toLowerCase()
              .includes(filters.status.toLowerCase())
          )
        : true;
      return campaignMatch && statusMatch;
    });

    // sort by most recent (by createdAt of first log)
    filteredGroups.sort((a, b) => {
      const aDate = new Date(a.logs?.[0]?.createdAt || 0).getTime();
      const bDate = new Date(b.logs?.[0]?.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return filteredGroups;
  }, [logs, filters]);

  const totalPages = Math.max(1, Math.ceil(groupedLogs.length / logsPerPage));
  const currentGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    return groupedLogs.slice(startIndex, endIndex);
  }, [groupedLogs, currentPage]);

  const handleCampaignClick = (campaignName) => {
    const campaignLogs = logs.filter(
      (log) => (log.campaign?.name || "Unknown Campaign") === campaignName
    );
    setSelectedCampaignLogs(campaignLogs);
  };

  // Helper to extract numeric spend from a log.customer object
  function getCustomerSpendFromLog(log) {
    const c = log.customer || {};
    const possibleKeys = ["totalSpent", "total_spent", "spend", "total_spend", "lifetime_spend", "lifetimeSpend", "spend_amount"];
    for (const k of possibleKeys) {
      if (c[k] !== undefined && c[k] !== null) {
        const n = Number(c[k]);
        if (!Number.isNaN(n)) return n;
      }
    }
    // try nested orders sum if present
    if (Array.isArray(c.orders)) {
      const sum = c.orders.reduce((s, o) => s + Number(o?.amount || 0), 0);
      if (!Number.isNaN(sum) && sum > 0) return sum;
    }
    return null;
  }

  async function handleSummarizeCampaign(group) {
    setIsSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryText("");
    setSummaryError("");

    try {
      const logsForCampaign = group.logs || [];

      const sent = logsForCampaign.filter((l) => String(l.status).toUpperCase() === "SENT").length;
      const failed = logsForCampaign.length - sent;
      const audienceSize = logsForCampaign.length;

      // compute high-value customers (> 10k)
      const highValueThreshold = 10000;
      const highValueLogs = logsForCampaign.filter((l) => {
        const spend = getCustomerSpendFromLog(l);
        return typeof spend === "number" && spend > highValueThreshold;
      });
      const highValueSent = highValueLogs.filter((l) => String(l.status).toUpperCase() === "SENT").length;
      const highValueRate = highValueLogs.length > 0 ? Math.round((highValueSent / highValueLogs.length) * 100) : null;

      // Also compute top vendor response examples (if any)
      const vendorResponses = logsForCampaign
        .map((l) => l.vendorResponse)
        .filter(Boolean)
        .slice(0, 3);

      const stats = {
        audienceSize,
        sent,
        failed,
        highValueGroupCount: highValueLogs.length,
        highValueDeliveryRate: highValueRate !== null ? `${highValueRate}%` : "N/A",
        vendorResponsesExample: vendorResponses,
      };

      const res = await fetch("/api/ai/summarize-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, campaignName: group.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to generate summary");
      }

      const data = await res.json();
      setSummaryText(data.summary || "⚠️ No summary returned.");
    } catch (err) {
      console.error(err);
      setSummaryError(err?.message || "Error generating summary");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-60" />
        </div>
        <Separator className="my-6" />
        <div className="flex space-x-2 mb-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
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

  if (selectedCampaignLogs) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Details for "
            {selectedCampaignLogs[0]?.campaign?.name || "Unknown Campaign"}"
          </h1>
          <Button onClick={() => setSelectedCampaignLogs(null)}>
            Back to All Campaigns
          </Button>
        </div>
        <Separator className="my-6" />
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vendor Response</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCampaignLogs.map((l) => (
              <TableRow key={l._id}>
                <TableCell className="font-medium">
                  {l.customer?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={l.status === "SENT" ? "success" : "destructive"}
                  >
                    {l.status}
                  </Badge>
                </TableCell>
                <TableCell>{l.vendorResponse}</TableCell>
                <TableCell>
                  {new Date(l.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaign Logs</h1>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Campaign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter campaign name..."
              name="campaignName"
              value={filters.campaignName}
              onChange={handleFilterChange}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Status
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter status..."
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : currentGroups.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead>Campaign Name</TableHead>
                <TableHead>Audience Size</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentGroups.map((group) => {
                const sentCount = group.logs.filter((l) => String(l.status).toUpperCase() === "SENT").length;
                const failedCount = group.logs.length - sentCount;
                return (
                  <TableRow
                    key={group.name}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                  >
                    <TableCell className="font-medium" onClick={() => handleCampaignClick(group.name)}>
                      {group.name}
                    </TableCell>
                    <TableCell onClick={() => handleCampaignClick(group.name)}>{group.logs.length}</TableCell>
                    <TableCell onClick={() => handleCampaignClick(group.name)}>
                      <Badge variant="success">{sentCount}</Badge>
                    </TableCell>
                    <TableCell onClick={() => handleCampaignClick(group.name)}>
                      <Badge variant="destructive">{failedCount}</Badge>
                    </TableCell>
                    <TableCell onClick={() => handleCampaignClick(group.name)}>
                      {new Date(group.logs[0].createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Button size="sm" onClick={() => handleSummarizeCampaign(group)}>
                        Summary
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={i + 1 === currentPage}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No logs found. Launch a campaign to see logs.
        </div>
      )}

      {/* Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Summary</DialogTitle>
            <DialogDescription>
              AI-generated summary for the selected campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {summaryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : summaryError ? (
              <div className="text-red-500">{summaryError}</div>
            ) : (
              <div className="whitespace-pre-wrap">{summaryText}</div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={() => setIsSummaryOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
