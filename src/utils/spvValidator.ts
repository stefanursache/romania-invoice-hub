export interface SpvValidationTest {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface SpvValidationReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  tests: SpvValidationTest[];
}

export const validateEFacturaForSpv = (
  invoice: any,
  items: any[],
  profile: any,
  client: any
): SpvValidationReport => {
  const tests: SpvValidationTest[] = [];

  // Test 1: Invoice Header Completeness
  const headerTest = validateInvoiceHeader(invoice);
  tests.push(headerTest);

  // Test 2: Supplier (Profile) Data Completeness
  const supplierTest = validateSupplierData(profile);
  tests.push(supplierTest);

  // Test 3: Customer (Client) Data Completeness
  const customerTest = validateCustomerData(client);
  tests.push(customerTest);

  // Test 4: Invoice Items Presence
  const itemsPresenceTest = validateItemsPresence(items);
  tests.push(itemsPresenceTest);

  // Test 5: Line Items Completeness
  const lineItemsTest = validateLineItems(items);
  tests.push(lineItemsTest);

  // Test 6: Tax Calculations Consistency
  const taxCalculationsTest = validateTaxCalculations(invoice, items);
  tests.push(taxCalculationsTest);

  // Test 7: Total Amounts Reconciliation
  const totalsTest = validateTotalAmounts(invoice, items);
  tests.push(totalsTest);

  // Test 8: CUI/CIF Format Validation
  const cuiTest = validateCuiFormat(profile, client);
  tests.push(cuiTest);

  // Test 9: Date Format and Logic Validation
  const datesTest = validateDates(invoice);
  tests.push(datesTest);

  // Test 10: Currency Validation
  const currencyTest = validateCurrency(invoice);
  tests.push(currencyTest);

  // Test 11: Payment Terms Validation
  const paymentTest = validatePaymentTerms(invoice);
  tests.push(paymentTest);

  // Test 12: Invoice Number Format
  const invoiceNumberTest = validateInvoiceNumber(invoice);
  tests.push(invoiceNumberTest);

  // Test 13: Tax Rates Validity
  const taxRatesTest = validateTaxRates(items);
  tests.push(taxRatesTest);

  // Test 14: Line Subtotals Accuracy
  const subtotalsTest = validateLineSubtotals(items);
  tests.push(subtotalsTest);

  // Test 15: VAT Amount Calculations
  const vatTest = validateVatAmounts(items);
  tests.push(vatTest);

  // Test 16: Invoice Type Validation
  const invoiceTypeTest = validateInvoiceType(invoice);
  tests.push(invoiceTypeTest);

  // Test 17: Email Format Validation
  const emailTest = validateEmailFormats(profile, client);
  tests.push(emailTest);

  // Test 18: Address Completeness
  const addressTest = validateAddresses(profile, client);
  tests.push(addressTest);

  // Test 19: Item Quantities Validity
  const quantitiesTest = validateQuantities(items);
  tests.push(quantitiesTest);

  // Test 20: Unit Prices Validity
  const pricesTest = validateUnitPrices(items);
  tests.push(pricesTest);

  // Test 21: UBL XML Structure Requirements
  const ublTest = validateUBLRequirements(invoice, profile, client);
  tests.push(ublTest);

  // Test 22: Decimal Precision Validation
  const decimalTest = validateDecimalPrecision(invoice, items);
  tests.push(decimalTest);

  // Test 23: Tax Category Codes
  const taxCategoryTest = validateTaxCategories(items);
  tests.push(taxCategoryTest);

  // Test 24: SPV Credentials Configuration
  const credentialsTest = validateSpvCredentials(profile);
  tests.push(credentialsTest);

  // Test 25: Invoice Approval Status
  const approvalTest = validateApprovalStatus(invoice);
  tests.push(approvalTest);

  // Calculate summary
  const passed = tests.filter(t => t.status === 'pass').length;
  const failed = tests.filter(t => t.status === 'fail').length;
  const warnings = tests.filter(t => t.status === 'warning').length;

  return {
    totalTests: tests.length,
    passed,
    failed,
    warnings,
    tests
  };
};

