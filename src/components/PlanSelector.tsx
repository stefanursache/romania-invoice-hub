import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    displayName: "Starter",
    monthlyPrice: 49,
    annualPrice: 490,
    currency: "RON",
    features: [
      "25 facturi/lună",
      "3 membri în echipă",
      "Gestionare clienți",
      "Generare PDF + XML",
      "e-Factura ANAF",
      "SAF-T (D406) automat",
      "Rapoarte de bază",
    ],
  },
  {
    name: "Professional",
    displayName: "Professional",
    monthlyPrice: 99,
    annualPrice: 990,
    currency: "RON",
    features: [
      "100 facturi/lună",
      "10 membri în echipă",
      "Toate din Starter +",
      "Gestiune stocuri avansată",
      "Rapoarte avansate",
      "API acces complet",
      "Multi-locație",
      "Backup automat zilnic",
    ],
    recommended: true,
  },
  {
    name: "Enterprise",
    displayName: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "RON",
    features: [
      "Facturi nelimitate",
      "Membri nelimitați",
      "Toate din Professional +",
      "White-label branding",
      "Integrări personalizate",
      "Manager de cont dedicat",
      "SLA garantat 99.9%",
    ],
  },
];

interface PlanSelectorProps {
  currentPlan?: string;
  onPlanSelect?: (planName: string, billingPeriod: string) => void;
}

export function PlanSelector({ currentPlan, onPlanSelect }: PlanSelectorProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planName: string) => {
    if (planName === "Enterprise") {
      toast.info("Contactează echipa noastră pentru un plan personalizat", {
        description: "Vom lua legătura cu tine în cel mai scurt timp.",
      });
      return;
    }

    if (onPlanSelect) {
      onPlanSelect(planName, billingPeriod);
      return;
    }

    setProcessingPlan(planName);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Trebuie să fii autentificat pentru a cumpăra un plan");
        return;
      }

      console.log('Calling create-checkout-session with:', { planName, billingPeriod });
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planName,
          billingPeriod,
        },
      });

      console.log('Response:', { data, error });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Eroare la procesarea plății. Contactează administratorul.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return "Preț personalizat";
    const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice;
    return `${price} ${plan.currency}`;
  };

  const getPeriodLabel = () => {
    return billingPeriod === "monthly" ? "/lună" : "/an";
  };

  return (
    <div className="space-y-6">
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4 p-1 bg-muted rounded-lg max-w-md mx-auto">
        <Button
          variant={billingPeriod === "monthly" ? "default" : "ghost"}
          onClick={() => setBillingPeriod("monthly")}
          className="flex-1"
        >
          Lunar
        </Button>
        <Button
          variant={billingPeriod === "annual" ? "default" : "ghost"}
          onClick={() => setBillingPeriod("annual")}
          className="flex-1 relative"
        >
          Anual
          <Badge variant="secondary" className="ml-2 absolute -top-2 -right-2">
            <Sparkles className="h-3 w-3" />
          </Badge>
        </Button>
      </div>

      {billingPeriod === "annual" && (
        <div className="text-center">
          <Badge variant="default" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Economisești 2 luni la plata anuală
          </Badge>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.toLowerCase() === plan.name.toLowerCase();
          const isRecommended = plan.recommended;

          return (
            <Card
              key={plan.name}
              className={`relative ${
                isRecommended ? "border-primary shadow-lg" : ""
              } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Recomandat
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    Plan curent
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                <CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.monthlyPrice === 0 ? "Custom" : getPrice(plan)}
                    </span>
                    {plan.monthlyPrice !== 0 && (
                      <span className="text-muted-foreground ml-1">
                        {getPeriodLabel()}
                      </span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isRecommended ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.name)}
                  disabled={isCurrentPlan || processingPlan === plan.name}
                >
                  {processingPlan === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : isCurrentPlan ? (
                    "Plan activ"
                  ) : plan.name === "Enterprise" ? (
                    "Contactează-ne"
                  ) : (
                    `Alege ${plan.displayName}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Toate planurile includ suport tehnic și actualizări gratuite</p>
        <p className="mt-1">Poți anula abonamentul oricând din setări</p>
      </div>
    </div>
  );
}
