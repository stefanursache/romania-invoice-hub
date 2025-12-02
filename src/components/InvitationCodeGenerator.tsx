import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvitationCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
}

export const InvitationCodeGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState<InvitationCode | null>(null);
  const [countdown, setCountdown] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentCode();
  }, []);

  // Countdown timer that updates every second
  useEffect(() => {
    if (!currentCode || new Date(currentCode.expires_at) < new Date()) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(currentCode.expires_at).getTime();
      const timeLeft = expiryTime - now;

      if (timeLeft <= 0) {
        setCountdown("Expirat");
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentCode]);

  const loadCurrentCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the most recent valid code
      const { data, error } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("workspace_owner_id", user.id)
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading code:", error);
        return;
      }

      setCurrentCode(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const generateNewCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a unique code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc("generate_invitation_code");

      if (codeError) throw codeError;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Insert the new code
      const { data, error } = await supabase
        .from("invitation_codes")
        .insert({
          code: codeData,
          workspace_owner_id: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentCode(data);
      toast({
        title: "Cod generat cu succes!",
        description: "Codul este valabil 24 de ore.",
      });
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut genera codul. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (currentCode) {
      navigator.clipboard.writeText(currentCode.code);
      toast({
        title: "Copiat!",
        description: "Codul a fost copiat în clipboard.",
      });
    }
  };

  const isExpired = currentCode && new Date(currentCode.expires_at) < new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Cod de invitație pentru contabil
        </CardTitle>
        <CardDescription>
          Generează un cod unic pe care contabilul tău îl poate folosi pentru a se alătura workspace-ului tău.
          Codul este valabil 24 de ore.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentCode && !isExpired ? (
          <div className="space-y-4">
            <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Cod activ:</span>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Activ
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-3xl font-bold tracking-widest text-primary">
                  {currentCode.code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Timp rămas: <strong className="text-foreground text-base font-mono">{countdown}</strong>
                </span>
              </div>
            </div>

            <Button
              onClick={generateNewCode}
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Generează cod nou
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isExpired && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      Codul a expirat
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Ultimul cod a expirat. Generează unul nou pentru a invita un contabil.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={generateNewCode}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {isExpired ? "Generează cod nou" : "Generează primul cod"}
            </Button>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Cum funcționează:</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Generează un cod și trimite-l contabilului tău</li>
            <li>Contabilul va introduce codul în panoul său</li>
            <li>După confirmare, contabilul va avea acces la datele tale</li>
            <li>Codul este valabil 24 de ore și poate fi folosit o singură dată</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
