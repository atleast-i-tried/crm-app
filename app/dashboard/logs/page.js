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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function LogsPage() {
  const { status } = useSession();

  // data
  const [logs, setLogs] = useState([]);
  const [campaignsMap, setCampaignsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [filters, setFilters] = useState({ campaignName: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 11; // per your request

  // selected campaign details
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState(null);

  // summary dialog state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");

  // delete flow
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ---------- Helpers ----------
  function extractEmail(value) {
    if (!value) return null;
    if (typeof value === "string") {
      return value.includes("@") ? value : null;
    }
    if (typeof value === "object") {
      if (typeof value.email === "string" && value.email.includes("@")) return value.email;
      if (typeof value.createdBy === "string" && value.createdBy.includes("@")) return value.createdBy;
      if (typeof value.createdBy === "object" && typeof value.createdBy.email === "string" && value.createdBy.email.includes("@"))
        return value.createdBy.email;
    }
    return null;
  }

  function getCustomerSpendFromLog(log) {
    const c = log.customer || {};
    const possibleKeys = ["totalSpent", "total_spent", "spend", "total_spend", "lifetime_spend", "lifetimeSpend", "spend_amount"];
    for (const k of possibleKeys) {
      if (c[k] !== undefined && c[k] !== null) {
        const n = Number(c[k]);
        if (!Number.isNaN(n)) return n;
      }
    }
    if (Array.isArray(c.orders)) {
      const sum = c.orders.reduce((s, o) => s + Number(o?.amount || 0), 0);
      if (!Number.isNaN(sum) && sum > 0) return sum;
    }
    return null;
  }

  // ---------- Fetch & normalize ----------
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [logsRes, campaignsRes] = await Promise.all([fetch("/api/logs"), fetch("/api/campaigns")]);

      if (!logsRes.ok) throw new Error("Failed to fetch logs");
      if (!campaignsRes.ok) throw new Error("Failed to fetch campaigns");

      const [logsData, campaignsData] = await Promise.all([logsRes.json(), campaignsRes.json()]);

      // build campaign map with normalized _creatorEmail
      const map = {};
      if (Array.isArray(campaignsData)) {
        campaignsData.forEach((c) => {
          if (c && c._id) {
            const creatorEmail =
              extractEmail(c.createdBy) || extractEmail(c.createdByEmail) || extractEmail(c.creator) || null;
            map[String(c._id)] = { ...c, _creatorEmail: creatorEmail };
          }
        });
      }

      // normalize logs: ensure .campaign is an object with name, _id, createdByEmail
      const normalized = (Array.isArray(logsData) ? logsData : []).map((l) => {
        const out = { ...l };
        let campaignObj = null;

        if (out.campaign && typeof out.campaign === "object") {
          campaignObj = {
            _id: out.campaign._id || (out.campaign?._id ? String(out.campaign._id) : null),
            name: out.campaign.name || out.campaign.campaignName || out.campaignName || "Unknown Campaign",
            createdByEmail:
              extractEmail(out.campaign.createdBy) ||
              extractEmail(out.campaign.createdByEmail) ||
              extractEmail(out.createdBy) ||
              null,
            ...out.campaign,
          };

          const id = campaignObj._id && String(campaignObj._id);
          if (id && map[id] && map[id]._creatorEmail) campaignObj.createdByEmail = map[id]._creatorEmail;
        } else if (out.campaign) {
          // campaign may be an id string
          const id = String(out.campaign);
          const found = map[id];
          campaignObj = {
            _id: id,
            name: found?.name || out.campaignName || "Unknown Campaign",
            createdByEmail: found?._creatorEmail || extractEmail(out.createdBy) || null,
            ...(found || {}),
          };
        } else {
          const maybeId = out.campaignId || (out.campaign && out.campaign._id) || null;
          campaignObj = {
            _id: maybeId || null,
            name: out.campaignName || "Unknown Campaign",
            createdByEmail: extractEmail(out.createdBy) || null,
          };
          if (maybeId && map[String(maybeId)]) {
            campaignObj = { ...map[String(maybeId)], createdByEmail: map[String(maybeId)]._creatorEmail || campaignObj.createdByEmail };
          }
        }

        campaignObj.createdByEmail = campaignObj.createdByEmail || extractEmail(out.createdBy) || null;
        out.campaign = campaignObj;
        return out;
      });

      setCampaignsMap(map);
      setLogs(normalized);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---------- Filters / grouping ----------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // group logs by campaign name (normalized)
  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach((log) => {
      const campaignName = log.campaign?.name || log.campaignName || "Unknown Campaign";
      const campaignId = log.campaign?._id || log.campaignId || null;
      const createdBy = log.campaign?.createdByEmail || extractEmail(log.campaign?.createdBy) || extractEmail(log.createdBy) || "Unknown";

      if (!groups[campaignName]) {
        groups[campaignName] = { name: campaignName, id: campaignId, createdBy, logs: [] };
      }
      groups[campaignName].logs.push(log);
      // prefer first non-unknown creator
      if (groups[campaignName].createdBy === "Unknown" && createdBy && createdBy !== "Unknown") {
        groups[campaignName].createdBy = createdBy;
      }
    });

    // apply campaignName filter only (status filter removed by request)
    const filtered = Object.values(groups).filter((g) => g.name.toLowerCase().includes(filters.campaignName.toLowerCase()));

    // sort by most recent log in group
    filtered.sort((a, b) => {
      const aDate = new Date(a.logs?.[0]?.createdAt || 0).getTime();
      const bDate = new Date(b.logs?.[0]?.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return filtered;
  }, [logs, filters]);

  const totalPages = Math.max(1, Math.ceil(groupedLogs.length / logsPerPage));
  const currentGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return groupedLogs.slice(startIndex, startIndex + logsPerPage);
  }, [groupedLogs, currentPage]);

  // ---------- interactions ----------
  const handleCampaignClick = (campaignName) => {
    const campaignLogs = logs.filter((log) => (log.campaign?.name || log.campaignName || "Unknown Campaign") === campaignName);
    setSelectedCampaignLogs(campaignLogs);
    // reset summary state when entering details
    setSummaryText("");
    setSummaryError("");
  };

  // delete flow
  const confirmDeleteCampaign = (group) => {
    setCampaignToDelete({ id: group.id, name: group.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to delete campaign");
      }
      toast.success("Campaign deleted");
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      // if we were viewing this campaign's details, go back to list
      if (selectedCampaignLogs && selectedCampaignLogs[0]?.campaign?._id === campaignToDelete.id) {
        setSelectedCampaignLogs(null);
      }
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Error deleting campaign");
    } finally {
      setDeleting(false);
    }
  };

  // summary generation (calls your /api/ai/summarize-performance)
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

      const highValueThreshold = 10000;
      const highValueLogs = logsForCampaign.filter((l) => {
        const spend = getCustomerSpendFromLog(l);
        return typeof spend === "number" && spend > highValueThreshold;
      });
      const highValueSent = highValueLogs.filter((l) => String(l.status).toUpperCase() === "SENT").length;
      const highValueRate = highValueLogs.length > 0 ? Math.round((highValueSent / highValueLogs.length) * 100) : null;

      const vendorResponses = logsForCampaign.map((l) => l.vendorResponse).filter(Boolean).slice(0, 3);

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

  // ---------- UI states ----------
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

  // ---------- Details view when a campaign is selected ----------
  if (selectedCampaignLogs) {
    const campaignName = selectedCampaignLogs[0]?.campaign?.name || selectedCampaignLogs[0]?.campaignName || "Unknown Campaign";
    const createdByEmail =
      selectedCampaignLogs[0]?.campaign?.createdByEmail ||
      extractEmail(selectedCampaignLogs[0]?.campaign?.createdBy) ||
      extractEmail(selectedCampaignLogs[0]?.createdBy) ||
      "Unknown";
    const groupForSummary = { name: campaignName, logs: selectedCampaignLogs };

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Details for "{campaignName}"</h1>
            <div className="text-sm text-gray-500 mt-1">Created by: {createdByEmail}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setSelectedCampaignLogs(null)}>Back to All Campaigns</Button>
            <Button variant="outline" onClick={() => handleSummarizeCampaign(groupForSummary)}>
              Campaign Summary
            </Button>
          </div>
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
                <TableCell className="font-medium">{l.customer?.name || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant={String(l.status).toUpperCase() === "SENT" ? "success" : "destructive"}>
                    {l.status || "Unknown"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xl truncate">{l.vendorResponse || "-"}</TableCell>
                <TableCell>{l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Summary Dialog */}
        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Campaign Summary</DialogTitle>
              <DialogDescription>AI-generated summary for the selected campaign.</DialogDescription>
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

  // ---------- Main list view ----------
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
            <Input placeholder="Filter campaign name..." name="campaignName" value={filters.campaignName} onChange={handleFilterChange} />
          </PopoverContent>
        </Popover>

        {/* status filter intentionally removed per request */}
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
                <TableHead>Created By</TableHead>
                <TableHead>Audience Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentGroups.map((group) => {
                const createdBy = group.createdBy || "Unknown";
                return (
                  <TableRow
                    key={group.name}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                    onClick={() => handleCampaignClick(group.name)}
                  >
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{createdBy}</TableCell>
                    <TableCell>{group.logs.length}</TableCell>
                    <TableCell>{group.logs?.[0]?.createdAt ? new Date(group.logs[0].createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => confirmDeleteCampaign(group)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={() => setCurrentPage(i + 1)} isActive={i + 1 === currentPage}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Campaign</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{campaignToDelete?.name}</strong>? This will also delete all associated logs. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteCampaign} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">No logs found. Launch a campaign to see logs.</div>
      )}
    </div>
  );
}
