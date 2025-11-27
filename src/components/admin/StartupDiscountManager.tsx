import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

interface StartupDiscountManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentStatus: {
    is_eligible: boolean;
    eligibility_type: string;
    months_remaining: number;
    notes: string | null;
  } | null;
  onUpdate: () => void;
}

export function StartupDiscountManager({
  open,
  onOpenChange,
  userId,
  userName,
  currentStatus,
  onUpdate,
}: StartupDiscountManagerProps) {
  const [loading, setLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(currentStatus?.is_eligible ?? false);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState(currentStatus?.notes ?? "");

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("Not authenticated");

      // Check if override already exists
      const { data: existing } = await supabase
        .from("startup_discount_overrides")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const overrideData = {
        user_id: userId,
        is_eligible: isEligible,
        approved_by: adminUser.id,
        expires_at: expiresAt || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing override
        const { error } = await supabase
          .from("startup_discount_overrides")
          .update(overrideData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new override
        const { error } = await supabase
          .from("startup_discount_overrides")
          .insert(overrideData);

        if (error) throw error;
      }

      toast.success(
        isEligible
          ? "Reducere Start-up aprobată cu succes"
          : "Reducere Start-up revocată cu succes"
      );
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error managing startup discount:", error);
      toast.error("Eroare la salvarea modificărilor", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverride = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("startup_discount_overrides")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Override eliminat - revenire la eligibilitate automată");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error removing override:", error);
      toast.error("Eroare la eliminarea override-ului", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isManualOverride = currentStatus?.eligibility_type === "manual_override";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gestionare Reducere Start-up
          </DialogTitle>
          <DialogDescription>
            Configurează eligibilitatea pentru reducerea Start-up pentru <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentStatus && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Status curent:</p>
              <p className="text-muted-foreground">
                {currentStatus.eligibility_type === "automatic" && "✓ Eligibil automat (cont nou)"}
                {currentStatus.eligibility_type === "manual_override" && "✓ Override manual activ"}
                {currentStatus.eligibility_type === "expired_override" && "⚠ Override expirat"}
                {currentStatus.eligibility_type === "not_eligible" && "✗ Nu este eligibil"}
                {currentStatus.is_eligible && ` - ${currentStatus.months_remaining} luni rămase`}
              </p>
              {currentStatus.notes && (
                <p className="text-xs text-muted-foreground mt-1">Note: {currentStatus.notes}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="eligible-switch" className="text-base">
                Eligibil pentru reducere
              </Label>
              <p className="text-sm text-muted-foreground">
                Activează reducerea de 50% pentru acest utilizator
              </p>
            </div>
            <Switch
              id="eligible-switch"
              checked={isEligible}
              onCheckedChange={setIsEligible}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires-at">Data expirării (opțional)</Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Lasă gol pentru eligibilitate nelimitată
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note (opțional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivul aprobării/revocării, detalii suplimentare..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isManualOverride && (
            <Button
              variant="destructive"
              onClick={handleRemoveOverride}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimină Override
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvează
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
