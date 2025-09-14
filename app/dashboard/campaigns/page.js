"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, EllipsisVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { motion, AnimatePresence } from "framer-motion";

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create-campaign state
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    objective: "",
    filters: [],
    logic: "AND",
  });
  const [audienceSize, setAudienceSize] = useState(0);

  // AI
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Details dialog for recent campaigns
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Drawer toggle for recent campaigns (hidden by default)
  const [recentOpen, setRecentOpen] = useState(false);

  // Big-sized toast state (new)
  const [showBigToast, setShowBigToast] = useState(false);

  const filterOptions = [
    { label: "Min. Spend", key: "minSpend" },
    { label: "Min. Visits", key: "minVisits" },
    { label: "Inactive Days", key: "inactiveDays" },
  ];

  const applyFilters = (customerList, filters, logic) => {
    if (!filters || filters.length === 0) return customerList || [];

    return (customerList || []).filter((c) => {
      const results = filters.map((f) => {
        switch (f.key) {
          case "minSpend":
            return (c.totalSpend || 0) >= (Number(f.value) || 0);
          case "minVisits":
            return (c.visits || 0) >= (Number(f.value) || 0);
          case "inactiveDays":
            if (!f.value && f.value !== 0) return true;
            return (
              c.lastActive &&
              (new Date() - new Date(c.lastActive)) / (1000 * 60 * 60 * 24) >= Number(f.value)
            );
          default:
            return true;
        }
      });
      return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    });
  };

  const handleFilterChange = (index, key, value) => {
    const updated = [...newCampaign.filters];
    updated[index] = { ...updated[index], key, value };
    setNewCampaign({ ...newCampaign, filters: updated });
  };

  const handleLogicChange = (logic) => {
    setNewCampaign({ ...newCampaign, logic });
  };

  const handleAddFilter = () => {
    if (newCampaign.filters.length < 3) {
      setNewCampaign({
        ...newCampaign,
        filters: [...newCampaign.filters, { key: "minSpend", value: 0 }],
      });
    }
  };

  const handleRemoveFilter = (index) => {
    const updated = newCampaign.filters.filter((_, i) => i !== index);
    setNewCampaign({ ...newCampaign, filters: updated });
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, customersRes, logsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/customers"),
        fetch("/api/logs"),
      ]);

      if (!campaignsRes.ok) throw new Error("Failed to fetch campaigns");
      if (!customersRes.ok) throw new Error("Failed to fetch customers");
      if (!logsRes.ok) throw new Error("Failed to fetch logs");

      const campaignsData = await campaignsRes.json();
      const customersData = await customersRes.json();
      const logsData = await logsRes.json();

      setCampaigns(campaignsData || []);
      setCustomers(customersData || []);
      setLogs(logsData || []);

      // set audience size for current inline form filters
      const initialAudience = applyFilters(customersData, newCampaign.filters, newCampaign.logic);
      setAudienceSize(initialAudience.length);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching data.");
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

  useEffect(() => {
    const filtered = applyFilters(customers, newCampaign.filters, newCampaign.logic);
    setAudienceSize(filtered.length);
  }, [customers, newCampaign.filters, newCampaign.logic]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCampaign({ ...newCampaign, [name]: value });
  };

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    if (audienceSize === 0) {
      toast.error("Audience size is zero. Please adjust filters.");
      return;
    }
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCampaign,
          createdBy: session.user.email,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create campaign");
      }

      await fetchAllData();
      setNewCampaign({
        name: "",
        message: "",
        objective: "",
        filters: [],
        logic: "AND",
      });
      setAudienceSize(0);
      setAiSuggestions([]);

      // keep existing sonner toast
      toast.success("Campaign launched successfully!");

      // show the big-sized toast (new)
      setShowBigToast(true);
      // auto-dismiss after 4 seconds
      setTimeout(() => setShowBigToast(false), 4000);
    } catch (error) {
      toast.error(error.message || "Failed to create campaign");
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete campaign");
      }

      await fetchAllData();
      toast.success("Campaign deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete campaign");
    }
  };

  // confirm delete action handler
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setConfirmDeleteOpen(false);
    try {
      await handleDeleteCampaign(confirmDeleteId);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Normalize AI result into array
  const normalizeSuggestions = (raw) => {
    if (!raw && raw !== "") return [];
    if (Array.isArray(raw)) {
      return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof raw === "string") {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/^[\d\-\•\)\.\s]+/, "").trim())
        .filter(Boolean);
      if (lines.length > 0) return lines;
      const cleaned = raw.trim();
      if (cleaned) return [cleaned];
      return [];
    }
    return [String(raw)];
  };

  const getAiSuggestions = async () => {
    if (!newCampaign.objective) {
      toast.error("Please enter a campaign objective first.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: newCampaign.objective }),
      });

      if (!res.ok) {
        let errText = "Failed to get AI suggestions";
        try {
          const errBody = await res.json();
          errText = errBody?.error || errText;
        } catch (_) {}
        throw new Error(errText);
      }

      const data = await res.json();
      const suggestions = normalizeSuggestions(data?.suggestions ?? data?.result ?? "");
      setAiSuggestions(suggestions);
      if (suggestions.length === 0) {
        toast.error("AI returned no suggestions.");
      } else {
        toast.success("AI suggestions generated!");
      }
    } catch (error) {
      console.error("getAiSuggestions error:", error);
      toast.error(error.message || "Failed to get AI suggestions");
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const campaignStats = useMemo(() => {
    return (campaigns || []).map((campaign) => {
      const relatedLogs = (logs || []).filter((log) => log.campaign === campaign._id);
      const sentCount = relatedLogs.filter((log) => log.status === "SENT").length;
      const failedCount = relatedLogs.length - sentCount;
      const logsAudience = relatedLogs.length;

      const audienceFromFilters =
        campaign.filters && campaign.filters.length > 0
          ? applyFilters(customers, campaign.filters, campaign.logic || "AND").length
          : 0;

      const audienceSize = logsAudience > 0 ? logsAudience : audienceFromFilters;

      let successRate = 0;
      let failedRate = 0;

      if (logsAudience > 0) {
        successRate = audienceSize > 0 ? (sentCount / audienceSize) * 100 : 0;
        failedRate = audienceSize > 0 ? (failedCount / audienceSize) * 100 : 0;
      } else if (audienceFromFilters > 0) {
        successRate = 100;
        failedRate = 0;
      } else {
        successRate = 0;
        failedRate = 0;
      }

      return {
        ...campaign,
        audienceSize,
        sent: sentCount,
        failed: failedCount,
        successRate: successRate.toFixed(2),
        failedRate: failedRate.toFixed(2),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, logs, customers]);

  // derive recent 3 campaigns (most recent createdAt)
  const recentCampaigns = useMemo(() => {
    return [...(campaignStats || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  }, [campaignStats]);

  // Loading / auth UI
  if (status === "loading" || loading) {
    return (
      <div className="p-6 min-h-[480px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            role="status"
            aria-label="Loading dashboard"
            className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 w-12 h-12"
          />
          <span className="text-sm text-blue-600 font-medium"></span>
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

  // Main UI
  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">Create Campaign</h1>
          <div className="text-sm text-gray-500 mt-0.5">Design your audience, craft the message, and launch.</div>
        </div>

        {/* TOP-RIGHT: enlarged Recent Campaigns button (bigger, clearer) */}
        <div className="ml-4">
          <Button
            size="lg"
            className="flex items-center gap-3 px-4 py-2 rounded-md shadow-sm"
            onClick={() => setRecentOpen((v) => !v)}
            aria-expanded={recentOpen}
            aria-controls="recent-campaigns-drawer"
          >
            <EllipsisVertical className="h-5 w-5" />
            <span className="font-medium">Recent Campaigns</span>
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* FORM CARD (tighter spacing, stronger borders) */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 overflow-visible">
          <CardHeader className="px-4 py-0 border-b border-gray-300 dark:border-gray-700">
            <CardTitle className="text-base font-semibold">New Campaign</CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            <form onSubmit={handleAddCampaign} className="space-y-3">
              {/* NAME: label above input with minimal gap */}
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newCampaign.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 py-2 placeholder-gray-400"
                  placeholder="Campaign name (e.g., Spring Re-Engage)"
                />
              </div>

              {/* Audience Filters (compact panel) */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-600">Audience Filters</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Logic:</span>
                    <Button type="button" variant={newCampaign.logic === "AND" ? "default" : "outline"} onClick={() => handleLogicChange("AND")} size="sm">
                      AND
                    </Button>
                    <Button type="button" variant={newCampaign.logic === "OR" ? "default" : "outline"} onClick={() => handleLogicChange("OR")} size="sm">
                      OR
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {newCampaign.filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={filter.key}
                        onChange={(e) => handleFilterChange(index, e.target.value, filter.value)}
                        className="min-w-[140px] rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-50"
                      >
                        {filterOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        value={filter.value}
                        onChange={(e) => handleFilterChange(index, filter.key, Number(e.target.value))}
                        className="flex-1 rounded-md border border-gray-300 py-2"
                      />

                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveFilter(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="px-4 py-1 shadow-sm hover:shadow-md transition"
                      onClick={handleAddFilter}
                      disabled={newCampaign.filters.length >= 3}
                    >
                      + Add Filter
                    </Button>
                  </div>


                  <div className="text-center text-sm font-medium mt-2">
                    Audience Size: <Badge variant="secondary">{audienceSize}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Assistant card (compact) */}
              <Card className="shadow-md border border-gray-300 dark:border-gray-700">
                <CardHeader className="px-4 py-2">
                  <CardTitle className="text-md font-semibold">AI Message Assistant</CardTitle>
                </CardHeader>

                <CardContent className="p-3 space-y-3">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="objective" className="text-sm text-gray-600 mb-1">
                        Campaign Objective
                      </Label>
                      <Input
                        id="objective"
                        name="objective"
                        placeholder="e.g., 'bring back inactive users'"
                        value={newCampaign.objective}
                        onChange={handleInputChange}
                        className="rounded-md border border-gray-300 py-2 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <Button type="button" onClick={getAiSuggestions} disabled={aiLoading}>
                        {aiLoading ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                  </div>

                  {aiSuggestions && aiSuggestions.length > 0 && (
                    <div className="grid gap-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="text-left p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition text-sm"
                          onClick={() => setNewCampaign({ ...newCampaign, message: suggestion })}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="message" className="text-sm text-gray-600 mb-1">
                      Final Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={newCampaign.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your campaign message here..."
                      className="rounded-md border border-gray-300 py-2 bg-white dark:bg-gray-800"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div>
                <Button type="submit" className="w-full py-3 rounded-md shadow-sm">
                  Launch Campaign
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RECENT CAMPAIGNS DRAWER (slides in from right) */}
      <AnimatePresence>
        {recentOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.28 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecentOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />

            <motion.aside
              id="recent-campaigns-drawer"
              initial={{ x: 384 }}
              animate={{ x: 0 }}
              exit={{ x: 384 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-96 max-w-full bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Recent Campaigns</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Latest 3</span>
                  <Button variant="ghost" size="icon" onClick={() => setRecentOpen(false)} aria-label="Close recent campaigns">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : recentCampaigns.length > 0 ? (
                  recentCampaigns.map((c) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Card className="shadow-md border border-gray-900 dark:border-gray-700">
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{c.name}</h3>
                              <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <EllipsisVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setConfirmDeleteId(c._id);
                                        setConfirmDeleteOpen(true);
                                      }}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <Badge className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-200">{c.successRate}% success</Badge>
                              <Badge className="bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-200">{c.failedRate}% failed</Badge>
                              <span className="text-xs text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCampaign(c);
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No recent campaigns. Launch one from the left.</div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top-level delete confirmation dialog (controlled) */}
      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(val) => {
          setConfirmDeleteOpen(val);
          if (!val) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this campaign and all associated logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmDeleteOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Details Dialog (opens when user clicks a recent campaign's View) */}
      <Dialog open={!!selectedCampaign} onOpenChange={(val) => !val && setSelectedCampaign(null)}>
        {selectedCampaign && (
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>Details for this campaign.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3">
              <div className="grid grid-cols-2 items-center gap-3">
                <p className="text-sm font-medium">Created By:</p>
                <p className="text-sm text-gray-500">{selectedCampaign.createdBy}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Filters ({selectedCampaign.logic || "AND"}):</p>
                {selectedCampaign.filters && selectedCampaign.filters.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
                    {selectedCampaign.filters.map((filter, index) => (
                      <li key={index}>
                        {filter.key === "minSpend" && `Min. Spend: ₹${filter.value}`}
                        {filter.key === "minVisits" && `Min. Visits: ${filter.value}`}
                        {filter.key === "inactiveDays" && `Inactive for ${filter.value} days`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No filters applied.</p>
                )}
              </div>

              <Separator />

              <div className="grid gap-2">
                <p className="text-sm font-medium">Message:</p>
                <p className="text-sm text-gray-500 whitespace-pre-wrap">{selectedCampaign.message || "—"}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Audience</p>
                  <div className="text-sm font-medium">{selectedCampaign.audienceSize || 0}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sent / Failed</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-200">{selectedCampaign.sent || 0} sent</Badge>
                    <Badge className="bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-200">{selectedCampaign.failed || 0} failed</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Big-sized toast UI (moved to top-right) */}
      <AnimatePresence>
        {showBigToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed right-6 top-6 z-60"
            aria-live="polite"
          >
            <div className="w-[420px] max-w-[calc(100%-32px)] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="text-sm text-gray-500">Campaign Status</div>
                <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">Campaign Created Successfully</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Your campaign has been launched and will be processed in the background. You can view it in Campaigns Logs.
                </div>
              </div>
              <div className="flex items-start">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBigToast(false)}
                  aria-label="Close big toast"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
