import { toast } from "sonner";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateProfileForSaftExport = (profile: any): ProfileValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields for SAF-T
  if (!profile?.company_name?.trim()) {
    errors.push({ field: "Denumire firmă", message: "Denumirea firmei este obligatorie" });
  }

  if (!profile?.cui_cif?.trim()) {
    errors.push({ field: "CUI/CIF", message: "CUI/CIF este obligatoriu pentru SAF-T" });
  }

  if (!profile?.reg_com?.trim()) {
    errors.push({ field: "Nr. Reg. Com.", message: "Numărul de înregistrare la Registrul Comerțului este obligatoriu" });
  }

  if (!profile?.address?.trim()) {
    errors.push({ field: "Adresă", message: "Adresa completă este obligatorie" });
  }

  if (!profile?.city?.trim()) {
    errors.push({ field: "Oraș", message: "Orașul este obligatoriu" });
  }

  if (!profile?.county?.trim()) {
    errors.push({ field: "Județ", message: "Județul este obligatoriu" });
  }

  if (!profile?.country?.trim()) {
    errors.push({ field: "Țară", message: "Țara este obligatorie" });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateProfileForEFactura = (profile: any): ProfileValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields for e-Factura
  if (!profile?.company_name?.trim()) {
    errors.push({ field: "Denumire firmă", message: "Denumirea firmei este obligatorie" });
  }

  if (!profile?.cui_cif?.trim()) {
    errors.push({ field: "CUI/CIF", message: "CUI/CIF este obligatoriu pentru e-Factura" });
  }

  if (!profile?.address?.trim()) {
    errors.push({ field: "Adresă", message: "Adresa este obligatorie" });
  }

  if (!profile?.email?.trim()) {
    errors.push({ field: "Email", message: "Email-ul este obligatoriu" });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateClientForEFactura = (client: any): ProfileValidationResult => {
  const errors: ValidationError[] = [];

  if (!client?.name?.trim()) {
    errors.push({ field: "Nume client", message: "Numele clientului este obligatoriu" });
  }

  if (!client?.cui_cif?.trim()) {
    errors.push({ field: "CUI/CIF client", message: "CUI/CIF-ul clientului este obligatoriu pentru e-Factura" });
  }

  if (!client?.address?.trim()) {
    errors.push({ field: "Adresă client", message: "Adresa clientului este obligatorie" });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateInvoiceForEFactura = (invoice: any, items: any[]): ProfileValidationResult => {
  const errors: ValidationError[] = [];

  if (!invoice?.invoice_number?.trim()) {
    errors.push({ field: "Număr factură", message: "Numărul facturii este obligatoriu" });
  }

  if (!invoice?.issue_date) {
    errors.push({ field: "Data emiterii", message: "Data emiterii este obligatorie" });
  }

  if (!invoice?.due_date) {
    errors.push({ field: "Data scadenței", message: "Data scadenței este obligatorie" });
  }

  if (!items || items.length === 0) {
    errors.push({ field: "Produse/Servicii", message: "Factura trebuie să conțină cel puțin un produs sau serviciu" });
  } else {
    items.forEach((item, index) => {
      if (!item?.description?.trim()) {
        errors.push({ field: `Produs ${index + 1}`, message: `Descrierea produsului/serviciului ${index + 1} este obligatorie` });
      }
      if (!item?.unit_price || item.unit_price <= 0) {
        errors.push({ field: `Preț ${index + 1}`, message: `Prețul unitar pentru produsul ${index + 1} trebuie să fie mai mare ca 0` });
      }
      if (!item?.quantity || item.quantity <= 0) {
        errors.push({ field: `Cantitate ${index + 1}`, message: `Cantitatea pentru produsul ${index + 1} trebuie să fie mai mare ca 0` });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequiredAccountsForSaft = (accounts: any[]): ProfileValidationResult => {
  const errors: ValidationError[] = [];
  const requiredAccounts = ['4111', '707', '4427'];
  
  const accountCodes = accounts.map(acc => acc.account_code);
  
  requiredAccounts.forEach(code => {
    if (!accountCodes.includes(code)) {
      errors.push({ 
        field: `Cont ${code}`, 
        message: `Contul ${code} este obligatoriu pentru generarea SAF-T` 
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const showValidationErrors = (errors: ValidationError[], title: string = "Date incomplete") => {
  const errorList = errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
  
  toast.error(title, {
    description: errorList,
    duration: 8000,
  });
};
