import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Shield, Crown } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Acces interzis");
        navigate("/admin");
        return;
      }

      await loadAllData();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/admin");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profilesData, requestsData, rolesData] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      ]);

      setProfiles(profilesData.data || []);
      setAccessRequests(requestsData.data || []);
      setUserRoles(rolesData.data || []);
    } catch (error: any) {
      toast.error("Eroare la încărcarea datelor", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentPlan = async (userId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ payment_plan: plan })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Plan de plată actualizat");
      await loadAllData();
    } catch (error: any) {
      toast.error("Eroare la actualizarea planului", { description: error.message });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Rol actualizat");
      await loadAllData();
    } catch (error: any) {
      toast.error("Eroare la actualizarea rolului", { description: error.message });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Panou Administrare</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Ieșire
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizatori</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roluri Active</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRoles.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profiles">Utilizatori & Planuri</TabsTrigger>
            <TabsTrigger value="roles">Roluri</TabsTrigger>
            <TabsTrigger value="requests">Cereri Acces</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilizatori & Planuri de Plată</CardTitle>
                <CardDescription>Gestionează utilizatorii și planurile lor de plată</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Companie</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CUI/CIF</TableHead>
                      <TableHead>Plan Plată</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.company_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.cui_cif || "-"}</TableCell>
                        <TableCell>
                          <Select
                            value={profile.payment_plan || "free"}
                            onValueChange={(value) => updatePaymentPlan(profile.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{new Date(profile.created_at).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roluri Utilizatori</CardTitle>
                <CardDescription>Editează rolurile utilizatorilor din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => {
                      const profile = profiles.find(p => p.id === role.user_id);
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-mono text-xs">{role.user_id}</TableCell>
                          <TableCell>{profile?.email || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={role.role}
                              onValueChange={(value) => updateUserRole(role.user_id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{new Date(role.created_at).toLocaleDateString("ro-RO")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cereri de Acces</CardTitle>
                <CardDescription>Solicitări de acces contabil</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Solicitare</TableHead>
                      <TableHead>Data Răspuns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.business_owner_email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "accepted"
                                ? "default"
                                : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requested_at).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell>
                          {request.responded_at
                            ? new Date(request.responded_at).toLocaleDateString("ro-RO")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
