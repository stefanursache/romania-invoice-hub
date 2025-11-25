import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
}

interface Client {
  name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
}

interface Profile {
  company_name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
  bank_account: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  vat_amount: number;
  total: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          cui_cif,
          reg_com,
          address
        )
      `)
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      throw new Error("Failed to fetch invoice items");
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Generate eFactura XML
    const xml = generateEFacturaXML(
      invoice as Invoice & { clients: Client },
      items as InvoiceItem[],
      profile as Profile
    );

    console.log("Generated eFactura XML for invoice:", invoiceId);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="eFactura-${invoice.invoice_number}.xml"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating eFactura XML:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateEFacturaXML(
  invoice: Invoice & { clients: Client },
  items: InvoiceItem[],
  profile: Profile
): string {
  const escapeXml = (str: string | null | undefined): string => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const formatDate = (date: string): string => {
    return new Date(date).toISOString().split("T")[0];
  };

  // Simplified eFactura XML format based on Romanian ANAF requirements
  // This is a basic UBL-inspired format - production systems may need full UBL 2.1 compliance
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>${escapeXml(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${formatDate(invoice.issue_date)}</cbc:IssueDate>
  <cbc:DueDate>${formatDate(invoice.due_date)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(invoice.currency)}</cbc:DocumentCurrencyCode>
  
  <!-- Supplier (Furnizor) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(profile.company_name)}</cbc:Name>
      </cac:PartyName>
      ${profile.cui_cif ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(profile.cui_cif)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      ${profile.reg_com ? `
      <cac:PartyLegalEntity>
        <cbc:CompanyID>${escapeXml(profile.reg_com)}</cbc:CompanyID>
      </cac:PartyLegalEntity>` : ""}
      ${profile.address ? `
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(profile.address)}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer (Client) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.clients.name)}</cbc:Name>
      </cac:PartyName>
      ${invoice.clients.cui_cif ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoice.clients.cui_cif)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      ${invoice.clients.reg_com ? `
      <cac:PartyLegalEntity>
        <cbc:CompanyID>${escapeXml(invoice.clients.reg_com)}</cbc:CompanyID>
      </cac:PartyLegalEntity>` : ""}
      ${invoice.clients.address ? `
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.clients.address)}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Payment Terms -->
  ${profile.bank_account ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(profile.bank_account)}</cbc:ID>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ""}
  
  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escapeXml(invoice.currency)}">${invoice.vat_amount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escapeXml(invoice.currency)}">${invoice.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escapeXml(invoice.currency)}">${invoice.vat_amount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escapeXml(invoice.currency)}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${escapeXml(invoice.currency)}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${escapeXml(invoice.currency)}">${invoice.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escapeXml(invoice.currency)}">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines -->
  ${items
    .map(
      (item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="XPP">${item.quantity.toFixed(2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${escapeXml(invoice.currency)}">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${item.vat_rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${escapeXml(invoice.currency)}">${item.unit_price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`
    )
    .join("")}
</Invoice>`;

  return xml;
}