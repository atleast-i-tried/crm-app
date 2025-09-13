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
import { toast, Toaster } from "sonner"; // <-- imported Toaster
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Helper: extract timestamp (ms) from a Mongo ObjectId string.
 * ObjectId first 8 hex chars are seconds since epoch.
 */
function idToTimestampMs(id) {
  try {
    return parseInt(id.substring(0, 8), 16) * 1000;
  } catch (e) {
    return 0;
  }
}

/** Sort customers by newest first using ObjectId timestamp */
function sortCustomersNewestFirst(list = []) {
  return list.slice().sort((a, b) => idToTimestampMs(b._id) - idToTimestampMs(a._id));
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  // Edit sheet state
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Filters & pagination
  const [filters, setFilters] = useState({ name: "", email: "", phone: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 15;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      // Sort newest first before setting
      setCustomers(sortCustomersNewestFirst(data || []));
    } catch (error) {
      toast.error(error.message || "Unable to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCustomers();
    }
  }, [status]);

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((p) => ({ ...p, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCustomer((p) => ({ ...p, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
    setCurrentPage(1);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsAddModalOpen(false);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add customer");
      }

      // Try to use returned created customer to avoid extra fetch if API returns it
      const created = await res.json().catch(() => null);

      if (created && created._id) {
        // Prepend and keep sorted
        setCustomers((prev) => sortCustomersNewestFirst([created, ...prev]));
      } else {
        // Fallback: refresh list
        await fetchCustomers();
      }

      setNewCustomer({ name: "", email: "", phone: "" });
      toast.success("Customer added successfully!");
      // ensure we are on first page so the new entry is visible
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.message || "Failed to add customer");
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    setIsEditSheetOpen(false);
    try {
      const res = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to edit customer");
      }

      const updated = await res.json().catch(() => null);

      if (updated && updated._id) {
        // Replace updated in state and keep sorted
        setCustomers((prev) =>
          sortCustomersNewestFirst(prev.map((c) => (c._id === updated._id ? updated : c)))
        );
      } else {
        // fallback: refresh
        await fetchCustomers();
      }

      toast.success("Customer updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update customer");
    } finally {
      setEditingCustomer(null);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    setIsConfirmDeleteOpen(false);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete customer");
      }

      // remove from state
      setCustomers((prev) => prev.filter((c) => c._id !== customerId));
      toast.success("Customer deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete customer");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const nameMatch = (customer.name || "")
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const emailMatch = (customer.email || "")
        .toLowerCase()
        .includes(filters.email.toLowerCase());
      const phoneMatch = (customer.phone || "")
        .toLowerCase()
        .includes(filters.phone.toLowerCase());
      return nameMatch && emailMatch && phoneMatch;
    });
  }, [customers, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
  const currentCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage]);

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
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
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
      {/* Sonner Toaster mounted here — position top-right */}
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>

        {/* Open add dialog via normal Button (controlled dialog) */}
        <Button onClick={() => setIsAddModalOpen(true)}>+ Add New Customer</Button>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new customer to the CRM.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleAddInputChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={handleAddInputChange}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleAddInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Customer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Name
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter name..."
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Email
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter email..."
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Phone
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter phone..."
              name="phone"
              value={filters.phone}
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
      ) : currentCustomers.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCustomers.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone || "N/A"}</TableCell>
                  <TableCell>₹{c.totalSpend || 0}</TableCell>
                  <TableCell>{c.visits || 0}</TableCell>
                  <TableCell>
                    {c.lastActive ? new Date(c.lastActive).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
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
                            setEditingCustomer(c);
                            setIsEditSheetOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setConfirmDeleteId(c._id);
                            setIsConfirmDeleteOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className={
                      currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No customers found. Try adjusting your filters or add a new customer to get
          started.
        </div>
      )}

      {/* Edit Customer Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
            <SheetDescription>
              Make changes to the customer's profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>

          {editingCustomer ? (
            <form onSubmit={handleEditCustomer} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  name="name"
                  value={editingCustomer.name}
                  onChange={handleEditInputChange}
                  required
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="editEmail"
                  name="email"
                  type="email"
                  value={editingCustomer.email}
                  onChange={handleEditInputChange}
                  required
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPhone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="editPhone"
                  name="phone"
                  value={editingCustomer.phone || ""}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditSheetOpen(false);
                    setEditingCustomer(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="p-4">No customer selected.</div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Delete AlertDialog (controlled) */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-4 text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete this customer's
            data.
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
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDeleteCustomer(confirmDeleteId);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
