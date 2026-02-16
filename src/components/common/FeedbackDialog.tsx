import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus, Loader2, Bug, Lightbulb, CreditCard, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { mapSupabaseError } from "@/lib/errorMapping";

type TicketCategory = "bug" | "feature_request" | "billing" | "other";

const CATEGORIES: { value: TicketCategory; label: string; icon: React.ElementType }[] = [
  { value: "bug", label: "🐛 Bug / Problema", icon: Bug },
  { value: "feature_request", label: "💡 Suggerimento", icon: Lightbulb },
  { value: "billing", label: "💳 Fatturazione", icon: CreditCard },
  { value: "other", label: "❓ Altro", icon: HelpCircle },
];

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Inserisci un messaggio");
      return;
    }
    if (!user?.id) {
      toast.error("Devi essere loggato per inviare feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata = {
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        category,
        message: message.trim(),
        metadata,
      } as any);

      if (error) throw error;

      toast.success("Feedback inviato! Grazie per il tuo contributo 🙏");
      setMessage("");
      setCategory("bug");
      setOpen(false);
    } catch (err) {
      toast.error(mapSupabaseError(err) || "Non siamo riusciti a inviare il feedback, riprova più tardi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            Segnala un Problema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Invia Feedback
          </DialogTitle>
          <DialogDescription>
            Segnala un bug, suggerisci una funzionalità o contattaci per qualsiasi problema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Messaggio</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descrivi il problema o il suggerimento..."
              rows={4}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Le informazioni del browser e della pagina verranno incluse automaticamente.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 mr-2" />
            )}
            Invia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
