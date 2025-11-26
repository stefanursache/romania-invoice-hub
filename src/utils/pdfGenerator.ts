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

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const accentColor: [number, number, number] = [16, 185, 129]; // Green
  const textColor: [number, number, number] = [31, 41, 55]; // Dark gray

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  
  // Show PRO FORMA or FACTURĂ based on invoice type
  const documentTitle = invoice.invoice_type === "proforma" ? "PRO FORMA" : "FACTURĂ";
  doc.text(documentTitle, 15, 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Nr. ${invoice.invoice_number}`, 15, 30);

  // Company info (right side of header)
  doc.setFontSize(10);
  doc.text(company.company_name, 210 - 15, 15, { align: "right" });
  if (company.cui_cif) {
    doc.text(`CUI: ${company.cui_cif}`, 210 - 15, 21, { align: "right" });
  }
  if (company.reg_com) {
    doc.text(`Reg. Com.: ${company.reg_com}`, 210 - 15, 27, { align: "right" });
  }

  // Reset text color
  doc.setTextColor(...textColor);

  // Company and Client info boxes
  const startY = 50;

  // Company details box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, startY, 85, 40, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, startY, 85, 40, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Furnizor:", 20, startY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let yPos = startY + 14;
  doc.text(company.company_name, 20, yPos);
  yPos += 5;
  if (company.address) {
    const addressLines = doc.splitTextToSize(company.address, 70);
    doc.text(addressLines, 20, yPos);
    yPos += addressLines.length * 5;
  }
  if (company.bank_account) {
    doc.text(`IBAN: ${company.bank_account}`, 20, yPos);
  }

  // Client details box
  doc.setFillColor(248, 250, 252);
  doc.rect(110, startY, 85, 40, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(110, startY, 85, 40, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Client:", 115, startY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  yPos = startY + 14;
  doc.text(invoice.client.name, 115, yPos);
  yPos += 5;
  if (invoice.client.cui_cif) {
    doc.text(`CUI: ${invoice.client.cui_cif}`, 115, yPos);
    yPos += 5;
  }
  if (invoice.client.address) {
    const clientAddressLines = doc.splitTextToSize(invoice.client.address, 70);
    doc.text(clientAddressLines, 115, yPos);
    yPos += clientAddressLines.length * 5;
  }

  // Invoice details
  const detailsY = startY + 45;
  doc.setFontSize(9);
  doc.text(`Data emiterii: ${new Date(invoice.issue_date).toLocaleDateString("ro-RO")}`, 15, detailsY);
  doc.text(`Scadență: ${new Date(invoice.due_date).toLocaleDateString("ro-RO")}`, 15, detailsY + 6);
  doc.text(`Monedă: ${invoice.currency}`, 15, detailsY + 12);

  // Items table
  const tableStartY = detailsY + 20;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descriere", "Cant.", "Preț unitar", "TVA %", "Subtotal", "TVA", "Total"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toFixed(2),
      item.unit_price.toFixed(2),
      `${item.vat_rate}%`,
      item.subtotal.toFixed(2),
      item.vat_amount.toFixed(2),
      item.total.toFixed(2),
    ]),
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: "right" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFillColor(248, 250, 252);
  doc.rect(130, finalY, 65, 25, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(130, finalY, 65, 25, "S");

  doc.setFontSize(10);
  doc.text("Subtotal:", 135, finalY + 7);
  doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 190, finalY + 7, { align: "right" });

  doc.text("TVA:", 135, finalY + 14);
  doc.text(`${invoice.vat_amount.toFixed(2)} ${invoice.currency}`, 190, finalY + 14, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 135, finalY + 22);
  doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 190, finalY + 22, { align: "right" });

  // Notes
  if (invoice.notes) {
    const notesY = finalY + 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Note:", 15, notesY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(invoice.notes, 180);
    doc.text(notesLines, 15, notesY + 6);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...accentColor);
  doc.rect(0, pageHeight - 15, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    "Mulțumim pentru încredere! | SmartInvoice Romania",
    105,
    pageHeight - 7,
    { align: "center" }
  );

  // Save
  doc.save(`Factura-${invoice.invoice_number}.pdf`);
};