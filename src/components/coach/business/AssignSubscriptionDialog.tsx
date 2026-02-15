import { useState } from "react";
import { format, addMonths, addYears } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AthleteSubscription, CoachProduct } from "@/hooks/useCoachBusinessData";

interface AssignSubscriptionDialogProps {
  athletes: AthleteSubscription[];
  products: CoachProduct[];
  onAssign: (data: {
    athleteId: string;
    productId: string;
    productName: string;
    startDate: Date;
    periodEnd: Date;
    price: number;
  }) => void;
  isAssigning?: boolean;
}

export function AssignSubscriptionDialog({
  athletes,
  products,
  onAssign,
  isAssigning = false,
}: AssignSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(new Date());

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const calculatePeriodEnd = (start: Date, billingPeriod: string): Date => {
    switch (billingPeriod) {
      case "monthly":
        return addMonths(start, 1);
      case "yearly":
        return addYears(start, 1);
      case "one-time":
        return addYears(start, 100);
      default:
        return addMonths(start, 1);
    }
  };

  const handleAssign = () => {
    if (!selectedAthleteId || !selectedProductId || !selectedProduct) return;

    const periodEnd = calculatePeriodEnd(startDate, selectedProduct.billing_period);

    onAssign({
      athleteId: selectedAthleteId,
      productId: selectedProductId,
      productName: selectedProduct.name,
      startDate,
      periodEnd,
      price: selectedProduct.price,
    });

    // Reset and close
    setSelectedAthleteId("");
    setSelectedProductId("");
    setStartDate(new Date());
    setOpen(false);
  };

  const canAssign = selectedAthleteId && selectedProductId && startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Assegna Piano
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assegna Abbonamento</DialogTitle>
          <DialogDescription>
            Assegna manualmente un piano prodotto a un atleta. Questo attiverà il suo abbonamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Athlete Select */}
          <div className="space-y-2">
            <Label htmlFor="athlete">Seleziona Atleta</Label>
            <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
              <SelectTrigger id="athlete">
                <SelectValue placeholder="Scegli un atleta..." />
              </SelectTrigger>
              <SelectContent>
                {athletes.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nessun atleta disponibile
                  </SelectItem>
                ) : (
                  athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <span>{athlete.full_name || "Atleta senza nome"}</span>
                        {athlete.subscription_status === "active" && (
                          <span className="text-xs text-muted-foreground">
                            (Attuale: {athlete.subscription_tier})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Product Select */}
          <div className="space-y-2">
            <Label htmlFor="product">Seleziona Prodotto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Scegli un prodotto..." />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nessun prodotto disponibile
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">
                          €{Number(product.price).toFixed(2)}/{product.billing_period === "monthly" ? "mese" : product.billing_period === "yearly" ? "anno" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Picker */}
          <div className="space-y-2">
            <Label>Data di Inizio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: it }) : "Seleziona una data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary */}
          {selectedProduct && startDate && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Riepilogo Abbonamento</p>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>
                  Prodotto: <span className="text-foreground">{selectedProduct.name}</span>
                </p>
                <p>
                  Importo: <span className="text-foreground">€{Number(selectedProduct.price).toFixed(2)}</span>
                </p>
                <p>
                  Fatturazione: <span className="text-foreground capitalize">{selectedProduct.billing_period === "monthly" ? "Mensile" : selectedProduct.billing_period === "yearly" ? "Annuale" : "Una Tantum"}</span>
                </p>
                <p>
                  Scadenza:{" "}
                  <span className="text-foreground">
                    {format(calculatePeriodEnd(startDate, selectedProduct.billing_period), "PPP", { locale: it })}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleAssign} disabled={!canAssign || isAssigning}>
            {isAssigning ? "Assegnazione..." : "Assegna Abbonamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
