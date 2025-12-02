import { supabase } from "@/integrations/supabase/client";

export interface AdminExportData {
  exportedAt: string;
  exportedBy: string;
  profiles: any[];
  clients: any[];
  invoices: any[];
  invoiceItems: any[];
  expenses: any[];
  products: any[];
  accounts: any[];
  stockMovements: any[];
  bankStatements: any[];
  saftExports: any[];
  userRoles: any[];
  userSubscriptions: any[];
  paymentTransactions: any[];
  workspaceMembers: any[];
  accessRequests: any[];
  webhookEvents: any[];
  blogPosts: any[];
}

export const exportAllAdminData = async (): Promise<AdminExportData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return null;

  // Fetch all data in parallel (admin has access to all tables)
  const [
    profilesRes,
    clientsRes,
    invoicesRes,
    invoiceItemsRes,
    expensesRes,
    productsRes,
    accountsRes,
    stockMovementsRes,
    bankStatementsRes,
    saftExportsRes,
    userRolesRes,
    userSubscriptionsRes,
    paymentTransactionsRes,
    workspaceMembersRes,
    accessRequestsRes,
    webhookEventsRes,
    blogPostsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("invoice_items").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("products").select("*"),
    supabase.from("accounts").select("*"),
    supabase.from("stock_movements").select("*"),
    supabase.from("bank_statements").select("*"),
    supabase.from("saft_exports").select("*"),
    supabase.from("user_roles").select("*"),
    supabase.from("user_subscriptions").select("*"),
    supabase.from("payment_transactions").select("*"),
    supabase.from("workspace_members").select("*"),
    supabase.from("access_requests").select("*"),
    supabase.from("webhook_events").select("*"),
    supabase.from("blog_posts").select("*"),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    exportedBy: user.email || user.id,
    profiles: profilesRes.data || [],
    clients: clientsRes.data || [],
    invoices: invoicesRes.data || [],
    invoiceItems: invoiceItemsRes.data || [],
    expenses: expensesRes.data || [],
    products: productsRes.data || [],
    accounts: accountsRes.data || [],
    stockMovements: stockMovementsRes.data || [],
    bankStatements: bankStatementsRes.data || [],
    saftExports: saftExportsRes.data || [],
    userRoles: userRolesRes.data || [],
    userSubscriptions: userSubscriptionsRes.data || [],
    paymentTransactions: paymentTransactionsRes.data || [],
    workspaceMembers: workspaceMembersRes.data || [],
    accessRequests: accessRequestsRes.data || [],
    webhookEvents: webhookEventsRes.data || [],
    blogPosts: blogPostsRes.data || [],
  };
};

export const downloadAdminExportAsJson = (data: AdminExportData, filename: string = "admin-database-export.json") => {
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
