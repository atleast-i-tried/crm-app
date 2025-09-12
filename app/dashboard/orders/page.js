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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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

export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    amount: "",
  });
  const [filters, setFilters] = useState({
    customerName: "",
    status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState("");
  const ordersPerPage = 15;

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([fetchOrders(), fetchCustomers()]).finally(() => {
        setLoading(false);
      });
    }
  }, [status]);

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({ ...newOrder, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add order");
      }

      await fetchOrders(); // Re-fetch orders to show the new one
      setIsModalOpen(false);
      setNewOrder({ customerId: "", amount: "" });
      toast.success("Order added successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerNameMatch = order.customer?.name
        ?.toLowerCase()
        .includes(filters.customerName.toLowerCase());
      const statusMatch = order.status
        .toLowerCase()
        .includes(filters.status.toLowerCase());
      return customerNameMatch && statusMatch;
    });
  }, [orders, filters]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const filteredCustomers = customers.filter((c) => {
    if (!customerFilter) return true;
    return c.name?.toLowerCase().startsWith(customerFilter.toLowerCase());
  });

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
                <Select
                  onValueChange={(value) =>
                    setNewOrder({ ...newOrder, customerId: value })
                  }
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Customers</SelectLabel>
                      <div className="px-3 pb-2">
                        <Input
                          placeholder="Type a letter (e.g. 'a') to filter..."
                          value={customerFilter}
                          onChange={(e) => setCustomerFilter(e.target.value)}
                          autoFocus
                        />
                      </div>
                      {filteredCustomers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name} ({c.email})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
              <Button type="submit">Save Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Customer
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Input
              placeholder="Filter customer name..."
              name="customerName"
              value={filters.customerName}
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
      ) : currentOrders.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-medium">
                    {o.customer?.name || "Unknown"}
                  </TableCell>
                  <TableCell>₹{o.amount}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {o.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    {new Date(o.createdAt).toLocaleDateString()}
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
          No orders found. Add a new order to get started.
        </div>
      )}
    </div>
  );
}
