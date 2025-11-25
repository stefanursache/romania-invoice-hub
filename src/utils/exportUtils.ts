interface InvoiceExportData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  status: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  currency: string;
}

export const exportToCSV = (data: InvoiceExportData[], filename: string = "invoices.csv") => {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Define headers
  const headers = [
    "Invoice Number",
    "Issue Date",
    "Due Date",
    "Client",
    "Status",
    "Subtotal",
    "VAT",
    "Total",
    "Currency",
  ];

  // Convert data to CSV rows
  const csvRows = [
    headers.join(","),
    ...data.map((invoice) =>
      [
        invoice.invoice_number,
        invoice.issue_date,
        invoice.due_date,
        `"${invoice.client_name}"`, // Quote client name in case of commas
        invoice.status,
        invoice.subtotal,
        invoice.vat_amount,
        invoice.total,
        invoice.currency,
      ].join(",")
    ),
  ];

  // Create blob and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