// Test 1: Invoice Header Completeness
const validateInvoiceHeader = (invoice: any): SpvValidationTest => {
  const required = ['invoice_number', 'issue_date', 'due_date', 'subtotal', 'vat_amount', 'total'];
  const missing = required.filter(field => !invoice[field]);

  if (missing.length === 0) {
    return {
      name: 'Invoice Header Completeness',
      status: 'pass',
      message: 'All required invoice header fields are present'
    };
  }

  return {
    name: 'Invoice Header Completeness',
    status: 'fail',
    message: `Missing required invoice fields: ${missing.join(', ')}`,
    details: 'Invoice must have invoice_number, issue_date, due_date, subtotal, vat_amount, and total'
  };
};

// Test 2: Supplier Data Completeness
const validateSupplierData = (profile: any): SpvValidationTest => {
  const required = ['company_name', 'cui_cif', 'address', 'email'];
  const missing = required.filter(field => !profile?.[field]);

  if (missing.length === 0) {
    return {
      name: 'Supplier Data Completeness',
      status: 'pass',
      message: 'All required supplier fields are present'
    };
  }

  return {
    name: 'Supplier Data Completeness',
    status: 'fail',
    message: `Missing supplier fields: ${missing.join(', ')}`,
    details: 'Supplier must have company_name, cui_cif, address, and email for ANAF e-Factura'
  };
};

// Test 3: Customer Data Completeness
const validateCustomerData = (client: any): SpvValidationTest => {
  const required = ['name', 'cui_cif', 'address'];
  const missing = required.filter(field => !client?.[field]);

  if (missing.length === 0) {
    return {
      name: 'Customer Data Completeness',
      status: 'pass',
      message: 'All required customer fields are present'
    };
  }

  return {
    name: 'Customer Data Completeness',
    status: 'fail',
    message: `Missing customer fields: ${missing.join(', ')}`,
    details: 'Customer must have name, cui_cif, and address for ANAF e-Factura'
  };
};

// Test 4: Invoice Items Presence
const validateItemsPresence = (items: any[]): SpvValidationTest => {
  if (items && items.length > 0) {
    return {
      name: 'Invoice Items Presence',
      status: 'pass',
      message: `Invoice contains ${items.length} line item(s)`
    };
  }

  return {
    name: 'Invoice Items Presence',
    status: 'fail',
    message: 'Invoice must contain at least one line item',
    details: 'ANAF requires invoices to have at least one product or service line'
  };
};

// Test 5: Line Items Completeness
const validateLineItems = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Line Items Completeness',
      status: 'fail',
      message: 'No items to validate'
    };
  }

  const incomplete = items.filter(item => 
    !item.description || !item.unit_price || !item.quantity || 
    item.subtotal === undefined || item.vat_amount === undefined || item.total === undefined
  );

  if (incomplete.length === 0) {
    return {
      name: 'Line Items Completeness',
      status: 'pass',
      message: 'All line items have required fields'
    };
  }

  return {
    name: 'Line Items Completeness',
    status: 'fail',
    message: `${incomplete.length} item(s) missing required fields`,
    details: 'Each line item must have description, unit_price, quantity, subtotal, vat_amount, and total'
  };
};

// Test 6: Tax Calculations Consistency
const validateTaxCalculations = (invoice: any, items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Tax Calculations Consistency',
      status: 'warning',
      message: 'No items to validate tax calculations'
    };
  }

  const calculatedVat = items.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
  const invoiceVat = invoice.vat_amount || 0;
  const difference = Math.abs(calculatedVat - invoiceVat);

  if (difference < 0.02) { // Allow 2 cents tolerance for rounding
    return {
      name: 'Tax Calculations Consistency',
      status: 'pass',
      message: 'VAT amounts match between line items and invoice total'
    };
  }

  return {
    name: 'Tax Calculations Consistency',
    status: 'fail',
    message: `VAT mismatch: Line items sum ${calculatedVat.toFixed(2)} vs Invoice ${invoiceVat.toFixed(2)}`,
    details: `Difference: ${difference.toFixed(2)} RON`
  };
};

