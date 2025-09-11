"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EllipsisVertical, X } from "lucide-react";

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null); // New state for selected campaign
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    objective: "",
    filters: [], // Array of filter rules
    logic: "AND", // "AND" or "OR"
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [audienceSize, setAudienceSize] = useState(0);

  const filterOptions = [
    { label: "Min. Spend", key: "minSpend" },
    { label: "Min. Visits", key: "minVisits" },
    { label: "Inactive Days", key: "inactiveDays" },
  ];

  const applyFilters = (customerList, filters, logic) => {
    if (filters.length === 0) return customerList;

    return customerList.filter((c) => {
      const results = filters.map((f) => {
        switch (f.key) {
          case "minSpend":
            return c.totalSpend >= f.value;
          case "minVisits":
            return c.visits >= f.value;
          case "inactiveDays":
            if (f.value === 0) return true;
            return c.lastActive && (new Date() - new Date(c.lastActive)) / (1000 * 60 * 60 * 24) >= f.value;
          default:
            return true;
        }
      });
      return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    });
  };

  const handleFilterChange = (index, key, value) => {
    const updatedFilters = [...newCampaign.filters];
    updatedFilters[index] = { ...updatedFilters[index], key, value };
    setNewCampaign({ ...newCampaign, filters: updatedFilters });
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
    const updatedFilters = newCampaign.filters.filter((_, i) => i !== index);
    setNewCampaign({ ...newCampaign, filters: updatedFilters });
  };

  const fetchAllData = async () => {
    try {
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

      setCampaigns(campaignsData);
      setCustomers(customersData);
      setLogs(logsData);
      const initialAudience = applyFilters(customersData, newCampaign.filters, newCampaign.logic);
      setAudienceSize(initialAudience.length);
    } catch (error) {
      toast.error("An error occurred while fetching data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData();
    }
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      await fetchAllData();
      setIsAddModalOpen(false);
      setNewCampaign({
        name: "",
        message: "",
        objective: "",
        filters: [],
        logic: "AND",
      });
      setAudienceSize(0);
      toast.success("Campaign launched successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete campaign");
      }

      await fetchAllData();
      toast.success("Campaign deleted successfully!");
    } catch (error) {
      toast.error(error.message);
    }
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
      if (!res.ok) throw new Error("Failed to get AI suggestions");
      const data = await res.json();
      setAiSuggestions(data.suggestions);
      toast.success("AI suggestions generated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const campaignStats = useMemo(() => {
    return campaigns.map((campaign) => {
      const relatedLogs = logs.filter((log) => log.campaign === campaign._id);
      const sentCount = relatedLogs.filter((log) => log.status === "SENT")
        .length;
      const failedCount = relatedLogs.length - sentCount;
      const audienceSize = relatedLogs.length;
      const successRate = audienceSize > 0 ? (sentCount / audienceSize) * 100 : 0;
      const failedRate = audienceSize > 0 ? (failedCount / audienceSize) * 100 : 0;

      return {
        ...campaign,
        audienceSize,
        sent: sentCount,
        failed: failedCount,
        successRate: successRate.toFixed(2),
        failedRate: failedRate.toFixed(2),
      };
    });
  }, [campaigns, logs]);

  if (status === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Separator className="my-6" />
        <div className="space-y-4">
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>+ Create New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>
                Define your audience and message to launch a new campaign.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCampaign} className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newCampaign.name}
                  onChange={handleInputChange}
                  required
                  className="col-span-3"
                />
              </div>

              {/* Dynamic Rule Builder Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-500">Audience Filters</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Logic:</span>
                    <Button
                      type="button"
                      variant={newCampaign.logic === "AND" ? "default" : "outline"}
                      onClick={() => handleLogicChange("AND")}
                      size="sm"
                    >
                      AND
                    </Button>
                    <Button
                      type="button"
                      variant={newCampaign.logic === "OR" ? "default" : "outline"}
                      onClick={() => handleLogicChange("OR")}
                      size="sm"
                    >
                      OR
                    </Button>
                  </div>
                </div>
                
                {newCampaign.filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.key}
                      onChange={(e) => handleFilterChange(index, e.target.value, filter.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleAddFilter}
                  disabled={newCampaign.filters.length >= 3}
                >
                  + Add Filter
                </Button>
                
                <div className="text-center text-sm font-medium mt-2">
                  Audience Size: <Badge variant="secondary">{audienceSize}</Badge>
                </div>
              </div>

              <Separator />

              {/* AI Integration Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500">AI Message Suggestions</h4>
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
                  <Button
                    type="button"
                    onClick={getAiSuggestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Generating..." : "Get Suggestions"}
                  </Button>
                </div>
                {aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                        onClick={() =>
                          setNewCampaign({
                            ...newCampaign,
                            message: suggestion,
                          })
                        }
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
              </div>
              <Button type="submit" className="w-full">
                Launch Campaign
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Separator className="my-6" />

      {/* Campaign History */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : campaignStats.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead>Campaign Name</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Audience Size</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Failed Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((c) => {
                const stats = campaignStats.find((s) => s._id === c._id);
                return (
                  <TableRow key={c._id} className="cursor-pointer hover:bg-gray-100/50" onClick={() => setSelectedCampaign(stats)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.createdBy}</TableCell>
                    <TableCell>{stats?.audienceSize || 0}</TableCell>
                    <TableCell>
                      <Badge variant="success">
                        {stats?.successRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {stats?.failedRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently
                                  delete this campaign and all associated logs.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCampaign(c._id)}
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No campaigns found. Create your first campaign to get started.
        </div>
      )}

      {/* Campaign Details Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        {selectedCampaign && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>
                Details for this campaign.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">Created By:</p>
                <p className="text-sm text-gray-500">{selectedCampaign.createdBy}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Filters ({selectedCampaign.logic}):</p>
                {selectedCampaign.filters.length > 0 ? (
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
                <p className="text-sm text-gray-500">{selectedCampaign.message}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
