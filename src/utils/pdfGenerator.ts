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

  // Modern color palette
  const primaryColor: [number, number, number] = [30, 64, 175]; // Deep blue
  const secondaryColor: [number, number, number] = [241, 245, 249]; // Light gray
  const accentColor: [number, number, number] = [59, 130, 246]; // Bright blue
  const textDark: [number, number, number] = [15, 23, 42]; // Very dark
  const textGray: [number, number, number] = [100, 116, 139]; // Medium gray

  // Header with gradient effect
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, "F");
  
  // White text for header
  doc.setTextColor(255, 255, 255);
  
  // Document title
  const documentTitle = invoice.invoice_type === "proforma" ? "PRO FORMA" : "FACTURA";
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(documentTitle, 20, 25);

  // Invoice number
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Numar: ${invoice.invoice_number}`, 20, 35);

  // Company info (right side)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(company.company_name, 190, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  let headerY = 26;
  if (company.cui_cif) {
    doc.text(`CUI: ${company.cui_cif}`, 190, headerY, { align: "right" });
    headerY += 5;
  }
  if (company.reg_com) {
    doc.text(`Reg. Com.: ${company.reg_com}`, 190, headerY, { align: "right" });
  }

  // Reset to dark text
  doc.setTextColor(...textDark);

  // Info boxes with better spacing
  const startY = 65;

  // Supplier box
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(20, startY, 80, 48, 2, 2, "F");
  
  doc.setTextColor(...textGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FURNIZOR", 25, startY + 8);
  
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(company.company_name, 25, startY + 16);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let yPos = startY + 22;
  
  if (company.cui_cif) {
    doc.text(`CUI: ${company.cui_cif}`, 25, yPos);
    yPos += 5;
  }
  if (company.reg_com) {
    doc.text(`Reg. Com: ${company.reg_com}`, 25, yPos);
    yPos += 5;
  }
  if (company.address) {
    const addressLines = doc.splitTextToSize(company.address, 70);
    doc.text(addressLines, 25, yPos);
    yPos += addressLines.length * 5;
  }
  if (company.bank_account && yPos < startY + 45) {
    doc.text(`IBAN: ${company.bank_account}`, 25, yPos);
  }

  // Client box
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(110, startY, 80, 48, 2, 2, "F");
  
  doc.setTextColor(...textGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT", 115, startY + 8);
  
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(invoice.client.name, 115, startY + 16);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  yPos = startY + 22;
  
  if (invoice.client.cui_cif) {
    doc.text(`CUI: ${invoice.client.cui_cif}`, 115, yPos);
    yPos += 5;
  }
  if (invoice.client.reg_com) {
    doc.text(`Reg. Com: ${invoice.client.reg_com}`, 115, yPos);
    yPos += 5;
  }
  if (invoice.client.address) {
    const clientAddressLines = doc.splitTextToSize(invoice.client.address, 70);
    doc.text(clientAddressLines, 115, yPos);
  }

  // Invoice metadata
  const metaY = startY + 55;
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(...textGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  doc.text("Data emiterii:", 20, metaY);
  doc.setTextColor(...textDark);
  doc.text(new Date(invoice.issue_date).toLocaleDateString("ro-RO"), 50, metaY);
  
  doc.setTextColor(...textGray);
  doc.text("Scadenta:", 90, metaY);
  doc.setTextColor(...textDark);
  doc.text(new Date(invoice.due_date).toLocaleDateString("ro-RO"), 115, metaY);
  
  doc.setTextColor(...textGray);
  doc.text("Moneda:", 160, metaY);
  doc.setTextColor(...textDark);
  doc.text(invoice.currency, 180, metaY);

  // Items table with better styling
  const tableStartY = metaY + 15;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descriere", "Cant.", "Pret unitar", "TVA %", "Subtotal", "TVA", "Total"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toFixed(2),
      `${item.unit_price.toFixed(2)} ${invoice.currency}`,
      `${item.vat_rate}%`,
      `${item.subtotal.toFixed(2)} ${invoice.currency}`,
      `${item.vat_amount.toFixed(2)} ${invoice.currency}`,
      `${item.total.toFixed(2)} ${invoice.currency}`,
    ]),
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 8,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: textDark,
      cellPadding: 8,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: secondaryColor,
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 28, halign: "right" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 20, right: 20 },
  });

  // Totals section with modern design
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Summary box
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(125, finalY, 65, 32, 2, 2, "F");
  
  doc.setTextColor(...textGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text("Subtotal:", 130, finalY + 8);
  doc.setTextColor(...textDark);
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 185, finalY + 8, { align: "right" });

  doc.setTextColor(...textGray);
  doc.text("TVA:", 130, finalY + 16);
  doc.setTextColor(...textDark);
  doc.text(`${invoice.vat_amount.toFixed(2)} ${invoice.currency}`, 185, finalY + 16, { align: "right" });

  // Total with accent
  doc.setFillColor(...accentColor);
  doc.roundedRect(125, finalY + 21, 65, 10, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 130, finalY + 28);
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 185, finalY + 28, { align: "right" });

  // Notes section
  if (invoice.notes) {
    const notesY = finalY + 40;
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTE:", 20, notesY);
    
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(notesLines, 20, notesY + 6);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 20, 210, 20, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Multumim pentru incredere!", 105, pageHeight - 11, { align: "center" });
  
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text("SmartInvoice Romania", 105, pageHeight - 6, { align: "center" });

  // Save with appropriate filename
  const filePrefix = invoice.invoice_type === "proforma" ? "Proforma" : "Factura";
  doc.save(`${filePrefix}-${invoice.invoice_number}.pdf`);
};