import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ExtractedInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client: {
    name: string;
    cui_cif?: string | null;
    reg_com?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
  notes?: string | null;
}

export const InvoiceImageUpload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Te rog să încarci un fișier imagine");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imaginea este prea mare. Maxim 10MB.");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setImagePreview(base64);
        setUploading(false);
        
        // Process the image
        await processImage(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Eroare la încărcarea imaginii");
      setUploading(false);
    }
  };

  const processImage = async (imageBase64: string) => {
    setProcessing(true);
    setExtractedData(null);

    try {
      const { data, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: { imageBase64 },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedData(data);
      toast.success("Datele au fost extrase cu succes!");
    } catch (error: any) {
      console.error("Error processing image:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Limită de utilizare depășită. Încearcă mai târziu.");
      } else if (error.message?.includes("Payment required")) {
        toast.error("Este nevoie să adaugi credite la workspace.");
      } else {
        toast.error("Eroare la procesarea imaginii. Încearcă din nou.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nu ești autentificat");
        return;
      }

      // First, check if client exists or create it
      let clientId: string;
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("name", extractedData.client.name)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: extractedData.client.name,
            cui_cif: extractedData.client.cui_cif,
            reg_com: extractedData.client.reg_com,
            address: extractedData.client.address,
            email: extractedData.client.email,
            phone: extractedData.client.phone,
            user_id: user.id,
          })
          .select()
          .single();

        if (clientError || !newClient) {
          throw new Error("Eroare la crearea clientului");
        }

        clientId = newClient.id;
      }

      // Calculate totals
      const items = extractedData.items.map((item) => {
        const subtotal = item.quantity * item.unit_price;
        const vat_amount = subtotal * item.vat_rate;
        const total = subtotal + vat_amount;
        return {
          ...item,
          subtotal,
          vat_amount,
          total,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const vat_amount = items.reduce((sum, item) => sum + item.vat_amount, 0);
      const total = subtotal + vat_amount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: extractedData.invoice_number,
          issue_date: extractedData.issue_date,
          due_date: extractedData.due_date,
          client_id: clientId,
          currency: extractedData.currency,
          subtotal,
          vat_amount,
          total,
          notes: extractedData.notes,
          status: "draft",
          user_id: user.id,
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        throw new Error("Eroare la crearea facturii");
      }

      // Create invoice items
      const { error: itemsError } = await supabase.from("invoice_items").insert(
        items.map((item) => ({
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

      if (itemsError) {
        throw new Error("Eroare la adăugarea liniilor");
      }

      toast.success("Factura a fost salvată!");
      navigate(`/invoices`);
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Eroare la salvarea facturii");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setExtractedData(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import factură din imagine</CardTitle>
        <CardDescription>
          Încarcă o imagine cu o factură pentru a extrage automat datele
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!imagePreview ? (
          <div>
            <Label htmlFor="invoice-image" className="cursor-pointer">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Apasă pentru a încărca o imagine
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP până la 10MB
                </p>
              </div>
            </Label>
            <Input
              id="invoice-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Invoice preview"
                className="w-full max-h-96 object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {processing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Procesăm imaginea și extragem datele...
                </p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Date extrase cu succes!</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Număr factură</p>
                      <p className="font-medium">{extractedData.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Client</p>
                      <p className="font-medium">{extractedData.client.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data emiterii</p>
                      <p className="font-medium">
                        {new Date(extractedData.issue_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scadență</p>
                      <p className="font-medium">
                        {new Date(extractedData.due_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-2">Linii factură</p>
                    <div className="space-y-2">
                      {extractedData.items.map((item, idx) => (
                        <div key={idx} className="bg-background rounded p-2">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {item.unit_price} {extractedData.currency} (TVA{" "}
                            {(item.vat_rate * 100).toFixed(0)}%)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      "Salvează factura"
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Anulează
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};