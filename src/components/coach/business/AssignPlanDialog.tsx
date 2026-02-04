import { useState } from "react";
import { format, addMonths, addYears } from "date-fns";
import { CalendarIcon, CreditCard } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import type { AthleteSubscription, CoachProduct } from "@/hooks/useCoachBusinessData";

interface AssignPlanDialogProps {
  athlete: AthleteSubscription;
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
  trigger?: React.ReactNode;
}

export function AssignPlanDialog({
  athlete,
  products,
  onAssign,
  isAssigning = false,
  trigger,
}: AssignPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const { toast } = useToast();

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
    if (!selectedProductId || !selectedProduct) return;

    const periodEnd = calculatePeriodEnd(startDate, selectedProduct.billing_period);

    onAssign({
      athleteId: athlete.id,
      productId: selectedProductId,
      productName: selectedProduct.name,
      startDate,
      periodEnd,
      price: selectedProduct.price,
    });

    toast({
      title: "Plan assigned",
      description: `${selectedProduct.name} assigned to ${athlete.full_name || "Athlete"}`,
    });

    // Reset and close
    setSelectedProductId("");
    setStartDate(new Date());
    setOpen(false);
  };

  const canAssign = selectedProductId && startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Assign Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Plan to {athlete.full_name || "Athlete"}</DialogTitle>
          <DialogDescription>
            Select a product and start date to activate the subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            {isAssigning ? "Assigning..." : "Assign Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
