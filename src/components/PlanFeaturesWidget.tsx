import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface PlanFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { name: "Facturi/lună", starter: "25", professional: "100", enterprise: "Nelimitat" },
  { name: "Membri în echipă", starter: "3", professional: "10", enterprise: "Nelimitat" },
  { name: "Gestionare clienți", starter: true, professional: true, enterprise: true },
  { name: "Generare PDF + XML", starter: true, professional: true, enterprise: true },
  { name: "e-Factura (ANAF)", starter: true, professional: true, enterprise: true },
  { name: "SAF-T (D406) automat", starter: true, professional: true, enterprise: true },
  { name: "Rapoarte de bază", starter: true, professional: true, enterprise: true },
  { name: "Gestiune stocuri avansată", starter: false, professional: true, enterprise: true },
  { name: "Rapoarte avansate", starter: false, professional: true, enterprise: true },
  { name: "API acces complet", starter: false, professional: true, enterprise: true },
  { name: "Multi-locație", starter: false, professional: true, enterprise: true },
  { name: "Backup automat zilnic", starter: false, professional: true, enterprise: true },
  { name: "White-label branding", starter: false, professional: false, enterprise: true },
  { name: "Integrări personalizate", starter: false, professional: false, enterprise: true },
  { name: "Manager de cont dedicat", starter: false, professional: false, enterprise: true },
  { name: "SLA garantat 99.9%", starter: false, professional: false, enterprise: true },
];

export const PlanFeaturesWidget = () => {
  const { limits, loading } = usePlanLimits();

  if (loading || !limits) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentPlan = limits.plan.toLowerCase();
  const getPlanValue = (feature: PlanFeature) => {
    switch (currentPlan) {
      case "starter":
        return feature.starter;
      case "professional":
        return feature.professional;
      case "enterprise":
        return feature.enterprise;
      default:
        return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl capitalize">Plan {limits.plan}</CardTitle>
            <CardDescription className="mt-2">
              Caracteristici și limite pentru planul curent
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Crown className="h-4 w-4 mr-2" />
            {currentPlan === "starter" ? "15 RON/lună" : currentPlan === "professional" ? "299 RON/an" : "Personalizat"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Facturi luna aceasta</p>
              <p className="text-2xl font-bold">
                {limits.invoicesThisMonth} / {limits.invoiceLimit === Infinity ? "∞" : limits.invoiceLimit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Membri în echipă</p>
              <p className="text-2xl font-bold">
                {limits.currentMembers} / {limits.memberLimit === Infinity ? "∞" : limits.memberLimit}
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div>
          <h3 className="font-semibold mb-4">Caracteristici disponibile</h3>
          <div className="space-y-2">
            {features.map((feature, index) => {
              const value = getPlanValue(feature);
              const hasFeature = value === true || (typeof value === "string" && value !== "0");
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className={hasFeature ? "text-foreground" : "text-muted-foreground"}>
                    {feature.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof value === "string" ? (
                      <Badge variant="secondary" className="font-semibold">
                        {value}
                      </Badge>
                    ) : value ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade CTA */}
        {currentPlan !== "enterprise" && (
          <div className="pt-4 border-t">
            <Link to="/pricing">
              <Button className="w-full" size="lg">
                <Crown className="h-4 w-4 mr-2" />
                Actualizează planul
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
