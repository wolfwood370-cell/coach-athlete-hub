import { useState } from "react";
import { format, addMonths, addYears } from "date-fns";
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
        return addYears(start, 100); // Effectively no expiration
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
          Assign Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Subscription</DialogTitle>
          <DialogDescription>
            Manually assign a product plan to an athlete. This will activate their subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Athlete Select */}
          <div className="space-y-2">
            <Label htmlFor="athlete">Select Athlete</Label>
            <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
              <SelectTrigger id="athlete">
                <SelectValue placeholder="Choose an athlete..." />
              </SelectTrigger>
              <SelectContent>
                {athletes.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No athletes available
                  </SelectItem>
                ) : (
                  athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <span>{athlete.full_name || "Unnamed Athlete"}</span>
                        {athlete.subscription_status === "active" && (
                          <span className="text-xs text-muted-foreground">
                            (Current: {athlete.subscription_tier})
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
            <Label htmlFor="product">Select Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No products available
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">
                          €{Number(product.price).toFixed(2)}/{product.billing_period}
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
            <Label>Start Date</Label>
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
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
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
              <p className="font-medium">Subscription Summary</p>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>
                  Product: <span className="text-foreground">{selectedProduct.name}</span>
                </p>
                <p>
                  Amount: <span className="text-foreground">€{Number(selectedProduct.price).toFixed(2)}</span>
                </p>
                <p>
                  Billing: <span className="text-foreground capitalize">{selectedProduct.billing_period}</span>
                </p>
                <p>
                  Period End:{" "}
                  <span className="text-foreground">
                    {format(calculatePeriodEnd(startDate, selectedProduct.billing_period), "PPP")}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canAssign || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