// Test 7: Total Amounts Reconciliation
const validateTotalAmounts = (invoice: any, items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Total Amounts Reconciliation',
      status: 'warning',
      message: 'No items to validate totals'
    };
  }

  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const calculatedTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  
  const subtotalDiff = Math.abs(calculatedSubtotal - (invoice.subtotal || 0));
  const totalDiff = Math.abs(calculatedTotal - (invoice.total || 0));

  if (subtotalDiff < 0.02 && totalDiff < 0.02) {
    return {
      name: 'Total Amounts Reconciliation',
      status: 'pass',
      message: 'Invoice totals match line items sum'
    };
  }

  return {
    name: 'Total Amounts Reconciliation',
    status: 'fail',
    message: 'Mismatch between invoice totals and line items sum',
    details: `Subtotal diff: ${subtotalDiff.toFixed(2)}, Total diff: ${totalDiff.toFixed(2)}`
  };
};

// Test 8: CUI/CIF Format Validation
const validateCuiFormat = (profile: any, client: any): SpvValidationTest => {
  const cuiRegex = /^(RO)?[0-9]{6,10}$/i;
  const supplierValid = profile?.cui_cif && cuiRegex.test(profile.cui_cif.replace(/\s/g, ''));
  const customerValid = client?.cui_cif && cuiRegex.test(client.cui_cif.replace(/\s/g, ''));

  if (supplierValid && customerValid) {
    return {
      name: 'CUI/CIF Format Validation',
      status: 'pass',
      message: 'CUI/CIF format is valid for both supplier and customer'
    };
  }

  const errors = [];
  if (!supplierValid) errors.push('Supplier CUI/CIF invalid');
  if (!customerValid) errors.push('Customer CUI/CIF invalid');

  return {
    name: 'CUI/CIF Format Validation',
    status: 'fail',
    message: errors.join('; '),
    details: 'CUI/CIF must be 6-10 digits, optionally prefixed with RO'
  };
};

// Test 9: Date Format and Logic Validation
const validateDates = (invoice: any): SpvValidationTest => {
  const issueDate = new Date(invoice.issue_date);
  const dueDate = new Date(invoice.due_date);

  if (isNaN(issueDate.getTime()) || isNaN(dueDate.getTime())) {
    return {
      name: 'Date Format and Logic',
      status: 'fail',
      message: 'Invalid date format',
      details: 'Dates must be valid ISO date strings'
    };
  }

  if (dueDate < issueDate) {
    return {
      name: 'Date Format and Logic',
      status: 'fail',
      message: 'Due date cannot be before issue date',
      details: `Issue: ${invoice.issue_date}, Due: ${invoice.due_date}`
    };
  }

  return {
    name: 'Date Format and Logic',
    status: 'pass',
    message: 'Date formats are valid and logic is correct'
  };
};

// Test 10: Currency Validation
const validateCurrency = (invoice: any): SpvValidationTest => {
  const validCurrencies = ['RON', 'EUR', 'USD', 'GBP'];
  const currency = invoice.currency || 'RON';

  if (validCurrencies.includes(currency)) {
    return {
      name: 'Currency Validation',
      status: 'pass',
      message: `Currency ${currency} is valid`
    };
  }

  return {
    name: 'Currency Validation',
    status: 'warning',
    message: `Currency ${currency} may not be supported`,
    details: 'Standard currencies are RON, EUR, USD, GBP'
  };
};

