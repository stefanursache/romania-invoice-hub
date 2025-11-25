import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  payment_terms: number;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cui_cif: "",
    reg_com: "",
    address: "",
    email: "",
    phone: "",
    payment_terms: 30,
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Eroare la încărcarea clienților");
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(formData)
        .eq("id", editingClient.id);

      if (error) {
        toast.error("Eroare la actualizare");
      } else {
        toast.success("Client actualizat!");
        loadClients();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("clients")
        .insert([{ ...formData, user_id: user.id }]);

      if (error) {
        toast.error("Eroare la creare");
      } else {
        toast.success("Client creat!");
        loadClients();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi acest client?")) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      toast.error("Eroare la ștergere");
    } else {
      toast.success("Client șters!");
      loadClients();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      cui_cif: "",
      reg_com: "",
      address: "",
      email: "",
      phone: "",
      payment_terms: 30,
    });
    setEditingClient(null);
    setDialogOpen(false);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      cui_cif: client.cui_cif || "",
      reg_com: client.reg_com || "",
      address: client.address || "",
      email: client.email || "",
      phone: client.phone || "",
      payment_terms: client.payment_terms,
    });
    setDialogOpen(true);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Clienți</h1>
            <p className="text-muted-foreground">Gestionează clienții tăi</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Client nou
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Editează client" : "Client nou"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nume *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cui_cif">CUI/CIF</Label>
                    <Input
                      id="cui_cif"
                      value={formData.cui_cif}
                      onChange={(e) => setFormData({ ...formData, cui_cif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg_com">Nr. Reg. Com.</Label>
                    <Input
                      id="reg_com"
                      value={formData.reg_com}
                      onChange={(e) => setFormData({ ...formData, reg_com: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Termene plată (zile)</Label>
                    <Input
                      id="payment_terms"
                      type="number"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Adresă</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Anulează
                  </Button>
                  <Button type="submit">
                    {editingClient ? "Actualizează" : "Creează"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nu ai clienți încă</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă primul client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{client.name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {client.cui_cif && (
                    <p><span className="font-medium">CUI:</span> {client.cui_cif}</p>
                  )}
                  {client.email && (
                    <p className="truncate"><span className="font-medium">Email:</span> {client.email}</p>
                  )}
                  {client.phone && (
                    <p><span className="font-medium">Tel:</span> {client.phone}</p>
                  )}
                  <p><span className="font-medium">Termene:</span> {client.payment_terms} zile</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;