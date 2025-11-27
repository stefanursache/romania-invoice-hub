import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  notes?: string;
  invoice_type?: string;
  client: {
    name: string;
    cui_cif?: string;
    reg_com?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    subtotal: number;
    vat_amount: number;
    total: number;
  }>;
}

interface CompanyData {
  company_name: string;
  cui_cif?: string;
  reg_com?: string;
  address?: string;
  bank_account?: string;
}

export const generateInvoicePDF = (
  invoice: InvoiceData,
  company: CompanyData
) => {
  const doc = new jsPDF();

  // Professional print-friendly color palette
  const primaryColor: [number, number, number] = [0, 0, 0]; // Black for headers
  const secondaryColor: [number, number, number] = [255, 255, 255]; // White background
  const accentColor: [number, number, number] = [0, 0, 0]; // Black for emphasis
  const textDark: [number, number, number] = [0, 0, 0]; // Pure black text
  const textMedium: [number, number, number] = [60, 60, 60]; // Dark gray
  const borderColor: [number, number, number] = [180, 180, 180]; // Medium gray borders

  // Header with simple clean design
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(1);
  doc.line(15, 35, 195, 35);
  
  doc.setTextColor(...textDark);
  
  // Document title
  const documentTitle = invoice.invoice_type === "proforma" ? "PROFORMA" : "FACTURA";
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(documentTitle, 15, 20);

  // Invoice number below title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Nr. ${invoice.invoice_number}`, 15, 30);

  // Company name (right aligned)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(company.company_name, 195, 20, { align: "right" });

  // Reset text color for body
  doc.setTextColor(...textDark);

  // Company and Client Information Boxes
  const boxY = 45;
  const boxHeight = 50;

  // Supplier box
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.8);
  doc.rect(15, boxY, 85, boxHeight);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("FURNIZOR", 20, boxY + 8);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(company.company_name, 20, boxY + 16);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = boxY + 24;
  
  if (company.cui_cif) {
    doc.text(`CUI: ${company.cui_cif}`, 20, yPos);
    yPos += 6;
  }
  if (company.reg_com) {
    doc.text(`Reg. Com: ${company.reg_com}`, 20, yPos);
    yPos += 6;
  }
  if (company.address && yPos < boxY + boxHeight - 4) {
    const addressLines = doc.splitTextToSize(company.address, 75);
    doc.text(addressLines, 20, yPos);
  }

  // Client box
  doc.rect(110, boxY, 85, boxHeight);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("CLIENT", 115, boxY + 8);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(invoice.client.name || "N/A", 115, boxY + 16);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPos = boxY + 24;
  
  if (invoice.client.cui_cif) {
    doc.text(`CUI: ${invoice.client.cui_cif}`, 115, yPos);
    yPos += 6;
  }
  if (invoice.client.reg_com) {
    doc.text(`Reg. Com: ${invoice.client.reg_com}`, 115, yPos);
    yPos += 6;
  }
  if (invoice.client.address && yPos < boxY + boxHeight - 4) {
    const clientAddressLines = doc.splitTextToSize(invoice.client.address, 75);
    doc.text(clientAddressLines, 115, yPos);
  }

  // Invoice metadata row
  const metaY = boxY + boxHeight + 15;
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "normal");
  
  doc.text("Data emiterii:", 15, metaY);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.issue_date).toLocaleDateString("ro-RO"), 50, metaY);
  
  doc.setFont("helvetica", "normal");
  doc.text("Scadenta:", 95, metaY);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.due_date).toLocaleDateString("ro-RO"), 125, metaY);
  
  doc.setFont("helvetica", "normal");
  doc.text("Moneda:", 160, metaY);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.currency, 180, metaY);

  // Items table with optimized columns
  const tableStartY = metaY + 15;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descriere", "Cant.", "Preț unitar", "TVA", "Subtotal", "TVA", "Total"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `${item.unit_price.toFixed(2)} ${invoice.currency}`,
      `${item.vat_rate}%`,
      `${item.subtotal.toFixed(2)}`,
      `${item.vat_amount.toFixed(2)}`,
      `${item.total.toFixed(2)}`,
    ]),
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: textDark,
      fontStyle: "bold",
      fontSize: 11,
      cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
      halign: "left",
      lineWidth: 0.8,
      lineColor: borderColor,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: textDark,
      cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
      lineColor: borderColor,
      lineWidth: 0.5,
      minCellHeight: 12,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 65, halign: "left" }, // Description - wider
      1: { cellWidth: 18, halign: "center" }, // Quantity
      2: { cellWidth: 32, halign: "right" }, // Unit price
      3: { cellWidth: 18, halign: "center" }, // VAT rate
      4: { cellWidth: 26, halign: "right" }, // Subtotal
      5: { cellWidth: 24, halign: "right" }, // VAT amount
      6: { cellWidth: 32, halign: "right", fontStyle: "bold" }, // Total
    },
    margin: { left: 15, right: 15 },
    theme: "grid",
  });

  // Totals section with refined design
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Totals box (right aligned)
  const totalsX = 125;
  const totalsWidth = 70;
  
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.8);
  doc.rect(totalsX, finalY, totalsWidth, 35);
  
  // Subtotal
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text("Subtotal:", totalsX + 5, finalY + 10);
  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 10, { align: "right" });

  // VAT
  doc.setFont("helvetica", "normal");
  doc.text("TVA:", totalsX + 5, finalY + 19);
  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.vat_amount.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 19, { align: "right" });

  // Total (with bold line separator)
  doc.setLineWidth(1.5);
  doc.line(totalsX, finalY + 22, totalsX + totalsWidth, finalY + 22);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL:", totalsX + 5, finalY + 30);
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 30, { align: "right" });

  // Bank account if available
  if (company.bank_account) {
    const bankY = finalY + 40;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("IBAN:", totalsX, bankY);
    doc.setFont("helvetica", "normal");
    doc.text(company.bank_account, totalsX + 15, bankY);
  }

  // Notes section
  if (invoice.notes) {
    const notesY = finalY + (company.bank_account ? 50 : 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text("OBSERVAȚII:", 15, notesY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const notesLines = doc.splitTextToSize(invoice.notes, 180);
    doc.text(notesLines, 15, notesY + 7);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.5);
  doc.setDrawColor(...borderColor);
  doc.line(15, pageHeight - 20, 195, pageHeight - 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text("Mulțumim pentru încredere!", 105, pageHeight - 12, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(...textMedium);
  doc.text("Document generat de SmartInvoice", 105, pageHeight - 6, { align: "center" });

  // Save with appropriate filename
  const filePrefix = invoice.invoice_type === "proforma" ? "Proforma" : "Factura";
  doc.save(`${filePrefix}-${invoice.invoice_number}.pdf`);
};