// Test 11: Payment Terms Validation
const validatePaymentTerms = (invoice: any): SpvValidationTest => {
  const issueDate = new Date(invoice.issue_date);
  const dueDate = new Date(invoice.due_date);
  const daysDiff = Math.floor((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff >= 0 && daysDiff <= 365) {
    return {
      name: 'Payment Terms Validation',
      status: 'pass',
      message: `Payment term: ${daysDiff} days`
    };
  }

  return {
    name: 'Payment Terms Validation',
    status: 'warning',
    message: `Unusual payment term: ${daysDiff} days`,
    details: 'Payment terms are typically between 0-90 days'
  };
};

// Test 12: Invoice Number Format
const validateInvoiceNumber = (invoice: any): SpvValidationTest => {
  const invoiceNumber = invoice.invoice_number;

  if (!invoiceNumber || invoiceNumber.trim().length === 0) {
    return {
      name: 'Invoice Number Format',
      status: 'fail',
      message: 'Invoice number is empty'
    };
  }

  if (invoiceNumber.length > 50) {
    return {
      name: 'Invoice Number Format',
      status: 'warning',
      message: 'Invoice number is very long',
      details: 'Consider using shorter invoice numbers for better compatibility'
    };
  }

  return {
    name: 'Invoice Number Format',
    status: 'pass',
    message: 'Invoice number format is valid'
  };
};

// Test 13: Tax Rates Validity
const validateTaxRates = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Tax Rates Validity',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  const validRates = [0, 5, 9, 19]; // Standard Romanian VAT rates
  const invalidItems = items.filter(item => !validRates.includes(item.vat_rate));

  if (invalidItems.length === 0) {
    return {
      name: 'Tax Rates Validity',
      status: 'pass',
      message: 'All tax rates are valid Romanian VAT rates'
    };
  }

  return {
    name: 'Tax Rates Validity',
    status: 'warning',
    message: `${invalidItems.length} item(s) with non-standard VAT rates`,
    details: 'Standard Romanian VAT rates are 0%, 5%, 9%, 19%'
  };
};

// Test 14: Line Subtotals Accuracy
const validateLineSubtotals = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Line Subtotals Accuracy',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  const errors = items.filter(item => {
    const calculated = item.unit_price * item.quantity;
    const difference = Math.abs(calculated - item.subtotal);
    return difference > 0.02; // 2 cents tolerance
  });

  if (errors.length === 0) {
    return {
      name: 'Line Subtotals Accuracy',
      status: 'pass',
      message: 'All line subtotals are calculated correctly'
    };
  }

  return {
    name: 'Line Subtotals Accuracy',
    status: 'fail',
    message: `${errors.length} item(s) with incorrect subtotal calculation`,
    details: 'Subtotal should equal unit_price × quantity'
  };
};

// Test 15: VAT Amount Calculations
const validateVatAmounts = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'VAT Amount Calculations',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  const errors = items.filter(item => {
    const calculated = item.subtotal * (item.vat_rate / 100);
    const difference = Math.abs(calculated - item.vat_amount);
    return difference > 0.02; // 2 cents tolerance
  });

  if (errors.length === 0) {
    return {
      name: 'VAT Amount Calculations',
      status: 'pass',
      message: 'All VAT amounts are calculated correctly'
    };
  }

  return {
    name: 'VAT Amount Calculations',
    status: 'fail',
    message: `${errors.length} item(s) with incorrect VAT calculation`,
    details: 'VAT amount should equal subtotal × (vat_rate / 100)'
  };
};

// Test 16: Invoice Type Validation
const validateInvoiceType = (invoice: any): SpvValidationTest => {
  const validTypes = ['standard', 'proforma', 'credit_note', 'debit_note'];
  const type = invoice.invoice_type || 'standard';

  if (validTypes.includes(type)) {
    return {
      name: 'Invoice Type Validation',
      status: 'pass',
      message: `Invoice type '${type}' is valid`
    };
  }

  return {
    name: 'Invoice Type Validation',
    status: 'warning',
    message: `Unknown invoice type: ${type}`,
    details: 'Standard types are: standard, proforma, credit_note, debit_note'
  };
};

