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

    const filteredGroups = Object.values(groups).filter((group) => {
      const campaignMatch = group.name
        .toLowerCase()
        .includes(filters.campaignName.toLowerCase());
      const statusMatch = group.logs.some((log) =>
        log.status.toLowerCase().includes(filters.status.toLowerCase())
      );
      return campaignMatch && statusMatch;
    });

    return filteredGroups;
  }, [logs, filters]);

  const totalPages = Math.ceil(groupedLogs.length / logsPerPage);
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentGroups.map((group) => {
                const sentCount = group.logs.filter((l) => l.status === "SENT").length;
                const failedCount = group.logs.length - sentCount;
                return (
                  <TableRow
                    key={group.name}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                    onClick={() => handleCampaignClick(group.name)}
                  >
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.logs.length}</TableCell>
                    <TableCell>
                      <Badge variant="success">{sentCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{failedCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(group.logs[0].createdAt).toLocaleDateString()}
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
    </div>
  );
}