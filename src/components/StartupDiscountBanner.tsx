import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiscountStatus {
  is_eligible: boolean;
  eligibility_type: string;
  months_remaining: number;
  notes: string | null;
}

export function StartupDiscountBanner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(null);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_startup_discount_eligibility", {
        _user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDiscountStatus(data[0]);
      }
    } catch (error) {
      console.error("Error checking startup discount eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !discountStatus) return null;
  if (discountStatus.is_eligible && discountStatus.eligibility_type !== "expired_override") {
    return (
      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/30">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {discountStatus.eligibility_type === "manual_override" 
            ? "Reducere Start-up Aprobată Manual!" 
            : "Ești eligibil pentru Reducerea Start-up!"}
          <Badge variant="default" className="bg-green-600">
            {discountStatus.months_remaining < 999 
              ? `${discountStatus.months_remaining} ${discountStatus.months_remaining === 1 ? "lună" : "luni"} rămase`
              : "Nelimitat"}
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="mb-2">
            🎉 <strong>Felicitări!</strong> Beneficiezi de <strong>50% reducere</strong> la abonament.
            {discountStatus.eligibility_type === "manual_override" && " (Aprobat manual de administrator)"}
          </p>
          {discountStatus.notes && (
            <p className="text-sm mb-2 italic">
              Note: {discountStatus.notes}
            </p>
          )}
          <p className="text-sm">
            Reducerea se aplică automat și va fi vizibilă în factura ta.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (discountStatus.eligibility_type === "expired_override") {
    return (
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          Reducerea Start-up a expirat
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Perioada cu reducere de 50% pentru start-up-uri s-a încheiat. 
          Prețul abonamentului va reveni la valoarea standard începând cu următoarea factură.
          {discountStatus.notes && (
            <p className="text-sm mt-1 italic">Note: {discountStatus.notes}</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
