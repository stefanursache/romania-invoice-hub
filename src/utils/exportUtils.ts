export interface InvoiceExportData {
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

export const exportToCSV = (data: any[], filename: string = "export.csv") => {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers.map(header => {
        const value = row[header];
        // Quote strings that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
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