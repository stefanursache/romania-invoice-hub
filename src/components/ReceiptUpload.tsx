import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, CheckCircle, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ExtractedReceiptData {
  expense_date: string;
  merchant: string;
  category: string;
  amount: number;
  vat_amount: number;
  currency: string;
  description: string;
  confidence: number;
}

const EXPENSE_CATEGORIES = [
  "Transporturi",
  "Cazare",
  "Masa (restaurant)",
  "Materiale/Echipamente",
  "Servicii profesionale",
  "Utilitati",
  "Marketing/Publicitate",
  "Birotica",
  "Combustibil",
  "Telefonie/Internet",
  "Altele"
];

export const ReceiptUpload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtractedReceiptData>>({});

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
    setEditedData({});

    try {
      const { data, error } = await supabase.functions.invoke("extract-receipt-data", {
        body: { imageBase64 },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedData(data);
      setEditedData(data);
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
    if (!editedData || !extractedData) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nu ești autentificat");
        return;
      }

      const { error } = await supabase
        .from("expenses")
        .insert({
          user_id: user.id,
          expense_date: editedData.expense_date || extractedData.expense_date,
          merchant: editedData.merchant || extractedData.merchant,
          category: editedData.category || extractedData.category,
          amount: editedData.amount || extractedData.amount,
          vat_amount: editedData.vat_amount || extractedData.vat_amount,
          currency: editedData.currency || extractedData.currency,
          description: editedData.description || extractedData.description,
          image_url: imagePreview,
          status: "draft",
        });

      if (error) {
        throw new Error("Eroare la salvarea cheltuielii");
      }

      toast.success("Cheltuiala a fost salvată!");
      navigate("/expenses");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Eroare la salvarea cheltuielii");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setExtractedData(null);
    setEditedData({});
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-success text-white";
    if (confidence >= 0.5) return "bg-warning text-white";
    return "bg-destructive text-white";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scanează chitanță/bon fiscal</CardTitle>
        <CardDescription>
          Încarcă o imagine cu o chitanță pentru a extrage automat datele și categoriza cheltuiala
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!imagePreview ? (
          <div>
            <Label htmlFor="receipt-image" className="cursor-pointer">
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
              id="receipt-image"
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
                alt="Receipt preview"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Date extrase cu succes!</p>
                  </div>
                  <Badge className={getConfidenceColor(extractedData.confidence)}>
                    Încredere: {(extractedData.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                {extractedData.confidence < 0.7 && (
                  <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Încredere scăzută</p>
                      <p className="text-muted-foreground">
                        Te rugăm să verifici și să corectezi datele extrase înainte de salvare.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense_date">Data cheltuielii</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={editedData.expense_date || extractedData.expense_date}
                        onChange={(e) => setEditedData({ ...editedData, expense_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="merchant">Comerciant</Label>
                      <Input
                        id="merchant"
                        value={editedData.merchant || extractedData.merchant}
                        onChange={(e) => setEditedData({ ...editedData, merchant: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Categorie</Label>
                    <Select
                      value={editedData.category || extractedData.category}
                      onValueChange={(value) => setEditedData({ ...editedData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount">Valoare totală</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={editedData.amount || extractedData.amount}
                        onChange={(e) => setEditedData({ ...editedData, amount: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vat_amount">TVA</Label>
                      <Input
                        id="vat_amount"
                        type="number"
                        step="0.01"
                        value={editedData.vat_amount || extractedData.vat_amount}
                        onChange={(e) => setEditedData({ ...editedData, vat_amount: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Monedă</Label>
                      <Select
                        value={editedData.currency || extractedData.currency}
                        onValueChange={(value) => setEditedData({ ...editedData, currency: value })}
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

                  <div>
                    <Label htmlFor="description">Descriere</Label>
                    <Textarea
                      id="description"
                      value={editedData.description || extractedData.description}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                      rows={3}
                    />
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
                      "Salvează cheltuiala"
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