// Test 17: Email Format Validation
const validateEmailFormats = (profile: any, client: any): SpvValidationTest => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const supplierValid = !profile?.email || emailRegex.test(profile.email);
  const customerValid = !client?.email || emailRegex.test(client.email);

  if (supplierValid && customerValid) {
    return {
      name: 'Email Format Validation',
      status: 'pass',
      message: 'Email formats are valid'
    };
  }

  const errors = [];
  if (!supplierValid) errors.push('Supplier email invalid');
  if (!customerValid) errors.push('Customer email invalid');

  return {
    name: 'Email Format Validation',
    status: 'fail',
    message: errors.join('; ')
  };
};

// Test 18: Address Completeness
const validateAddresses = (profile: any, client: any): SpvValidationTest => {
  const supplierAddressValid = profile?.address && profile.address.length >= 10;
  const customerAddressValid = client?.address && client.address.length >= 10;

  if (supplierAddressValid && customerAddressValid) {
    return {
      name: 'Address Completeness',
      status: 'pass',
      message: 'Addresses are sufficiently detailed'
    };
  }

  return {
    name: 'Address Completeness',
    status: 'warning',
    message: 'Addresses may be too short',
    details: 'Addresses should include street, number, city, and county'
  };
};

// Test 19: Item Quantities Validity
const validateQuantities = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Item Quantities Validity',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  const invalid = items.filter(item => !item.quantity || item.quantity <= 0);

  if (invalid.length === 0) {
    return {
      name: 'Item Quantities Validity',
      status: 'pass',
      message: 'All quantities are positive numbers'
    };
  }

  return {
    name: 'Item Quantities Validity',
    status: 'fail',
    message: `${invalid.length} item(s) with invalid quantities`,
    details: 'Quantities must be positive numbers'
  };
};

// Test 20: Unit Prices Validity
const validateUnitPrices = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Unit Prices Validity',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  const invalid = items.filter(item => !item.unit_price || item.unit_price < 0);

  if (invalid.length === 0) {
    return {
      name: 'Unit Prices Validity',
      status: 'pass',
      message: 'All unit prices are valid'
    };
  }

  return {
    name: 'Unit Prices Validity',
    status: 'fail',
    message: `${invalid.length} item(s) with invalid unit prices`,
    details: 'Unit prices must be non-negative numbers'
  };
};

// Test 21: UBL XML Structure Requirements
const validateUBLRequirements = (invoice: any, profile: any, client: any): SpvValidationTest => {
  const required = {
    invoice: ['invoice_number', 'issue_date', 'due_date'],
    profile: ['company_name', 'cui_cif'],
    client: ['name', 'cui_cif']
  };

  const missing = [];
  
  required.invoice.forEach(field => {
    if (!invoice[field]) missing.push(`Invoice.${field}`);
  });
  
  required.profile.forEach(field => {
    if (!profile?.[field]) missing.push(`Supplier.${field}`);
  });
  
  required.client.forEach(field => {
    if (!client?.[field]) missing.push(`Customer.${field}`);
  });

  if (missing.length === 0) {
    return {
      name: 'UBL XML Structure Requirements',
      status: 'pass',
      message: 'All UBL mandatory fields are present'
    };
  }

  return {
    name: 'UBL XML Structure Requirements',
    status: 'fail',
    message: `Missing UBL required fields: ${missing.join(', ')}`,
    details: 'UBL 2.1 standard requires these fields for e-Factura'
  };
};

