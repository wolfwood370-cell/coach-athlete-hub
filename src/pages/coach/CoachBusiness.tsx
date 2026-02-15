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
      return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Attivo</Badge>;
    case "trial":
      return <Badge variant="secondary">Prova</Badge>;
    case "past_due":
      return <Badge variant="destructive">Scaduto</Badge>;
    case "canceled":
      return <Badge variant="outline" className="text-muted-foreground">Cancellato</Badge>;
    default:
      return <Badge variant="outline">Nessuno</Badge>;
  }
}

import { AssignSubscriptionDialog } from "@/components/coach/business/AssignSubscriptionDialog";
import { AssignPlanDialog } from "@/components/coach/business/AssignPlanDialog";

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
    assignSubscription,
    isAssigningSubscription,
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
            <p className="text-muted-foreground">Gestisci prodotti, abbonamenti e ricavi</p>
          </div>
          <div className="flex items-center gap-2">
            <AssignSubscriptionDialog
              athletes={athleteSubscriptions}
              products={products}
              onAssign={assignSubscription}
              isAssigning={isAssigningSubscription}
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                  Nuovo Prodotto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                <DialogTitle>Crea Nuovo Prodotto</DialogTitle>
                <DialogDescription>
                  Aggiungi un nuovo pacchetto di coaching o livello di abbonamento
                </DialogDescription>
              </DialogHeader>
                <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Prodotto</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 1:1 Coaching Gold"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prezzo (€)</Label>
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
                    <Label htmlFor="billing">Periodo di Fatturazione</Label>
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
                        <SelectItem value="monthly">Mensile</SelectItem>
                        <SelectItem value="yearly">Annuale</SelectItem>
                        <SelectItem value="one-time">Una Tantum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    placeholder="Cosa include questo prodotto..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                   Annulla
                </Button>
                <Button onClick={handleCreateProduct} disabled={isCreatingProduct}>
                  {isCreatingProduct ? "Creazione..." : "Crea Prodotto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ricavo Mensile Stimato
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                €{businessMetrics.estimatedMRR.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ricavo ricorrente mensile</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clienti Attivi
              </CardTitle>
              <Users className="h-4 w-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {businessMetrics.activeClients}
              </div>
              <p className="text-xs text-muted-foreground mt-1">su {athleteSubscriptions.length} atleti totali</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagamenti in Sospeso
              </CardTitle>
              <Clock className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {businessMetrics.pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">€{businessMetrics.pendingAmount.toFixed(2)} in sospeso</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>I Tuoi Prodotti</CardTitle>
            </div>
            <CardDescription>Pacchetti di coaching e livelli di abbonamento</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun prodotto ancora. Crea il primo pacchetto di coaching per iniziare.</p>
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
                              Archivia Prodotto
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
              <CardTitle>Abbonamenti Clienti</CardTitle>
            </div>
            <CardDescription>Gestisci gli abbonamenti dei tuoi atleti</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Atleta</TableHead>
                    <TableHead>Piano Attuale</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data Rinnovo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athleteSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nessun atleta assegnato
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
                          <div className="flex items-center justify-end gap-2">
                            <AssignPlanDialog
                              athlete={athlete}
                              products={products}
                              onAssign={assignSubscription}
                              isAssigning={isAssigningSubscription}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(athlete.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                                  Segna come Pagato
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
