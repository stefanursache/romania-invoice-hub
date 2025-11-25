import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
  currency: string;
  clients: {
    name: string;
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Eroare la încărcarea facturilor");
      console.error(error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-white";
      case "sent":
        return "bg-primary text-primary-foreground";
      case "overdue":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Ciornă";
      case "sent":
        return "Trimisă";
      case "paid":
        return "Plătită";
      case "overdue":
        return "Restanță";
      default:
        return status;
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Facturi</h1>
            <p className="text-muted-foreground">Gestionează facturile tale</p>
          </div>
          <Link to="/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Factură nouă
            </Button>
          </Link>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nu ai facturi încă</p>
              <Link to="/invoices/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Creează prima factură
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Factură #{invoice.invoice_number}
                    </CardTitle>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Client</p>
                      <p className="font-medium">{invoice.clients.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data emiterii</p>
                      <p className="font-medium">
                        {new Date(invoice.issue_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scadență</p>
                      <p className="font-medium">
                        {new Date(invoice.due_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">
                          {invoice.total.toFixed(2)} {invoice.currency}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Invoices;