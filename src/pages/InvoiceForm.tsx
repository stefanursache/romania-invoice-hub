import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Loader2, Save, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  payment_terms: number;
}

interface NewClientData {
  name: string;
  cui_cif: string;
  reg_com: string;
  address: string;
  email: string;
  phone: string;
  payment_terms: number;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
}

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [formData, setFormData] = useState({
    invoice_number: "",
    client_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    currency: "RON",
    notes: "",
    invoice_type: "invoice" as "invoice" | "proforma",
  });
  const [newClientData, setNewClientData] = useState<NewClientData>({
    name: "",
    cui_cif: "",
    reg_com: "",
    address: "",
    email: "",
    phone: "",
    payment_terms: 30,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: 19,
      subtotal: 0,
      vat_amount: 0,
      total: 0,
    },
  ]);

  useEffect(() => {
    loadClients();
    if (id) {
      loadInvoice();
    } else {
      generateInvoiceNumber();
    }
  }, [id]);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id, name, payment_terms")
      .eq("user_id", user.id)
      .order("name");

    if (!error && data) {
      setClients(data);
    }
  };

  const generateInvoiceNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const year = new Date().getFullYear();
    let nextNumber = 1;

    if (data && data.length > 0) {
      const lastNumber = data[0].invoice_number;
      const match = lastNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    setFormData((prev) => ({
      ...prev,
      invoice_number: `${year}-${nextNumber.toString().padStart(4, "0")}`,
    }));
  };

  const loadInvoice = async () => {
    if (!id) return;
    setLoading(true);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError) {
      toast.error("Eroare la încărcare");
      navigate("/invoices");
      return;
    }

    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    if (!itemsError && items) {
      setLineItems(
        items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          vat_rate: item.vat_rate,
          subtotal: Number(item.subtotal),
          vat_amount: Number(item.vat_amount),
          total: Number(item.total),
        }))
      );
    }

    setFormData({
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      currency: invoice.currency,
      notes: invoice.notes || "",
      invoice_type: (invoice.invoice_type as "invoice" | "proforma") || "invoice",
    });

    setLoading(false);
  };

  const calculateLineItem = (item: Partial<LineItem>): LineItem => {
    const quantity = item.quantity || 0;
    const unit_price = item.unit_price || 0;
    const vat_rate = item.vat_rate || 19;

    const subtotal = quantity * unit_price;
    const vat_amount = (subtotal * vat_rate) / 100;
    const total = subtotal + vat_amount;

    return {
      id: item.id || crypto.randomUUID(),
      description: item.description || "",
      quantity,
      unit_price,
      vat_rate,
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(vat_amount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    newItems[index] = calculateLineItem(newItems[index]);
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 19,
        subtotal: 0,
        vat_amount: 0,
        total: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const vat_amount = lineItems.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = lineItems.reduce((sum, item) => sum + item.total, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(vat_amount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId }));

    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const dueDate = new Date(formData.issue_date);
      dueDate.setDate(dueDate.getDate() + client.payment_terms);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleNewClientPaymentTermsChange = (terms: number) => {
    setNewClientData((prev) => ({ ...prev, payment_terms: terms }));
    
    const dueDate = new Date(formData.issue_date);
    dueDate.setDate(dueDate.getDate() + terms);
    setFormData((prev) => ({
      ...prev,
      due_date: dueDate.toISOString().split("T")[0],
    }));
  };

  const createNewClient = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: userId,
          name: newClientData.name,
          cui_cif: newClientData.cui_cif || null,
          reg_com: newClientData.reg_com || null,
          address: newClientData.address || null,
          email: newClientData.email || null,
          phone: newClientData.phone || null,
          payment_terms: newClientData.payment_terms,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(`Eroare la crearea clientului: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    // Validate client selection or new client data
    if (clientMode === "existing" && !formData.client_id) {
      toast.error("Selectează un client");
      return;
    }

    if (clientMode === "new" && !newClientData.name.trim()) {
      toast.error("Introdu numele clientului");
      return;
    }

    if (lineItems.some((item) => !item.description)) {
      toast.error("Toate liniile trebuie să aibă o descriere");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let clientId = formData.client_id;

    // Create new client if in "new" mode
    if (clientMode === "new") {
      const newClientId = await createNewClient(user.id);
      if (!newClientId) {
        setLoading(false);
        return;
      }
      clientId = newClientId;
      toast.success("Client nou adăugat!");
    }

    const totals = calculateTotals();

    try {
      if (id) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            ...formData,
            client_id: clientId,
            ...totals,
            status,
          })
          .eq("id", id);

        if (invoiceError) throw invoiceError;

        // Delete old items
        await supabase.from("invoice_items").delete().eq("invoice_id", id);

        // Insert new items
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            lineItems.map((item) => ({
              invoice_id: id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate,
              subtotal: item.subtotal,
              vat_amount: item.vat_amount,
              total: item.total,
            }))
          );

        if (itemsError) throw itemsError;
      } else {
        // Create new invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert([
            {
              user_id: user.id,
              ...formData,
              client_id: clientId,
              ...totals,
              status,
            },
          ])
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Insert items
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            lineItems.map((item) => ({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate,
              subtotal: item.subtotal,
              vat_amount: item.vat_amount,
              total: item.total,
            }))
          );

        if (itemsError) throw itemsError;
      }

      toast.success(
        status === "draft" ? "Factură salvată ca ciornă" : "Factură trimisă!"
      );
      navigate("/invoices");
    } catch (error: any) {
      toast.error(error.message || "Eroare la salvare");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {id ? "Editare factură" : "Factură nouă"}
            </h1>
            <p className="text-muted-foreground">
              Completează detaliile facturii
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informații generale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_type">Tip document *</Label>
                <Select
                  value={formData.invoice_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, invoice_type: value as "invoice" | "proforma" })
                  }
                >
                  <SelectTrigger id="invoice_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Factură fiscală</SelectItem>
                    <SelectItem value="proforma">Proformă</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_number">Număr {formData.invoice_type === "proforma" ? "proformă" : "factură"} *</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_number: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Data emiterii *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Scadență *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <RadioGroup value={clientMode} onValueChange={(value) => setClientMode(value as "existing" | "new")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="cursor-pointer">Selectează client existent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="cursor-pointer flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Adaugă client nou
                    </Label>
                  </div>
                </RadioGroup>

                {clientMode === "existing" ? (
                  <Select
                    value={formData.client_id}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg bg-accent/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="client_name">Nume client *</Label>
                        <Input
                          id="client_name"
                          placeholder="Ex: SRL Consulting"
                          value={newClientData.name}
                          onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_cui">CUI/CIF</Label>
                        <Input
                          id="client_cui"
                          placeholder="RO12345678"
                          value={newClientData.cui_cif}
                          onChange={(e) => setNewClientData({ ...newClientData, cui_cif: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_reg">Nr. Reg. Com.</Label>
                        <Input
                          id="client_reg"
                          placeholder="J40/1234/2020"
                          value={newClientData.reg_com}
                          onChange={(e) => setNewClientData({ ...newClientData, reg_com: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_email">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          placeholder="client@exemplu.ro"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_phone">Telefon</Label>
                        <Input
                          id="client_phone"
                          placeholder="+40 123 456 789"
                          value={newClientData.phone}
                          onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_payment">Termen plată (zile)</Label>
                        <Input
                          id="client_payment"
                          type="number"
                          min="0"
                          value={newClientData.payment_terms}
                          onChange={(e) => handleNewClientPaymentTermsChange(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_address">Adresă</Label>
                      <Textarea
                        id="client_address"
                        placeholder="Strada, număr, oraș, județ, cod poștal"
                        value={newClientData.address}
                        onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>


              <div className="space-y-2">
                <Label htmlFor="currency">Monedă</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RON">RON</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produse / Servicii</CardTitle>
            <Button onClick={addLineItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă linie
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <div className="min-w-[800px] space-y-4">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-end pb-4 border-b"
                  >
                    <div className="col-span-4 space-y-2">
                      <Label>Descriere *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        placeholder="Ex: Consultanță IT"
                      />
                    </div>

                    <div className="col-span-1 space-y-2">
                      <Label>Cant.</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Preț unitar</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-1 space-y-2">
                      <Label>TVA %</Label>
                      <Select
                        value={item.vat_rate.toString()}
                        onValueChange={(value) =>
                          updateLineItem(index, "vat_rate", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="19">19% (Standard)</SelectItem>
                          <SelectItem value="9">9% (Redus)</SelectItem>
                          <SelectItem value="5">5% (Super-redus)</SelectItem>
                          <SelectItem value="0">0% (Scutit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Subtotal</Label>
                      <Input
                        value={item.subtotal.toFixed(2)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="col-span-1 space-y-2">
                      <Label>TVA</Label>
                      <Input
                        value={item.vat_amount.toFixed(2)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {totals.subtotal.toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA:</span>
                  <span className="font-medium">
                    {totals.vat_amount.toFixed(2)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    {totals.total.toFixed(2)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/invoices")}
            disabled={loading}
          >
            Anulează
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvează ca ciornă
          </Button>
          <Button onClick={() => handleSubmit("sent")} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Finalizează și trimite
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceForm;