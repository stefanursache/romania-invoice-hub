import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, FileSpreadsheet, Eye } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/utils/exportUtils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ReceiptUpload } from "@/components/ReceiptUpload";

interface Expense {
  id: string;
  expense_date: string;
  merchant: string;
  category: string;
  amount: number;
  vat_amount: number;
  currency: string;
  description: string;
  status: string;
  image_url: string | null;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false });

    if (error) {
      toast.error("Eroare la încărcarea cheltuielilor");
      console.error(error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Transporturi": "bg-blue-500 text-white",
      "Cazare": "bg-purple-500 text-white",
      "Masa (restaurant)": "bg-orange-500 text-white",
      "Materiale/Echipamente": "bg-gray-500 text-white",
      "Servicii profesionale": "bg-indigo-500 text-white",
      "Utilitati": "bg-yellow-600 text-white",
      "Marketing/Publicitate": "bg-pink-500 text-white",
      "Birotica": "bg-green-500 text-white",
      "Combustibil": "bg-red-500 text-white",
      "Telefonie/Internet": "bg-cyan-500 text-white",
      "Altele": "bg-slate-500 text-white",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const handleExportCSV = () => {
    const exportData = expenses.map((expense) => ({
      date: expense.expense_date,
      merchant: expense.merchant,
      category: expense.category,
      amount: Number(expense.amount),
      vat_amount: Number(expense.vat_amount),
      currency: expense.currency,
      description: expense.description,
      status: expense.status,
    }));

    exportToCSV(exportData, `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success("Cheltuieli exportate în CSV!");
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVAT = expenses.reduce((sum, exp) => sum + Number(exp.vat_amount), 0);

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
            <h1 className="text-4xl font-bold mb-2">Cheltuieli</h1>
            <p className="text-muted-foreground">Gestionează cheltuielile și chitanțele tale</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Scanează chitanță
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <ReceiptUpload />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total cheltuieli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalExpenses.toFixed(2)} RON
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total TVA deductibil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalVAT.toFixed(2)} RON
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Număr chitanțe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expenses.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nu ai cheltuieli înregistrate încă</p>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Scanează prima chitanță
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <ReceiptUpload />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{expense.merchant}</CardTitle>
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </div>
                    {expense.image_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedImage(expense.image_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {new Date(expense.expense_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Descriere</p>
                      <p className="font-medium">{expense.description}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">TVA</p>
                      <p className="font-medium">
                        {expense.vat_amount.toFixed(2)} {expense.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">
                        {expense.amount.toFixed(2)} {expense.currency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image preview dialog */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <img
                src={selectedImage}
                alt="Receipt"
                className="w-full h-auto rounded-lg"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Expenses;