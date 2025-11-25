import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Profile {
  company_name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
  bank_account: string | null;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    company_name: "",
    cui_cif: "",
    reg_com: "",
    address: "",
    bank_account: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Eroare la încărcarea profilului");
    } else if (data) {
      setProfile({
        company_name: data.company_name,
        cui_cif: data.cui_cif || "",
        reg_com: data.reg_com || "",
        address: data.address || "",
        bank_account: data.bank_account || "",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);

    if (error) {
      toast.error("Eroare la salvare");
    } else {
      toast.success("Profil actualizat!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Setări</h1>
          <p className="text-muted-foreground">Configurează datele companiei tale</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informații companie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nume companie *</Label>
                <Input
                  id="company_name"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cui_cif">CUI/CIF</Label>
                  <Input
                    id="cui_cif"
                    value={profile.cui_cif || ""}
                    onChange={(e) => setProfile({ ...profile, cui_cif: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_com">Nr. Reg. Com.</Label>
                  <Input
                    id="reg_com"
                    value={profile.reg_com || ""}
                    onChange={(e) => setProfile({ ...profile, reg_com: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresă</Label>
                <Textarea
                  id="address"
                  value={profile.address || ""}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">IBAN</Label>
                <Input
                  id="bank_account"
                  value={profile.bank_account || ""}
                  onChange={(e) => setProfile({ ...profile, bank_account: e.target.value })}
                  placeholder="RO49AAAA1B31007593840000"
                />
              </div>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvează modificările
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;