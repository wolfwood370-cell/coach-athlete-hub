import { useState } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Users,
  Clock,
  Plus,
  MoreHorizontal,
  Trash2,
  CreditCard,
  TrendingUp,
  Package,
  CheckCircle,
} from "lucide-react";
import { useCoachBusinessData, type CreateProductPayload } from "@/hooks/useCoachBusinessData";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??"
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Active</Badge>;
    case "trial":
      return <Badge variant="secondary">Trial</Badge>;
    case "past_due":
      return <Badge variant="destructive">Past Due</Badge>;
    case "canceled":
      return <Badge variant="outline" className="text-muted-foreground">Canceled</Badge>;
    default:
      return <Badge variant="outline">None</Badge>;
  }
}

export default function CoachBusiness() {
  const {
    products,
    athleteSubscriptions,
    businessMetrics,
    isLoading,
    createProduct,
    isCreatingProduct,
    deleteProduct,
    updateSubscription,
  } = useCoachBusinessData();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<CreateProductPayload>({
    name: "",
    price: 0,
    billing_period: "monthly",
    description: "",
  });

  const handleCreateProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) return;
    createProduct(newProduct, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewProduct({ name: "", price: 0, billing_period: "monthly", description: "" });
      },
    });
  };

  const handleMarkAsPaid = (athleteId: string) => {
    updateSubscription({ athleteId, status: "active" });
  };

  const handleChangePlan = (athleteId: string, tier: string) => {
    updateSubscription({ athleteId, status: "active", tier });
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Business Hub</h1>
            <p className="text-muted-foreground">Manage your products, subscriptions, and revenue</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>
                  Add a new coaching product or subscription tier
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 1:1 Coaching Gold"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="150.00"
                      value={newProduct.price || ""}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing">Billing Period</Label>
                    <Select
                      value={newProduct.billing_period}
                      onValueChange={(value: "monthly" | "one-time" | "yearly") =>
                        setNewProduct({ ...newProduct, billing_period: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What's included in this product..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduct} disabled={isCreatingProduct}>
                  {isCreatingProduct ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimated MRR
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                €{businessMetrics.estimatedMRR.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monthly recurring revenue</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Clients
              </CardTitle>
              <Users className="h-4 w-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {businessMetrics.activeClients}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {athleteSubscriptions.length} total athletes
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
              <Clock className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {businessMetrics.pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                €{businessMetrics.pendingAmount.toFixed(2)} outstanding
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Your Products</CardTitle>
            </div>
            <CardDescription>Coaching packages and subscription tiers you offer</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products yet. Create your first coaching product to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="relative group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <CardDescription className="text-xs capitalize">
                            {product.billing_period}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Archive Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{Number(product.price).toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{product.billing_period === "monthly" ? "mo" : product.billing_period === "yearly" ? "yr" : ""}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Subscription Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Client Subscriptions</CardTitle>
            </div>
            <CardDescription>Manage your athletes' subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athleteSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No athletes assigned yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    athleteSubscriptions.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={athlete.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(athlete.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{athlete.full_name || "Unnamed"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {athlete.subscription_tier || "—"}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(athlete.subscription_status)}</TableCell>
                        <TableCell>
                          {athlete.current_period_end
                            ? format(new Date(athlete.current_period_end), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(athlete.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                                Mark as Paid
                              </DropdownMenuItem>
                              {products.map((product) => (
                                <DropdownMenuItem
                                  key={product.id}
                                  onClick={() => handleChangePlan(athlete.id, product.name)}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Assign: {product.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
}
