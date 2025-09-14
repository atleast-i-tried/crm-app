"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
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

  // Create-campaign state (form is visible inline now)
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

  // Details dialog for recent campaigns (opens when user clicks a recent campaign)
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
      // clear form but keep logic default
      setNewCampaign({
        name: "",
        message: "",
        objective: "",
        filters: [],
        logic: "AND",
      });
      setAudienceSize(0);
      setAiSuggestions([]);
      toast.success("Campaign launched successfully!");
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

  // Normalize any API result into an array of strings
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

  // NEW: panel open state for recent campaigns (hidden by default)
  const [recentOpen, setRecentOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Separator className="my-6" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
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

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <div className="text-sm text-gray-500 mt-1">Design your audience, craft the message, and launch.</div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setRecentOpen((v) => !v); }}>
            <EllipsisVertical className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Recent</span>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Main layout: left = create form */}
      <div className="grid grid-cols-1 gap-6">
        {/* Left: Create Campaign (visible inline, replaces dialog) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleAddCampaign} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl transition-shadow">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" value={newCampaign.name} onChange={handleInputChange} required className="col-span-3" />
            </div>

            {/* Audience Filters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-500">Audience Filters</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Logic:</span>
                  <Button type="button" variant={newCampaign.logic === "AND" ? "default" : "outline"} onClick={() => handleLogicChange("AND")} size="sm">
                    AND
                  </Button>
                  <Button type="button" variant={newCampaign.logic === "OR" ? "default" : "outline"} onClick={() => handleLogicChange("OR")} size="sm">
                    OR
                  </Button>
                </div>
              </div>

              {newCampaign.filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={filter.key}
                    onChange={(e) => handleFilterChange(index, e.target.value, filter.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="w-full"
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveFilter(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" className="w-full" onClick={handleAddFilter} disabled={newCampaign.filters.length >= 3}>
                + Add Filter
              </Button>

              <div className="text-center text-sm font-medium mt-2">
                Audience Size: <Badge variant="secondary">{audienceSize}</Badge>
              </div>
            </div>

            <Separator />

            {/* AI Assistant */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500">AI Message Suggestions</h4>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>AI Message Assistant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="objective">Campaign Objective</Label>
                      <Input
                        id="objective"
                        name="objective"
                        placeholder="e.g., 'bring back inactive users'"
                        value={newCampaign.objective}
                        onChange={handleInputChange}
                      />
                    </div>
                    <Button type="button" onClick={getAiSuggestions} disabled={aiLoading}>
                      {aiLoading ? "Generating..." : "Generate AI Messages"}
                    </Button>
                  </div>

                  {aiSuggestions && aiSuggestions.length > 0 && (
                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => setNewCampaign({ ...newCampaign, message: suggestion })}
                        >
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message">Final Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={newCampaign.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your campaign message here..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" className="w-full">
              Launch Campaign
            </Button>
          </form>
        </div>
      </div>

      {/* Floating toggle button on the right (visible on all sizes) */}
      <div className="fixed right-6 bottom-8 z-50">
        <button
          onClick={() => setRecentOpen((v) => !v)}
          aria-expanded={recentOpen}
          aria-controls="recent-campaigns-drawer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition"
        >
          <EllipsisVertical className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Recent campaigns</span>
        </button>
      </div>

      {/* Drawer: recent campaigns panel (slides in from right) */}
      <AnimatePresence>
        {recentOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecentOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />

            <motion.aside
              id="recent-campaigns-drawer"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-[28rem] max-w-full bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Campaigns</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Latest 3</span>
                  <Button variant="ghost" size="icon" onClick={() => setRecentOpen(false)} aria-label="Close recent campaigns">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
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
                      transition={{ duration: 0.18 }}
                    >
                      <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">{c.name}</h3>
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

                            <div className="mt-3 flex items-center gap-2">
                              <Badge className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-200">
                                {c.successRate}% success
                              </Badge>
                              <Badge className="bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-200">{c.failedRate}% failed</Badge>
                              <span className="text-xs text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-3">
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

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">Created By:</p>
                <p className="text-sm text-gray-500">{selectedCampaign.createdBy}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Filters ({selectedCampaign.logic || "AND"}):
                </p>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Audience</p>
                  <div className="text-sm font-medium">{selectedCampaign.audienceSize || 0}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sent / Failed</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-200">
                      {selectedCampaign.sent || 0} sent
                    </Badge>
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
    </div>
  );
}