// Test 22: Decimal Precision Validation
const validateDecimalPrecision = (invoice: any, items: any[]): SpvValidationTest => {
  const checkPrecision = (value: number, maxDecimals: number = 2): boolean => {
    const str = value.toString();
    const decimalPart = str.split('.')[1];
    return !decimalPart || decimalPart.length <= maxDecimals;
  };

  const invalidValues = [];
  
  if (!checkPrecision(invoice.subtotal)) invalidValues.push('Invoice subtotal');
  if (!checkPrecision(invoice.vat_amount)) invalidValues.push('Invoice VAT');
  if (!checkPrecision(invoice.total)) invalidValues.push('Invoice total');

  items?.forEach((item, i) => {
    if (!checkPrecision(item.unit_price, 4)) invalidValues.push(`Item ${i + 1} unit price`);
    if (!checkPrecision(item.subtotal)) invalidValues.push(`Item ${i + 1} subtotal`);
    if (!checkPrecision(item.vat_amount)) invalidValues.push(`Item ${i + 1} VAT`);
    if (!checkPrecision(item.total)) invalidValues.push(`Item ${i + 1} total`);
  });

  if (invalidValues.length === 0) {
    return {
      name: 'Decimal Precision Validation',
      status: 'pass',
      message: 'All amounts have appropriate decimal precision'
    };
  }

  return {
    name: 'Decimal Precision Validation',
    status: 'warning',
    message: `${invalidValues.length} value(s) with too many decimals`,
    details: 'Amounts should have max 2 decimals, unit prices max 4 decimals'
  };
};

// Test 23: Tax Category Codes
const validateTaxCategories = (items: any[]): SpvValidationTest => {
  if (!items || items.length === 0) {
    return {
      name: 'Tax Category Codes',
      status: 'warning',
      message: 'No items to validate'
    };
  }

  // Standard Romanian tax categories
  const validCategories = {
    19: 'S',  // Standard rate
    9: 'S',   // Reduced rate
    5: 'S',   // Super-reduced rate
    0: 'Z'    // Zero rated
  };

  const hasValidCategories = items.every(item => 
    validCategories.hasOwnProperty(item.vat_rate)
  );

  if (hasValidCategories) {
    return {
      name: 'Tax Category Codes',
      status: 'pass',
      message: 'All items have valid tax categories'
    };
  }

  return {
    name: 'Tax Category Codes',
    status: 'warning',
    message: 'Some items may have non-standard tax categories'
  };
};

// Test 24: SPV Credentials Configuration
const validateSpvCredentials = (profile: any): SpvValidationTest => {
  const hasClientId = profile?.spv_client_id && profile.spv_client_id.trim().length > 0;
  const hasClientSecret = profile?.spv_client_secret && profile.spv_client_secret.trim().length > 0;

  if (hasClientId && hasClientSecret) {
    return {
      name: 'SPV Credentials Configuration',
      status: 'pass',
      message: 'SPV credentials are configured'
    };
  }

  const missing = [];
  if (!hasClientId) missing.push('Client ID');
  if (!hasClientSecret) missing.push('Client Secret');

  return {
    name: 'SPV Credentials Configuration',
    status: 'fail',
    message: `Missing SPV credentials: ${missing.join(', ')}`,
    details: 'Configure SPV credentials in Settings to send invoices to ANAF'
  };
};

// Test 25: Invoice Approval Status
const validateApprovalStatus = (invoice: any): SpvValidationTest => {
  if (invoice.accountant_approved === true) {
    return {
      name: 'Invoice Approval Status',
      status: 'pass',
      message: 'Invoice is approved by accountant'
    };
  }

  if (invoice.accountant_approved === false) {
    return {
      name: 'Invoice Approval Status',
      status: 'fail',
      message: 'Invoice has been rejected by accountant',
      details: invoice.approval_notes || 'No rejection notes provided'
    };
  }

  return {
    name: 'Invoice Approval Status',
    status: 'warning',
    message: 'Invoice is pending accountant approval',
    details: 'Invoices should be approved before sending to ANAF SPV'
  };
};
