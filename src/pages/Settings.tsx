import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Building2, KeyRound, User, Cloud, CreditCard, ArrowLeft, Crown } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { PlanFeaturesWidget } from "@/components/PlanFeaturesWidget";

interface Profile {
  company_name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
  bank_account: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  county: string | null;
  postal_code: string | null;
  spv_client_id: string | null;
  spv_client_secret: string | null;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Parola curentă este obligatorie"),
  newPassword: z.string()
    .min(8, "Parola nouă trebuie să conțină minimum 8 caractere")
    .regex(/[A-Z]/, "Trebuie să conțină cel puțin o literă mare")
    .regex(/[a-z]/, "Trebuie să conțină cel puțin o literă mică")
    .regex(/[0-9]/, "Trebuie să conțină cel puțin o cifră"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceOwnerId = searchParams.get('workspace_owner_id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isViewingClient, setIsViewingClient] = useState(false);
  const [profileOwnerId, setProfileOwnerId] = useState<string>("");
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [testingSpvCredentials, setTestingSpvCredentials] = useState(false);
  const [spvTestResult, setSpvTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [profile, setProfile] = useState<Profile>({
    company_name: "",
    cui_cif: "",
    reg_com: "",
    address: "",
    bank_account: "",
    phone: "",
    email: "",
    city: "",
    county: "",
    postal_code: "",
    spv_client_id: "",
    spv_client_secret: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load subscription
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subData) {
      setSubscription(subData);
    }

    // Load transactions
    const { data: transData } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (transData) {
      setTransactions(transData);
    }
  };

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setUserRole(roleData?.role || null);

    // Determine which profile to load
    let targetUserId = user.id;
    let viewingClient = false;

    if (workspaceOwnerId && roleData?.role === 'accountant') {
      // Verify accountant has access to this workspace
      const { data: hasAccess } = await supabase
        .rpc('has_workspace_access', {
          _workspace_owner_id: workspaceOwnerId,
          _user_id: user.id
        });

      if (hasAccess) {
        targetUserId = workspaceOwnerId;
        viewingClient = true;
        setIsViewingClient(true);
        setProfileOwnerId(workspaceOwnerId);
      } else {
        toast.error("Nu aveți acces la acest profil");
        navigate('/settings');
        return;
      }
    } else {
      setProfileOwnerId(user.id);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Settings: Error loading profile:", error);
      toast.error(t("settings.errors.loadFailed") || "Failed to load profile");
    } else if (data) {
      console.log("Settings: Profile loaded:", data);
      setProfile({
        company_name: data.company_name,
        cui_cif: data.cui_cif || "",
        reg_com: data.reg_com || "",
        address: data.address || "",
        bank_account: data.bank_account || "",
        phone: data.phone || "",
        email: data.email || "",
        city: data.city || "",
        county: data.county || "",
        postal_code: data.postal_code || "",
        spv_client_id: data.spv_client_id || "",
        spv_client_secret: data.spv_client_secret || "",
      });
    } else {
      console.warn("Settings: No profile data found");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nu ești autentificat");
        setSaving(false);
        return;
      }

      // Use profileOwnerId for updates (could be client's ID if accountant is viewing)
      const targetUserId = profileOwnerId || user.id;

      console.log("Updating profile for user:", targetUserId, "with data:", profile);

      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();

      let data, error;

      if (!existingProfile) {
        // Profile doesn't exist, create it (fallback)
        console.warn("Profile doesn't exist, creating new profile");
        const result = await supabase
          .from("profiles")
          .insert({
            id: targetUserId,
            ...profile,
          })
          .select()
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      } else {
        // Profile exists, update it
        const result = await supabase
          .from("profiles")
          .update(profile)
          .eq("id", targetUserId)
          .select()
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error saving profile:", error);
        toast.error(`Eroare la salvare: ${error.message}`);
      } else {
        console.log("Profile saved successfully:", data);
        toast.success(isViewingClient ? "Profil client actualizat!" : "Profil actualizat!");
        // Reload profile to show saved data
        await loadProfile();
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error(`Eroare: ${error.message || 'Eroare necunoscută'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      const validation = passwordSchema.safeParse(passwordData);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setChangingPassword(false);
        return;
      }

      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Nu s-a putut identifica utilizatorul");
        setChangingPassword(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast.error("Parola curentă este incorectă");
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        toast.error("Eroare la schimbarea parolei");
      } else {
        toast.success("Parolă schimbată cu succes!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error("A apărut o eroare");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'Gratuit') {
      toast.info('Planul Gratuit este deja activ pentru toate conturile noi');
      return;
    }

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planName,
          billingPeriod: 'monthly', // Default to monthly, can be made configurable
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Eroare la procesarea plății. Vă rugăm contactați administratorul.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleTestSpvCredentials = async () => {
    if (!profile.spv_client_id || !profile.spv_client_secret) {
      toast.error('Vă rugăm introduceți Client ID și Client Secret');
      return;
    }

    setTestingSpvCredentials(true);
    setSpvTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-spv-credentials', {
        body: {
          clientId: profile.spv_client_id,
          clientSecret: profile.spv_client_secret,
          workspaceOwnerId: isViewingClient ? profileOwnerId : undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        setSpvTestResult({ success: true, message: data.message });
        toast.success('Credențialele SPV sunt valide! ✅');
      } else {
        setSpvTestResult({ success: false, message: data.error });
        toast.error(`Test eșuat: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error testing SPV credentials:', error);
      const errorMessage = error.message || 'Eroare la testarea credențialelor';
      setSpvTestResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setTestingSpvCredentials(false);
    }
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
      <div className="max-w-4xl space-y-6">
        {isViewingClient && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/clients')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la clienți
          </Button>
        )}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {isViewingClient ? `Setări client: ${profile.company_name}` : t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            {isViewingClient 
              ? "Gestionează setările și credențialele SPV ale clientului" 
              : t('settings.subtitle')
            }
          </p>
          {userRole === "accountant" && !isViewingClient && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>{t('settings.accountantNote')}</strong> {t('settings.accountantNoteDesc')}
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue={isViewingClient ? "spv" : (userRole === "accountant" ? "account" : "company")} className="w-full">
          <TabsList className={`grid w-full ${
            isViewingClient 
              ? "grid-cols-2" 
              : (userRole === "accountant" ? "grid-cols-2" : "grid-cols-6")
          }`}>
            {!isViewingClient && userRole !== "accountant" && (
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companie
              </TabsTrigger>
            )}
            {(isViewingClient || userRole !== "accountant") && (
              <TabsTrigger value="spv" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                SPV / e-Factura
              </TabsTrigger>
            )}
            {!isViewingClient && (
              <>
                {userRole !== "accountant" && (
                  <>
                    <TabsTrigger value="plan" className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Plan
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Abonament
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {userRole === "accountant" ? "Cont personal" : "Contact"}
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Securitate
                </TabsTrigger>
              </>
            )}
            {isViewingClient && (
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informații companie
              </TabsTrigger>
            )}
          </TabsList>

          {(isViewingClient || userRole !== "accountant") && (
            <TabsContent value="company" className="space-y-4">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 Important pentru configurarea contului tău
                </h3>
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Completează toate informațiile companiei pentru a putea genera facturi corecte și conforme cu legislația românească:
                </p>
                <ul className="text-sm text-blue-900 dark:text-blue-100 list-disc list-inside space-y-1">
                  <li><strong>CUI/CIF</strong> și <strong>Reg. Com.</strong> sunt necesare pentru facturi fiscale</li>
                  <li><strong>IBAN</strong> va apărea pe facturile tale pentru plăți</li>
                  <li><strong>Adresa completă</strong> este obligatorie pentru documentele oficiale</li>
                </ul>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Informații companie</CardTitle>
                  <CardDescription>Datele firmei tale pentru facturi și documente oficiale</CardDescription>
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
                          placeholder="RO12345678"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg_com">Nr. Reg. Com.</Label>
                        <Input
                          id="reg_com"
                          value={profile.reg_com || ""}
                          onChange={(e) => setProfile({ ...profile, reg_com: e.target.value })}
                          placeholder="J40/1234/2020"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresă</Label>
                      <Textarea
                        id="address"
                        value={profile.address || ""}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        rows={2}
                        placeholder="Strada, număr, bloc, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Oraș</Label>
                        <Input
                          id="city"
                          value={profile.city || ""}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          placeholder="București"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="county">Județ</Label>
                        <Input
                          id="county"
                          value={profile.county || ""}
                          onChange={(e) => setProfile({ ...profile, county: e.target.value })}
                          placeholder="Ilfov"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Cod poștal</Label>
                        <Input
                          id="postal_code"
                          value={profile.postal_code || ""}
                          onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                          placeholder="012345"
                        />
                      </div>
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
            </TabsContent>
          )}

          {(isViewingClient || userRole !== "accountant") && (
            <TabsContent value="spv" className="space-y-4">
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  🔐 Cum să obții credențialele SPV ANAF
                </h3>
                <p className="text-sm text-amber-900 dark:text-amber-100 mb-3">
                  Pentru a trimite automat facturile în Spațiul Privat Virtual (SPV) ANAF, trebuie să obții credențiale OAuth:
                </p>
                <ol className="text-sm text-amber-900 dark:text-amber-100 list-decimal list-inside space-y-2">
                  <li>Accesează <a href="https://www.anaf.ro" target="_blank" rel="noopener noreferrer" className="underline font-semibold">portalul ANAF</a> cu certificatul digital al firmei</li>
                  <li>Mergi la secțiunea <strong>Spațiul Privat Virtual</strong> → <strong>API REST</strong></li>
                  <li>Solicită acces API pentru <strong>e-Factura</strong></li>
                  <li>După aprobare (2-5 zile lucrătoare), vei primi <strong>Client ID</strong> și <strong>Client Secret</strong></li>
                  <li>Introdu credențialele mai jos pentru integrare automată</li>
                </ol>
                <p className="text-xs text-amber-900 dark:text-amber-100 mt-3">
                  💡 <strong>Tip:</strong> Credențialele sunt stocate securizat și criptate. Doar tu ai acces la ele.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Integrare SPV / e-Factura ANAF</CardTitle>
                  <CardDescription>Configurează trimiterea automată a facturilor în SPV</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="spv_client_id">Client ID OAuth ANAF</Label>
                      <Input
                        id="spv_client_id"
                        type="text"
                        value={profile.spv_client_id || ""}
                        onChange={(e) => {
                          setProfile({ ...profile, spv_client_id: e.target.value });
                          setSpvTestResult(null); // Clear test result when credentials change
                        }}
                        placeholder="ex: 1234567890abcdefghij"
                      />
                      <p className="text-xs text-muted-foreground">
                        ID-ul clientului OAuth primit de la ANAF pentru accesul la API-ul e-Factura
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spv_client_secret">Client Secret OAuth ANAF</Label>
                      <Input
                        id="spv_client_secret"
                        type="password"
                        value={profile.spv_client_secret || ""}
                        onChange={(e) => {
                          setProfile({ ...profile, spv_client_secret: e.target.value });
                          setSpvTestResult(null); // Clear test result when credentials change
                        }}
                        placeholder="••••••••••••••••••••"
                      />
                      <p className="text-xs text-muted-foreground">
                        Secret-ul clientului OAuth (se păstrează confidențial și criptat)
                      </p>
                    </div>

                    {/* Test Connection Button */}
                    {profile.spv_client_id && profile.spv_client_secret && (
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestSpvCredentials}
                          disabled={testingSpvCredentials}
                        >
                          {testingSpvCredentials ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testare conexiune...
                            </>
                          ) : (
                            'Testează conexiunea'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Test Result Display */}
                    {spvTestResult && (
                      <div className={`p-3 border rounded-lg ${
                        spvTestResult.success 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      }`}>
                        <p className={`text-sm font-semibold flex items-center gap-2 ${
                          spvTestResult.success 
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}>
                          {spvTestResult.success ? '✅' : '❌'} {spvTestResult.success ? 'Test reușit!' : 'Test eșuat'}
                        </p>
                        <p className={`text-xs mt-1 ${
                          spvTestResult.success 
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}>
                          {spvTestResult.message}
                        </p>
                      </div>
                    )}

                    {profile.spv_client_id && profile.spv_client_secret && !spvTestResult && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          ℹ️ <strong>Recomandare:</strong> Testează conexiunea înainte de a salva
                        </p>
                        <p className="text-xs text-blue-900 dark:text-blue-100 mt-1">
                          Verificăm dacă credențialele sunt valide și accesul la API-ul ANAF funcționează
                        </p>
                      </div>
                    )}

                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvează configurarea SPV
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isViewingClient && userRole !== "accountant" && (
            <TabsContent value="plan" className="space-y-4">
              <PlanFeaturesWidget />
            </TabsContent>
          )}

          {!isViewingClient && userRole !== "accountant" && (
            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan de abonament curent</CardTitle>
                  <CardDescription>Gestionează planul tău de plată și metoda de plată</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold capitalize">{subscription.plan_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subscription.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : subscription.status === 'canceled'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {subscription.status === 'active' ? 'Activ' : subscription.status === 'canceled' ? 'Anulat' : subscription.status}
                          </span>
                        </div>
                        {subscription.current_period_end && (
                          <p className="text-sm text-muted-foreground">
                            {subscription.cancel_at_period_end 
                              ? `Se anulează la: ${new Date(subscription.current_period_end).toLocaleDateString('ro-RO')}`
                              : `Se reînnoiește la: ${new Date(subscription.current_period_end).toLocaleDateString('ro-RO')}`
                            }
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Metodă de plată</h4>
                        <div className="p-3 border rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">•••• •••• •••• ••••</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Actualizează cardul
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pentru a actualiza cardul, contactează suportul sau accesează portal-ul de plăți.
                        </p>
                      </div>

                      <Button variant="outline" onClick={() => navigate('/pricing')}>
                        Schimbă planul
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">Alege un plan pentru afacerea ta</p>
                      </div>

                      {/* Pricing Plans Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Free Plan */}
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <span>Gratuit</span>
                            </CardTitle>
                            <CardDescription>Perfect pentru startup-uri și teste</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">0 RON<span className="text-sm font-normal text-muted-foreground">/lună</span></div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>5 facturi/lună</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>1 utilizator</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Generare PDF facturi</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Gestionare clienți</span>
                              </li>
                            </ul>
                            <Button variant="outline" className="w-full" disabled>
                              Plan curent
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Starter Plan - Recommended */}
                        <Card className="border-2 border-primary shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <span>Starter</span>
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Recomandat</span>
                            </CardTitle>
                            <CardDescription>Pentru întreprinderi mici și PFA</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">19 RON<span className="text-sm font-normal text-muted-foreground">/lună</span></div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Facturi nelimitate</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>3 utilizatori</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>e-Factura (ANAF) inclusă</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>SAF-T (D406) automat</span>
                              </li>
                            </ul>
                            <Button 
                              className="w-full" 
                              onClick={() => handleSelectPlan('Starter')}
                              disabled={processingPayment}
                            >
                              {processingPayment ? 'Se procesează...' : 'Selectează Starter'}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Professional Plan */}
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="text-lg">Professional</CardTitle>
                            <CardDescription>Pentru afaceri în creștere</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">49 RON<span className="text-sm font-normal text-muted-foreground">/lună</span></div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Tot din Starter +</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>10 utilizatori</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>API acces complet</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Suport prioritar 24/7</span>
                              </li>
                            </ul>
                            <Button 
                              className="w-full" 
                              variant="outline" 
                              onClick={() => handleSelectPlan('Professional')}
                              disabled={processingPayment}
                            >
                              {processingPayment ? 'Se procesează...' : 'Selectează Professional'}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Enterprise Plan */}
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <span>Enterprise</span>
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">Personalizat</span>
                            </CardTitle>
                            <CardDescription>Pentru corporații și companii mari</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">Custom</div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Tot din Professional +</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Utilizatori nelimitați</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>Manager cont dedicat</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                <span>SLA garantat 99.9%</span>
                              </li>
                            </ul>
                            <Button className="w-full" variant="outline" onClick={() => navigate('/contact')}>
                              Contactează vânzări
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Istoric facturi</CardTitle>
                  <CardDescription>Vizualizează facturile tale de abonament</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{transaction.description || 'Plată abonament'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString('ro-RO', { 
                                day: '2-digit',
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {transaction.amount} {transaction.currency?.toUpperCase() || 'RON'}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              transaction.status === 'succeeded' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : transaction.status === 'failed'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {transaction.status === 'succeeded' ? 'Plătit' : transaction.status === 'failed' ? 'Eșuat' : transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nu există facturi disponibile</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isViewingClient && (
            <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{userRole === "accountant" ? "Informații cont" : "Informații de contact"}</CardTitle>
                <CardDescription>
                  {userRole === "accountant" 
                    ? "Setările contului tău personal ca și contabil"
                    : "Date de contact pentru comunicare cu clienții"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {userRole === "accountant" && (
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Nume afișat</Label>
                      <Input
                        id="account_name"
                        value={profile.company_name}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        placeholder="Numele tău complet"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Acest nume va fi vizibil pentru companiile pe care le gestionezi
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+40 123 456 789"
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvează modificările
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {!isViewingClient && (
            <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schimbă parola</CardTitle>
                <CardDescription>Asigură-te că folosești o parolă puternică pentru a-ți proteja contul</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Parola curentă</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Parola nouă</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum 8 caractere, o literă mare, o literă mică și o cifră
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmă parola nouă</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>

                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Schimbă parola
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;