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

  // Professional color palette
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const secondaryColor: [number, number, number] = [248, 250, 252]; // Very light gray
  const accentColor: [number, number, number] = [16, 185, 129]; // Green
  const textDark: [number, number, number] = [15, 23, 42];
  const textMedium: [number, number, number] = [71, 85, 105];
  const borderColor: [number, number, number] = [226, 232, 240];

  // Header with company branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 45, "F");
  
  doc.setTextColor(255, 255, 255);
  
  // Document title
  const documentTitle = invoice.invoice_type === "proforma" ? "PROFORMA" : "FACTURA";
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(documentTitle, 20, 20);

  // Invoice number below title
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Nr. ${invoice.invoice_number}`, 20, 30);

  // Company name (right aligned)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(company.company_name, 190, 22, { align: "right" });

  // Reset text color for body
  doc.setTextColor(...textDark);

  // Company and Client Information Boxes
  const boxY = 55;
  const boxHeight = 40;

  // Supplier box
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(15, boxY, 85, boxHeight, 3, 3, "FD");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textMedium);
  doc.text("FURNIZOR", 20, boxY + 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(company.company_name, 20, boxY + 16);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let yPos = boxY + 22;
  
  if (company.cui_cif) {
    doc.text(`CUI: ${company.cui_cif}`, 20, yPos);
    yPos += 5;
  }
  if (company.reg_com) {
    doc.text(`Reg. Com: ${company.reg_com}`, 20, yPos);
    yPos += 5;
  }
  if (company.address && yPos < boxY + boxHeight - 3) {
    const addressLines = doc.splitTextToSize(company.address, 75);
    doc.text(addressLines, 20, yPos);
  } else if (!company.address && yPos < boxY + boxHeight - 3) {
    doc.setTextColor(...textMedium);
    doc.text("(Adresa nu este completată)", 20, yPos);
    doc.setTextColor(...textDark);
  }

  // Client box
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(110, boxY, 85, boxHeight, 3, 3, "FD");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textMedium);
  doc.text("CLIENT", 115, boxY + 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(invoice.client.name || "N/A", 115, boxY + 16);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  yPos = boxY + 22;
  
  if (invoice.client.cui_cif) {
    doc.text(`CUI: ${invoice.client.cui_cif}`, 115, yPos);
    yPos += 5;
  }
  if (invoice.client.reg_com) {
    doc.text(`Reg. Com: ${invoice.client.reg_com}`, 115, yPos);
    yPos += 5;
  }
  if (invoice.client.address && yPos < boxY + boxHeight - 3) {
    const clientAddressLines = doc.splitTextToSize(invoice.client.address, 75);
    doc.text(clientAddressLines, 115, yPos);
  } else if (!invoice.client.address && yPos < boxY + boxHeight - 3) {
    doc.setTextColor(...textMedium);
    doc.text("(Adresa nu este completată)", 115, yPos);
    doc.setTextColor(...textDark);
  }

  // Invoice metadata row
  const metaY = boxY + boxHeight + 12;
  doc.setFontSize(9);
  doc.setTextColor(...textMedium);
  doc.setFont("helvetica", "normal");
  
  doc.text("Data emiterii:", 15, metaY);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.issue_date).toLocaleDateString("ro-RO"), 45, metaY);
  
  doc.setTextColor(...textMedium);
  doc.setFont("helvetica", "normal");
  doc.text("Scadenta:", 85, metaY);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.due_date).toLocaleDateString("ro-RO"), 110, metaY);
  
  doc.setTextColor(...textMedium);
  doc.setFont("helvetica", "normal");
  doc.text("Moneda:", 155, metaY);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.currency, 175, metaY);

  // Items table with optimized columns
  const tableStartY = metaY + 12;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descriere", "Cant.", "Pret unitar", "Cota TVA", "Subtotal", "TVA", "Total"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `${item.unit_price.toFixed(2)} ${invoice.currency}`,
      `${item.vat_rate}%`,
      `${item.subtotal.toFixed(2)}`,
      `${item.vat_amount.toFixed(2)}`,
      `${item.total.toFixed(2)} ${invoice.currency}`,
    ]),
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
      halign: "left",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      lineColor: borderColor,
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: secondaryColor,
    },
    columnStyles: {
      0: { cellWidth: 70, halign: "left" }, // Description
      1: { cellWidth: 15, halign: "center" }, // Quantity
      2: { cellWidth: 30, halign: "right" }, // Unit price
      3: { cellWidth: 20, halign: "center" }, // VAT rate
      4: { cellWidth: 22, halign: "right" }, // Subtotal
      5: { cellWidth: 20, halign: "right" }, // VAT amount
      6: { cellWidth: 30, halign: "right", fontStyle: "bold" }, // Total
    },
    margin: { left: 15, right: 15 },
    theme: "grid",
  });

  // Totals section with refined design
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Totals box (right aligned)
  const totalsX = 130;
  const totalsWidth = 65;
  
  doc.setFillColor(...secondaryColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, finalY, totalsWidth, 28, 2, 2, "FD");
  
  // Subtotal
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMedium);
  doc.text("Subtotal:", totalsX + 5, finalY + 8);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 8, { align: "right" });

  // VAT
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMedium);
  doc.text("TVA:", totalsX + 5, finalY + 16);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.vat_amount.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 16, { align: "right" });

  // Total (highlighted)
  doc.setFillColor(...accentColor);
  doc.roundedRect(totalsX, finalY + 19, totalsWidth, 9, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", totalsX + 5, finalY + 25);
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, totalsX + totalsWidth - 5, finalY + 25, { align: "right" });

  // Bank account if available
  if (company.bank_account) {
    const bankY = finalY + 32;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMedium);
    doc.text("IBAN:", totalsX, bankY);
    doc.setTextColor(...textDark);
    doc.text(company.bank_account, totalsX + 12, bankY);
  }

  // Notes section
  if (invoice.notes) {
    const notesY = finalY + (company.bank_account ? 42 : 35);
    doc.setFillColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...textMedium);
    doc.text("OBSERVAȚII:", 15, notesY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    const notesLines = doc.splitTextToSize(invoice.notes, 180);
    doc.text(notesLines, 15, notesY + 6);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(249, 250, 251);
  doc.rect(0, pageHeight - 15, 210, 15, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMedium);
  doc.text("Mulțumim pentru încredere!", 105, pageHeight - 8, { align: "center" });
  
  doc.setFontSize(7);
  doc.setTextColor(...textMedium);
  doc.text("Document generat de SmartInvoice", 105, pageHeight - 4, { align: "center" });

  // Save with appropriate filename
  const filePrefix = invoice.invoice_type === "proforma" ? "Proforma" : "Factura";
  doc.save(`${filePrefix}-${invoice.invoice_number}.pdf`);
};
