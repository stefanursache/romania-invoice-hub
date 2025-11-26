import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InvitationCodeInput = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoinWithCode = async () => {
    if (!code || code.length !== 8) {
      toast({
        title: "Cod invalid",
        description: "Codul trebuie să conțină 8 caractere.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Eroare",
          description: "Trebuie să fii autentificat.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is an accountant
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "accountant") {
        toast({
          title: "Eroare",
          description: "Doar contabilii pot folosi coduri de invitație.",
          variant: "destructive",
        });
        return;
      }

      // Find the invitation code
      const { data: inviteData, error: inviteError } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (inviteError || !inviteData) {
        toast({
          title: "Cod invalid",
          description: "Codul nu există, a expirat sau a fost deja folosit.",
          variant: "destructive",
        });
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_owner_id", inviteData.workspace_owner_id)
        .eq("member_user_id", user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Deja membru",
          description: "Ești deja membru al acestui workspace.",
          variant: "destructive",
        });
        return;
      }

      // Add to workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_owner_id: inviteData.workspace_owner_id,
          member_user_id: user.id,
          role: "accountant",
        });

      if (memberError) throw memberError;

      // Mark code as used
      const { error: updateError } = await supabase
        .from("invitation_codes")
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", inviteData.id);

      if (updateError) throw updateError;

      toast({
        title: "Succes!",
        description: "Ai fost adăugat cu succes la workspace.",
      });

      setCode("");
      
      // Refresh the page to show new workspace
      setTimeout(() => {
        navigate("/accountant-dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error joining workspace:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut folosi codul. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Alătură-te unui workspace
        </CardTitle>
        <CardDescription>
          Introdu codul de invitație primit de la companie pentru a accesa datele lor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg tracking-widest font-mono uppercase"
              disabled={loading}
            />
            <Button
              onClick={handleJoinWithCode}
              disabled={loading || code.length !== 8}
              className="gap-2 min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se verifică...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Alătură-te
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Codul conține 8 caractere alfanumerice și este valabil 24 de ore.
          </p>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Notă:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Codul poate fi folosit o singură dată</li>
            <li>După ce te alături, vei avea acces complet la datele companiei</li>
            <li>Vei vedea noul workspace în dashboard-ul tău</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
