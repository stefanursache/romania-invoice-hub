import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function StripeProductSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "setup-stripe-products"
      );

      if (invokeError) throw invokeError;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.results);
      toast.success("Produsele Stripe au fost create cu succes!");
    } catch (err: any) {
      console.error("Error setting up products:", err);
      setError(err.message || "A apărut o eroare la crearea produselor");
      toast.error("Eroare la crearea produselor Stripe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Configurare Produse Stripe
        </CardTitle>
        <CardDescription>
          Creează produsele și prețurile din pagina de pricing în Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Atenție:</strong> Această acțiune va crea următoarele produse în Stripe:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Starter - 49 RON/lună sau 490 RON/an</li>
              <li>Professional - 99 RON/lună sau 990 RON/an</li>
            </ul>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>Succes!</strong> Au fost create {result.length} produse:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {result.map((r: any) => (
                  <li key={r.product.id}>
                    {r.product.name} (ID: {r.product.id})
                    <ul className="list-circle list-inside ml-4 text-sm">
                      <li>Monthly: {r.prices.monthly.amount / 100} RON</li>
                      <li>Annual: {r.prices.annual.amount / 100} RON</li>
                    </ul>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSetup} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se creează produsele...
            </>
          ) : (
            "Creează Produsele în Stripe"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
