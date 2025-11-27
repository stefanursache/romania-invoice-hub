import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { differenceInMonths, parseISO } from "date-fns";

interface Profile {
  created_at: string;
  payment_plan: string | null;
}

export function StartupDiscountBanner() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [monthsSinceCreation, setMonthsSinceCreation] = useState<number>(0);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("created_at, payment_plan")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);
        
        // Check if company was created within the last 12 months
        const createdAt = parseISO(profileData.created_at);
        const monthsDiff = differenceInMonths(new Date(), createdAt);
        setMonthsSinceCreation(monthsDiff);
        
        // Eligible if created less than 12 months ago
        const eligible = monthsDiff <= 12;
        setIsEligible(eligible);
      }
    } catch (error) {
      console.error("Error checking startup discount eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) return null;

  // Don't show banner for free plan users
  if (profile.payment_plan === "free") return null;

  if (isEligible) {
    const monthsRemaining = Math.max(0, 12 - monthsSinceCreation);
    
    return (
      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/30">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Ești eligibil pentru Reducerea Start-up!
          <Badge variant="default" className="bg-green-600">
            {monthsRemaining} {monthsRemaining === 1 ? "lună" : "luni"} rămase
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="mb-2">
            🎉 <strong>Felicitări!</strong> Compania ta a fost înființată în ultimele 12 luni, 
            deci beneficiezi de <strong>50% reducere</strong> la abonament.
          </p>
          <p className="text-sm">
            Reducerea se aplică automat pentru primele {monthsRemaining} {monthsRemaining === 1 ? "lună" : "luni"} 
            și va fi vizibilă în factura ta.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEligible === false && monthsSinceCreation > 12 && monthsSinceCreation <= 14) {
    return (
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          Reducerea Start-up a expirat
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Perioada de 12 luni cu reducere de 50% pentru start-up-uri s-a încheiat. 
          Prețul abonamentului va reveni la valoarea standard începând cu următoarea factură.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
