import { supabase } from "@/integrations/supabase/client";

export interface ExportData {
  exportedAt: string;
  profile: any;
  clients: any[];
  invoices: any[];
  invoiceItems: any[];
  expenses: any[];
  products: any[];
  accounts: any[];
  stockMovements: any[];
  bankStatements: any[];
  saftExports: any[];
}

export const exportAllUserData = async (): Promise<ExportData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all user data in parallel
  const [
    profileRes,
    clientsRes,
    invoicesRes,
    expensesRes,
    productsRes,
    accountsRes,
    stockMovementsRes,
    bankStatementsRes,
    saftExportsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("clients").select("*").eq("user_id", user.id),
    supabase.from("invoices").select("*").eq("user_id", user.id),
    supabase.from("expenses").select("*").eq("user_id", user.id),
    supabase.from("products").select("*").eq("user_id", user.id),
    supabase.from("accounts").select("*").eq("user_id", user.id),
    supabase.from("stock_movements").select("*").eq("user_id", user.id),
    supabase.from("bank_statements").select("*").eq("user_id", user.id),
    supabase.from("saft_exports").select("*").eq("user_id", user.id),
  ]);

  // Fetch invoice items for all user invoices
  const invoiceIds = invoicesRes.data?.map(inv => inv.id) || [];
  let invoiceItems: any[] = [];
  
  if (invoiceIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds);
    invoiceItems = itemsData || [];
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: profileRes.data,
    clients: clientsRes.data || [],
    invoices: invoicesRes.data || [],
    invoiceItems,
    expenses: expensesRes.data || [],
    products: productsRes.data || [],
    accounts: accountsRes.data || [],
    stockMovements: stockMovementsRes.data || [],
    bankStatements: bankStatementsRes.data || [],
    saftExports: saftExportsRes.data || [],
  };
};

export const downloadAsJson = (data: ExportData, filename: string = "smartinvoice-export.json") => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
