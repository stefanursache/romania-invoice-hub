import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { create } from "https://esm.sh/xmlbuilder2@3.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaftPayload {
  header: {
    auditFileVersion: string;
    companyID: string;
    taxRegistrationNumber: string;
    companyName: string;
    registrationNumber: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    fiscalYear: number;
    startDate: string;
    endDate: string;
    currencyCode: string;
    dateCreated: string;
  };
  accounts: Array<{
    accountID: string;
    accountCode: string;
    accountDescription: string;
    accountType: string;
  }>;
  customers: Array<{
    id: string;
    name: string;
    taxID: string;
    address: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    taxID: string;
    address: string;
  }>;
  salesInvoices: Array<{
    invoiceNo: string;
    invoiceDate: string;
    customerId: string;
    grossTotal: number;
    taxPayable: number;
    netTotal: number;
    lines: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      netAmount: number;
      taxAmount: number;
      grossAmount: number;
    }>;
  }>;
  generalLedgerEntries: Array<{
    transactionID: string;
    transactionDate: string;
    description: string;
    lines: Array<{
      recordID: string;
      accountID: string;
      debitAmount: number;
      creditAmount: number;
    }>;
  }>;
}

function buildSafTXml(payload: SaftPayload): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('n1:AuditFile', {
      'xmlns:n1': 'urn:OECD:StandardAuditFile-Tax:RO_2.00',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    });

  // Header
  const header = root.ele('n1:Header');
  header.ele('n1:AuditFileVersion').txt(payload.header.auditFileVersion);
  header.ele('n1:CompanyID').txt(payload.header.companyID);
  header.ele('n1:TaxRegistrationNumber').txt(payload.header.taxRegistrationNumber);
  header.ele('n1:CompanyName').txt(payload.header.companyName);
  
  const companyAddress = header.ele('n1:CompanyAddress');
  companyAddress.ele('n1:StreetName').txt(payload.header.address);
  companyAddress.ele('n1:City').txt(payload.header.city);
  companyAddress.ele('n1:PostalCode').txt(payload.header.postalCode);
  companyAddress.ele('n1:Country').txt(payload.header.country);
  
  header.ele('n1:FiscalYear').txt(payload.header.fiscalYear.toString());
  header.ele('n1:StartDate').txt(payload.header.startDate);
  header.ele('n1:EndDate').txt(payload.header.endDate);
  header.ele('n1:CurrencyCode').txt(payload.header.currencyCode);
  header.ele('n1:DateCreated').txt(payload.header.dateCreated);
  header.ele('n1:ProductID').txt('SmartInvoice Romania');
  header.ele('n1:ProductVersion').txt('1.0');

  // Master Files
  const masterFiles = root.ele('n1:MasterFiles');
  
  // General Ledger Accounts
  if (payload.accounts.length > 0) {
    payload.accounts.forEach(account => {
      const accountNode = masterFiles.ele('n1:GeneralLedgerAccounts');
      accountNode.ele('n1:AccountID').txt(account.accountID);
      accountNode.ele('n1:AccountDescription').txt(account.accountDescription);
      accountNode.ele('n1:StandardAccountID').txt(account.accountCode);
      accountNode.ele('n1:AccountType').txt(account.accountType);
    });
  }
  
  // Customers
  if (payload.customers.length > 0) {
    payload.customers.forEach(customer => {
      const customerNode = masterFiles.ele('n1:Customer');
      customerNode.ele('n1:CustomerID').txt(customer.id);
      customerNode.ele('n1:CustomerTaxID').txt(customer.taxID || 'N/A');
      customerNode.ele('n1:CompanyName').txt(customer.name);
      
      const billingAddress = customerNode.ele('n1:BillingAddress');
      billingAddress.ele('n1:StreetName').txt(customer.address || 'N/A');
      billingAddress.ele('n1:City').txt('N/A');
      billingAddress.ele('n1:PostalCode').txt('N/A');
      billingAddress.ele('n1:Country').txt('RO');
    });
  }

  // Suppliers (for future use)
  if (payload.suppliers.length > 0) {
    payload.suppliers.forEach(supplier => {
      const supplierNode = masterFiles.ele('n1:Supplier');
      supplierNode.ele('n1:SupplierID').txt(supplier.id);
      supplierNode.ele('n1:SupplierTaxID').txt(supplier.taxID || 'N/A');
      supplierNode.ele('n1:CompanyName').txt(supplier.name);
      
      const address = supplierNode.ele('n1:SupplierAddress');
      address.ele('n1:StreetName').txt(supplier.address || 'N/A');
      address.ele('n1:City').txt('N/A');
      address.ele('n1:PostalCode').txt('N/A');
      address.ele('n1:Country').txt('RO');
    });
  }

  // Source Documents - Sales Invoices
  if (payload.salesInvoices.length > 0) {
    const sourceDocuments = root.ele('n1:SourceDocuments');
    const salesInvoicesNode = sourceDocuments.ele('n1:SalesInvoices');
    salesInvoicesNode.ele('n1:NumberOfEntries').txt(payload.salesInvoices.length.toString());
    
    const totalDebit = payload.salesInvoices.reduce((sum, inv) => sum + inv.grossTotal, 0);
    salesInvoicesNode.ele('n1:TotalDebit').txt(totalDebit.toFixed(2));
    salesInvoicesNode.ele('n1:TotalCredit').txt('0.00');

    payload.salesInvoices.forEach(invoice => {
      const invoiceNode = salesInvoicesNode.ele('n1:Invoice');
      invoiceNode.ele('n1:InvoiceNo').txt(invoice.invoiceNo);
      invoiceNode.ele('n1:InvoiceDate').txt(invoice.invoiceDate);
      invoiceNode.ele('n1:InvoiceType').txt('FT');
      invoiceNode.ele('n1:CustomerID').txt(invoice.customerId);
      
      const documentTotals = invoiceNode.ele('n1:DocumentTotals');
      documentTotals.ele('n1:TaxPayable').txt(invoice.taxPayable.toFixed(2));
      documentTotals.ele('n1:NetTotal').txt(invoice.netTotal.toFixed(2));
      documentTotals.ele('n1:GrossTotal').txt(invoice.grossTotal.toFixed(2));

      // Lines
      invoice.lines.forEach((line, idx) => {
        const lineNode = invoiceNode.ele('n1:Line');
        lineNode.ele('n1:LineNumber').txt((idx + 1).toString());
        lineNode.ele('n1:Description').txt(line.description);
        lineNode.ele('n1:Quantity').txt(line.quantity.toFixed(2));
        lineNode.ele('n1:UnitPrice').txt(line.unitPrice.toFixed(2));
        
        const taxNode = lineNode.ele('n1:Tax');
        taxNode.ele('n1:TaxType').txt('TVA');
        taxNode.ele('n1:TaxPercentage').txt(line.taxRate.toFixed(2));
        
        lineNode.ele('n1:TaxAmount').txt(line.taxAmount.toFixed(2));
        lineNode.ele('n1:TaxBase').txt(line.netAmount.toFixed(2));
        lineNode.ele('n1:LineExtensionAmount').txt(line.grossAmount.toFixed(2));
      });
    });
  }

  // General Ledger Entries
  if (payload.generalLedgerEntries.length > 0) {
    const generalLedger = root.ele('n1:GeneralLedgerEntries');
    generalLedger.ele('n1:NumberOfEntries').txt(payload.generalLedgerEntries.length.toString());
    
    const totalDebit = payload.generalLedgerEntries.reduce((sum, entry) => 
      sum + entry.lines.reduce((lineSum, line) => lineSum + line.debitAmount, 0), 0
    );
    const totalCredit = payload.generalLedgerEntries.reduce((sum, entry) => 
      sum + entry.lines.reduce((lineSum, line) => lineSum + line.creditAmount, 0), 0
    );
    
    generalLedger.ele('n1:TotalDebit').txt(totalDebit.toFixed(2));
    generalLedger.ele('n1:TotalCredit').txt(totalCredit.toFixed(2));

    payload.generalLedgerEntries.forEach(entry => {
      const journalNode = generalLedger.ele('n1:Journal');
      journalNode.ele('n1:JournalID').txt('1');
      journalNode.ele('n1:Description').txt('General Journal');
      
      const transactionNode = journalNode.ele('n1:Transaction');
      transactionNode.ele('n1:TransactionID').txt(entry.transactionID);
      transactionNode.ele('n1:Period').txt(new Date(entry.transactionDate).getMonth() + 1 + '');
      transactionNode.ele('n1:TransactionDate').txt(entry.transactionDate);
      transactionNode.ele('n1:Description').txt(entry.description);
      
      entry.lines.forEach(line => {
        const lineNode = transactionNode.ele('n1:Line');
        lineNode.ele('n1:RecordID').txt(line.recordID);
        lineNode.ele('n1:AccountID').txt(line.accountID);
        
        if (line.debitAmount > 0) {
          lineNode.ele('n1:DebitAmount').txt(line.debitAmount.toFixed(2));
        }
        if (line.creditAmount > 0) {
          lineNode.ele('n1:CreditAmount').txt(line.creditAmount.toFixed(2));
        }
      });
    });
  }

  return root.end({ prettyPrint: true });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { periodFrom, periodTo, workspaceOwnerId } = await req.json();

    // Determine the target user ID (company owner)
    let targetUserId = user.id;
    
    // If workspaceOwnerId is provided, verify accountant has access
    if (workspaceOwnerId) {
      const { data: access } = await supabaseClient
        .from('workspace_members')
        .select('id')
        .eq('member_user_id', user.id)
        .eq('workspace_owner_id', workspaceOwnerId)
        .single();
      
      if (!access) {
        throw new Error('You do not have access to this workspace');
      }
      
      targetUserId = workspaceOwnerId;
      console.log(`Accountant ${user.id} generating SAF-T for company ${targetUserId}`);
    }

    console.log(`Generating SAF-T for user ${targetUserId} from ${periodFrom} to ${periodTo}`);

    // Fetch company profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      throw new Error('Company profile not found');
    }

    // Fetch chart of accounts
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('account_code');

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
    }

    // Validate required Romanian accounts
    const requiredAccounts = ['4111', '707', '4427'];
    const accountCodes = (accounts || []).map(acc => acc.account_code);
    const missingAccounts = requiredAccounts.filter(code => !accountCodes.includes(code));
    
    if (missingAccounts.length > 0) {
      throw new Error(
        `Missing required Romanian standard accounts: ${missingAccounts.join(', ')}. ` +
        `Please add these accounts in Chart of Accounts before generating SAF-T. ` +
        `(4111 - Receivables, 707 - Revenue, 4427 - VAT Payable)`
      );
    }

    // Fetch customers (clients)
    const { data: clients, error: clientsError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('user_id', targetUserId);

    if (clientsError) {
      throw new Error('Error fetching clients');
    }

    // Fetch invoices for the period
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('user_id', targetUserId)
      .gte('issue_date', periodFrom)
      .lte('issue_date', periodTo)
      .order('issue_date');

    if (invoicesError) {
      throw new Error('Error fetching invoices');
    }

    // Fetch invoice items for all invoices
    const invoiceIds = invoices.map(inv => inv.id);
    const { data: allItems, error: itemsError } = await supabaseClient
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invoiceIds.length > 0 ? invoiceIds : ['00000000-0000-0000-0000-000000000000']);

    if (itemsError) {
      throw new Error('Error fetching invoice items');
    }

    // Build SAF-T payload
    const startDate = new Date(periodFrom);
    const endDate = new Date(periodTo);
    const fiscalYear = startDate.getFullYear();

    const payload: SaftPayload = {
      header: {
        auditFileVersion: '2.00',
        companyID: profile.cui_cif || 'N/A',
        taxRegistrationNumber: profile.cui_cif || 'N/A',
        companyName: profile.company_name,
        registrationNumber: profile.reg_com || 'N/A',
        address: profile.address || 'N/A',
        city: profile.city || 'N/A',
        postalCode: profile.postal_code || 'N/A',
        country: profile.country || 'Romania',
        fiscalYear,
        startDate: periodFrom,
        endDate: periodTo,
        currencyCode: 'RON',
        dateCreated: new Date().toISOString().split('T')[0],
      },
      accounts: (accounts || []).map(account => ({
        accountID: account.id,
        accountCode: account.account_code,
        accountDescription: account.account_name,
        accountType: account.account_type || 'asset',
      })),
      customers: (clients || []).map(client => ({
        id: client.id,
        name: client.name,
        taxID: client.cui_cif || 'N/A',
        address: client.address || 'N/A',
      })),
      suppliers: [],
      salesInvoices: (invoices || []).map(invoice => {
        const items = (allItems || []).filter(item => item.invoice_id === invoice.id);
        return {
          invoiceNo: invoice.invoice_number,
          invoiceDate: invoice.issue_date,
          customerId: invoice.client_id,
          grossTotal: parseFloat(invoice.total.toString()),
          taxPayable: parseFloat(invoice.vat_amount.toString()),
          netTotal: parseFloat(invoice.subtotal.toString()),
          lines: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity.toString()),
            unitPrice: parseFloat(item.unit_price.toString()),
            taxRate: item.vat_rate,
            netAmount: parseFloat(item.subtotal.toString()),
            taxAmount: parseFloat(item.vat_amount.toString()),
            grossAmount: parseFloat(item.total.toString()),
          })),
        };
      }),
      generalLedgerEntries: (invoices || []).map((invoice, idx) => {
        const items = (allItems || []).filter(item => item.invoice_id === invoice.id);
        const lineIndex = idx * 2;
        
        return {
          transactionID: invoice.id,
          transactionDate: invoice.issue_date,
          description: `Sales Invoice ${invoice.invoice_number}`,
          lines: [
            {
              recordID: `${lineIndex + 1}`,
              accountID: accounts?.find(a => a.account_code === '4111')?.id || 'default-receivable',
              debitAmount: parseFloat(invoice.total.toString()),
              creditAmount: 0,
            },
            {
              recordID: `${lineIndex + 2}`,
              accountID: accounts?.find(a => a.account_code === '707')?.id || 'default-revenue',
              debitAmount: 0,
              creditAmount: parseFloat(invoice.subtotal.toString()),
            },
            ...(parseFloat(invoice.vat_amount.toString()) > 0 ? [{
              recordID: `${lineIndex + 3}`,
              accountID: accounts?.find(a => a.account_code === '4427')?.id || 'default-vat',
              debitAmount: 0,
              creditAmount: parseFloat(invoice.vat_amount.toString()),
            }] : []),
          ],
        };
      }),
    };

    // Generate XML
    const xmlContent = buildSafTXml(payload);

    // Save export record
    const { data: exportRecord, error: exportError } = await supabaseClient
      .from('saft_exports')
      .insert({
        user_id: targetUserId,
        period_from: periodFrom,
        period_to: periodTo,
        file_data: xmlContent,
        status: 'generated',
      })
      .select()
      .single();

    if (exportError) {
      console.error('Error saving export record:', exportError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        exportId: exportRecord?.id,
        xml: xmlContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating SAF-T:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
