import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { ro } from "date-fns/locale";
import { Building2, User, Calendar, CreditCard, FileText } from "lucide-react";

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status: string;
    currency: string;
    invoice_type: string;
    subtotal: number;
    vat_amount: number;
    total: number;
    notes?: string;
    accountant_approved?: boolean;
    clients: {
      name: string;
      cui_cif?: string;
      reg_com?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
  } | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    subtotal: number;
    vat_amount: number;
    total: number;
  }>;
  company: {
    company_name: string;
    cui_cif?: string;
    reg_com?: string;
    address?: string;
    bank_account?: string;
  };
}

export const InvoicePreview = ({ open, onOpenChange, invoice, items, company }: InvoicePreviewProps) => {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {invoice.invoice_type === "proforma" ? "Proforma" : "Factură"} #{invoice.invoice_number}
            </DialogTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
              {invoice.accountant_approved && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aprobată
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Section */}
          <div className="bg-primary/5 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Supplier Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <Building2 className="h-4 w-4" />
                  Furnizor
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{company.company_name}</p>
                  {company.cui_cif && <p className="text-sm text-muted-foreground">CUI: {company.cui_cif}</p>}
                  {company.reg_com && <p className="text-sm text-muted-foreground">Reg. Com: {company.reg_com}</p>}
                  {company.address && <p className="text-sm text-muted-foreground">{company.address}</p>}
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                  <User className="h-4 w-4" />
                  Client
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{invoice.clients.name}</p>
                  {invoice.clients.cui_cif && <p className="text-sm text-muted-foreground">CUI: {invoice.clients.cui_cif}</p>}
                  {invoice.clients.reg_com && <p className="text-sm text-muted-foreground">Reg. Com: {invoice.clients.reg_com}</p>}
                  {invoice.clients.address && <p className="text-sm text-muted-foreground">{invoice.clients.address}</p>}
                  {invoice.clients.email && <p className="text-sm text-muted-foreground">{invoice.clients.email}</p>}
                  {invoice.clients.phone && <p className="text-sm text-muted-foreground">{invoice.clients.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data emiterii</p>
                <p className="font-semibold">{format(new Date(invoice.issue_date), "dd MMM yyyy", { locale: ro })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Scadență</p>
                <p className="font-semibold">{format(new Date(invoice.due_date), "dd MMM yyyy", { locale: ro })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Monedă</p>
                <p className="font-semibold">{invoice.currency}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Produse / Servicii
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Descriere</th>
                    <th className="text-center p-3 text-sm font-semibold">Cant.</th>
                    <th className="text-right p-3 text-sm font-semibold">Preț unitar</th>
                    <th className="text-center p-3 text-sm font-semibold">TVA</th>
                    <th className="text-right p-3 text-sm font-semibold">Subtotal</th>
                    <th className="text-right p-3 text-sm font-semibold">TVA</th>
                    <th className="text-right p-3 text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-muted/30">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">{item.unit_price.toFixed(2)} {invoice.currency}</td>
                      <td className="p-3 text-center">{item.vat_rate}%</td>
                      <td className="p-3 text-right">{item.subtotal.toFixed(2)}</td>
                      <td className="p-3 text-right">{item.vat_amount.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">{item.total.toFixed(2)} {invoice.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">{invoice.subtotal.toFixed(2)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">TVA:</span>
                <span className="font-semibold">{invoice.vat_amount.toFixed(2)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary text-primary-foreground rounded-lg">
                <span className="text-lg font-bold">TOTAL:</span>
                <span className="text-2xl font-bold">{invoice.total.toFixed(2)} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Bank Account */}
          {company.bank_account && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Cont bancar (IBAN)</p>
              <p className="font-mono font-semibold">{company.bank_account}</p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">Observații</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
