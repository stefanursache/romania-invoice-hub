import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserPlanManagerProps {
  user: {
    id: string;
    email: string;
    company_name: string;
    payment_plan: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UserPlanManager = ({ user, open, onOpenChange, onSuccess }: UserPlanManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user.payment_plan || "free");

  const handleUpdatePlan = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ payment_plan: selectedPlan })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`Plan actualizat la "${selectedPlan}" pentru ${user.company_name}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Eroare: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifică Planul Utilizator</DialogTitle>
          <DialogDescription>
            Actualizează planul de abonament pentru {user.company_name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plan curent: {user.payment_plan || "free"}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Noul plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (0 facturi)</SelectItem>
                <SelectItem value="starter">Starter (25 facturi, 3 membri)</SelectItem>
                <SelectItem value="professional">Professional (100 facturi, 10 membri)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Nelimitat)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Anulează
          </Button>
          <Button onClick={handleUpdatePlan} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizează Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
