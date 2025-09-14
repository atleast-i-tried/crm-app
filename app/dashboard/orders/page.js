"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Safe timestamp extraction helper (ObjectId -> ms) */
function idToTimestampMs(id) {
  try {
    return parseInt(id.substring(0, 8), 16) * 1000;
  } catch {
    return 0;
  }
}

/** Sort newest first by ObjectId timestamp (fallback) */
function sortNewestFirst(list = []) {
  return list.slice().sort((a, b) => {
    const ta = a.createdAt
      ? new Date(a.createdAt).getTime()
      : idToTimestampMs(a._id || "");
    const tb = b.createdAt
      ? new Date(b.createdAt).getTime()
      : idToTimestampMs(b._id || "");
    return tb - ta;
  });
}

export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const [newOrder, setNewOrder] = useState({
    customerId: "",
    amount: "",
  });

  const [filters, setFilters] = useState({
    searchTerm: "",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState("");
  const ordersPerPage = 11;

  const prevCustomersRef = useRef([]);
  const isInitialCustomersRef = useRef(true);
  const customersPollRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch orders");
    }
  }, []);

  const _processCustomerDiffsAndSet = (newList) => {
    const prev = prevCustomersRef.current || [];
    const prevMap = {};
    prev.forEach((p) => {
      if (p && p._id) prevMap[p._id] = p;
    });

    const added = [];
    const updated = [];
    newList.forEach((c) => {
      if (!c || !c._id) return;
      const p = prevMap[c._id];
      if (!p) added.push(c);
      else {
        const pStr = JSON.stringify({
          name: p.name,
          email: p.email,
          updatedAt: p.updatedAt,
        });
        const cStr = JSON.stringify({
          name: c.name,
          email: c.email,
          updatedAt: c.updatedAt,
        });
        if (pStr !== cStr) updated.push(c);
      }
    });

    if (!isInitialCustomersRef.current) {
      added.forEach((c) =>
        toast.success(`${c.name || "Customer"} added`, { description: c.email })
      );
      updated.forEach((c) =>
        toast.success(`${c.name || "Customer"} updated`, {
          description: c.email,
        })
      );
    }

    prevCustomersRef.current = newList;
    isInitialCustomersRef.current = false;
    setCustomers(newList);
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      const list = Array.isArray(data) ? sortNewestFirst(data) : [];
      _processCustomerDiffsAndSet(list);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch customers");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let mounted = true;
    setLoading(true);

    Promise.all([fetchOrders(), fetchCustomers()]).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });

    customersPollRef.current = setInterval(() => {
      fetchCustomers();
    }, 20000);

    return () => {
      mounted = false;
      if (customersPollRef.current) clearInterval(customersPollRef.current);
    };
  }, [status, fetchOrders, fetchCustomers]);

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((p) => ({ ...p, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
    setCurrentPage(1);
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to add order");
      }
      const createdOrder = await res.json().catch(() => null);

      if (createdOrder && createdOrder._id) {
        const customerDetails = customers.find(
          (c) => c._id === newOrder.customerId
        );
        const populatedOrder = {
          ...createdOrder,
          customer: customerDetails || null,
        };
        setOrders((prev) => [populatedOrder, ...prev]);
      } else {
        await fetchOrders();
      }

      setNewOrder({ customerId: "", amount: "" });
      toast.success("Order added successfully!");
      setFilters({ searchTerm: "" });
      setSortConfig({ key: "date", direction: "descending" });
      setCurrentPage(1);
    } catch (err) {
      setIsModalOpen(true);
      toast.error(err?.message || "Could not add order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setConfirmDeleteId(orderId);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setIsConfirmDeleteOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${confirmDeleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to delete order");
      }
      setOrders((prev) => prev.filter((o) => o._id !== confirmDeleteId));
      toast.success("Order deleted successfully");
      setConfirmDeleteId(null);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not delete order");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const sortedAndFilteredOrders = useMemo(() => {
    let sortableItems = [...orders];

    const searchTerm = (filters.searchTerm || "").toLowerCase();
    if (searchTerm) {
      sortableItems = sortableItems.filter((o) => {
        const nameMatch = (o.customer?.name || "")
          .toLowerCase()
          .includes(searchTerm);
        const emailMatch = (o.customer?.email || "")
          .toLowerCase()
          .includes(searchTerm);
        return nameMatch || emailMatch;
      });
    }

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case "amount":
            aValue = a.amount;
            bValue = b.amount;
            break;
          case "date":
            aValue = new Date(
              a.createdAt || a.updatedAt || idToTimestampMs(a._id) || 0
            ).getTime();
            bValue = new Date(
              b.createdAt || b.updatedAt || idToTimestampMs(b._id) || 0
            ).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [orders, filters, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedAndFilteredOrders.length / ordersPerPage)
  );

  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return sortedAndFilteredOrders.slice(start, start + ordersPerPage);
  }, [sortedAndFilteredOrders, currentPage]);

  const filteredCustomers = useMemo(() => {
    const cf = (customerFilter || "").toLowerCase();
    const list = (customers || []).filter((c) => {
      if (!cf) return true;
      return (c.name || "").toLowerCase().startsWith(cf);
    });
    return sortNewestFirst(list);
  }, [customers, customerFilter]);

  const sortOptions = [
    { value: "original", label: "Original", key: "date", direction: "descending" },
    { value: "amount_asc", label: "Amount: Low to High", key: "amount", direction: "ascending" },
    { value: "amount_desc", label: "Amount: High to Low", key: "amount", direction: "descending" },
  ];

  if (status === "loading") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-40" />
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>+ Add New Order</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Order</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOrder} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">
                  Customer
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) =>
                      setNewOrder((p) => ({ ...p, customerId: value }))
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Customers</SelectLabel>
                        <div className="px-3 pb-2">
                          <Input
                            placeholder="Type a letter to filter..."
                            value={customerFilter}
                            onChange={(e) => setCustomerFilter(e.target.value)}
                            autoFocus
                          />
                        </div>
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name} ({c.email})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No customers
                          </div>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={newOrder.amount}
                  onChange={handleAddInputChange}
                  required
                  className="col-span-3"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Order"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      <div className="flex justify-between items-center gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Filter by Customer or Email
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter by name or email..."
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
            />
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Sort</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() =>
                  setSortConfig({
                    key: option.key,
                    direction: option.direction,
                  })
                }
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : currentOrders.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.map((o) => {
                const ts = new Date(
                  o.createdAt || o.updatedAt || idToTimestampMs(o._id) || Date.now()
                );
                const dateStr = ts.toLocaleDateString();
                const timeStr = ts.toLocaleTimeString();
                return (
                  <TableRow key={o._id}>
                    <TableCell className="font-medium">
                      {o.customer?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{o.customer?.email || "N/A"}</TableCell>
                    <TableCell>₹{o.amount}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {o.status || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{timeStr}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setConfirmDeleteId(o._id);
                                setIsConfirmDeleteOpen(true);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(p - 1, 1));
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={i + 1 === currentPage}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                    }}
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
          No orders found. Add a new order to get started.
        </div>
      )}

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-4 text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete the
            order.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsConfirmDeleteOpen(false);
                setConfirmDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}