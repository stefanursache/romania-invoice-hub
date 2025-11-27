export interface ValidationResult {
  testNumber: number;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface ValidationReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: ValidationResult[];
}

export const validateSaftXml = (xmlContent: string): ValidationReport => {
  const results: ValidationResult[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    return {
      totalTests: 0,
      passed: 0,
      failed: 1,
      warnings: 0,
      results: [{
        testNumber: 0,
        testName: 'XML Parsing',
        status: 'fail',
        message: 'Fișierul XML nu este valid',
        details: parserError.textContent || 'Eroare de parsare necunoscută'
      }]
    };
  }

  // Helper function to get element value
  const getValue = (element: Element | null, tagName: string): string => {
    return element?.querySelector(tagName)?.textContent || '';
  };

  // Test 1: Header - Company Address (City, Country)
  const companyAddress = xmlDoc.querySelector('Header Company CompanyAddress');
  const city = getValue(companyAddress, 'City');
  const country = getValue(companyAddress, 'Country');
  results.push({
    testNumber: 1,
    testName: 'Header - Adresă Companie (Oraș, Țară)',
    status: city && country ? 'pass' : 'fail',
    message: city && country ? 'Câmpurile City și Country sunt completate' : 'Câmpurile City și/sau Country lipsesc',
    details: `City: ${city || 'LIPSĂ'}, Country: ${country || 'LIPSĂ'}`
  });

  // Test 2: Header - Contact (First Name, Last Name)
  const contact = xmlDoc.querySelector('Header Company Contact');
  const firstName = getValue(contact, 'FirstName');
  const lastName = getValue(contact, 'LastName');
  results.push({
    testNumber: 2,
    testName: 'Header - Contact (Prenume, Nume)',
    status: firstName && lastName ? 'pass' : 'fail',
    message: firstName && lastName ? 'Câmpurile FirstName și LastName sunt completate' : 'Câmpurile FirstName și/sau LastName lipsesc',
    details: `FirstName: ${firstName || 'LIPSĂ'}, LastName: ${lastName || 'LIPSĂ'}`
  });

  // Test 3: Header - Telephone
  const telephone = getValue(xmlDoc.querySelector('Header Company'), 'Telephone');
  results.push({
    testNumber: 3,
    testName: 'Header - Telefon',
    status: telephone ? 'pass' : 'fail',
    message: telephone ? 'Câmpul Telephone este completat' : 'Câmpul Telephone lipsește',
    details: `Telephone: ${telephone || 'LIPSĂ'}`
  });

  // Test 4: Header - Bank Account
  const bankAccount = xmlDoc.querySelector('Header Company BankAccount');
  const ibanNumber = getValue(bankAccount, 'IBANNumber');
  const bankAccountNumber = getValue(bankAccount, 'BankAccountNumber');
  const bankAccountName = getValue(bankAccount, 'BankAccountName');
  const sortCode = getValue(bankAccount, 'SortCode');
  const hasBankInfo = (ibanNumber || bankAccountNumber) && bankAccountName && sortCode;
  results.push({
    testNumber: 4,
    testName: 'Header - Cont Bancar',
    status: hasBankInfo ? 'pass' : 'fail',
    message: hasBankInfo ? 'Informațiile contului bancar sunt complete' : 'Informațiile contului bancar sunt incomplete',
    details: `IBAN/AccountNumber: ${ibanNumber || bankAccountNumber || 'LIPSĂ'}, Name: ${bankAccountName || 'LIPSĂ'}, SortCode: ${sortCode || 'LIPSĂ'}`
  });

  // Test 5: Master File - General Ledger Accounts
  const accounts = xmlDoc.querySelectorAll('MasterFiles GeneralLedgerAccounts Account');
  let accountsValid = true;
  let accountsDetails = '';
  accounts.forEach((account, index) => {
    const accountID = getValue(account, 'AccountID');
    const accountDescription = getValue(account, 'AccountDescription');
    const accountType = getValue(account, 'AccountType');
    const openingDebitBalance = getValue(account, 'OpeningDebitBalance');
    const openingCreditBalance = getValue(account, 'OpeningCreditBalance');
    const closingDebitBalance = getValue(account, 'ClosingDebitBalance');
    const closingCreditBalance = getValue(account, 'ClosingCreditBalance');
    
    if (!accountID || !accountDescription || !accountType) {
      accountsValid = false;
      accountsDetails += `Cont ${index + 1} (${accountID || 'fără ID'}): date incomplete. `;
    }
  });
  results.push({
    testNumber: 5,
    testName: 'Master File - Conturi Contabile',
    status: accounts.length > 0 && accountsValid ? 'pass' : 'fail',
    message: accounts.length > 0 && accountsValid ? `${accounts.length} conturi validate cu succes` : 'Conturi incomplete sau lipsă',
    details: accountsDetails || `Total conturi: ${accounts.length}`
  });

  // Test 6: Master File - Customers
  const customers = xmlDoc.querySelectorAll('MasterFiles Customers Customer');
  let customersValid = true;
  let customersDetails = '';
  customers.forEach((customer, index) => {
    const registrationNumber = getValue(customer, 'RegistrationNumber');
    const customerID = getValue(customer, 'CustomerID');
    const name = getValue(customer, 'CompanyName');
    const customerCity = getValue(customer.querySelector('BillingAddress'), 'City');
    const customerCountry = getValue(customer.querySelector('BillingAddress'), 'Country');
    
    if (!registrationNumber || !name || !customerCity || !customerCountry) {
      customersValid = false;
      customersDetails += `Client ${index + 1}: date incomplete. `;
    }
    if (registrationNumber && customerID && registrationNumber !== customerID) {
      customersValid = false;
      customersDetails += `Client ${index + 1}: RegistrationNumber (${registrationNumber}) ≠ CustomerID (${customerID}). `;
    }
  });
  results.push({
    testNumber: 6,
    testName: 'Master File - Clienți',
    status: customers.length > 0 && customersValid ? 'pass' : customers.length === 0 ? 'warning' : 'fail',
    message: customers.length > 0 && customersValid ? `${customers.length} clienți validați cu succes` : customers.length === 0 ? 'Nu există clienți în fișier' : 'Clienți cu date incomplete',
    details: customersDetails || `Total clienți: ${customers.length}`
  });

  // Test 7: Master File - Suppliers
  const suppliers = xmlDoc.querySelectorAll('MasterFiles Suppliers Supplier');
  let suppliersValid = true;
  let suppliersDetails = '';
  suppliers.forEach((supplier, index) => {
    const registrationNumber = getValue(supplier, 'RegistrationNumber');
    const supplierID = getValue(supplier, 'SupplierID');
    const name = getValue(supplier, 'CompanyName');
    const supplierCity = getValue(supplier.querySelector('BillingAddress'), 'City');
    const supplierCountry = getValue(supplier.querySelector('BillingAddress'), 'Country');
    
    if (!registrationNumber || !name || !supplierCity || !supplierCountry) {
      suppliersValid = false;
      suppliersDetails += `Furnizor ${index + 1}: date incomplete. `;
    }
    if (registrationNumber && supplierID && registrationNumber !== supplierID) {
      suppliersValid = false;
      suppliersDetails += `Furnizor ${index + 1}: RegistrationNumber (${registrationNumber}) ≠ SupplierID (${supplierID}). `;
    }
  });
  results.push({
    testNumber: 7,
    testName: 'Master File - Furnizori',
    status: suppliers.length > 0 && suppliersValid ? 'pass' : suppliers.length === 0 ? 'warning' : 'fail',
    message: suppliers.length > 0 && suppliersValid ? `${suppliers.length} furnizori validați cu succes` : suppliers.length === 0 ? 'Nu există furnizori în fișier' : 'Furnizori cu date incomplete',
    details: suppliersDetails || `Total furnizori: ${suppliers.length}`
  });

  // Test 8: Master File - Tax Table
  const taxEntries = xmlDoc.querySelectorAll('MasterFiles TaxTable TaxTableEntry');
  let taxValid = true;
  let taxDetails = '';
  taxEntries.forEach((entry, index) => {
    const taxType = getValue(entry, 'TaxType');
    const description = getValue(entry, 'Description');
    const taxCode = getValue(entry, 'TaxCode');
    const taxPercentage = getValue(entry, 'TaxPercentage');
    const country = getValue(entry, 'Country');
    
    if (!taxType || !description || !taxCode || !country) {
      taxValid = false;
      taxDetails += `Taxă ${index + 1}: date incomplete. `;
    }
  });
  results.push({
    testNumber: 8,
    testName: 'Master File - Tabel Taxe',
    status: taxEntries.length > 0 && taxValid ? 'pass' : 'fail',
    message: taxEntries.length > 0 && taxValid ? `${taxEntries.length} taxe validate cu succes` : 'Tabel taxe incomplet sau lipsă',
    details: taxDetails || `Total taxe: ${taxEntries.length}`
  });

  // Test 12: Opening Balance Equality (excluding classes 8 and 9)
  let totalOpeningDebit = 0;
  let totalOpeningCredit = 0;
  accounts.forEach(account => {
    const accountID = getValue(account, 'AccountID');
    if (!accountID.startsWith('8') && !accountID.startsWith('9')) {
      totalOpeningDebit += parseFloat(getValue(account, 'OpeningDebitBalance') || '0');
      totalOpeningCredit += parseFloat(getValue(account, 'OpeningCreditBalance') || '0');
    }
  });
  const openingBalanceDiff = Math.abs(totalOpeningDebit - totalOpeningCredit);
  results.push({
    testNumber: 12,
    testName: 'Egalitate Solduri Inițiale',
    status: openingBalanceDiff < 0.01 ? 'pass' : 'fail',
    message: openingBalanceDiff < 0.01 ? 'Soldurile inițiale debitoare și creditoare sunt egale' : 'Soldurile inițiale debitoare și creditoare NU sunt egale',
    details: `Total Debit: ${totalOpeningDebit.toFixed(2)} RON, Total Credit: ${totalOpeningCredit.toFixed(2)} RON, Diferență: ${openingBalanceDiff.toFixed(2)} RON`
  });

  // Test 13: Closing Balance Equality (excluding classes 8 and 9)
  let totalClosingDebit = 0;
  let totalClosingCredit = 0;
  accounts.forEach(account => {
    const accountID = getValue(account, 'AccountID');
    if (!accountID.startsWith('8') && !accountID.startsWith('9')) {
      totalClosingDebit += parseFloat(getValue(account, 'ClosingDebitBalance') || '0');
      totalClosingCredit += parseFloat(getValue(account, 'ClosingCreditBalance') || '0');
    }
  });
  const closingBalanceDiff = Math.abs(totalClosingDebit - totalClosingCredit);
  results.push({
    testNumber: 13,
    testName: 'Egalitate Solduri Finale',
    status: closingBalanceDiff < 0.01 ? 'pass' : 'fail',
    message: closingBalanceDiff < 0.01 ? 'Soldurile finale debitoare și creditoare sunt egale' : 'Soldurile finale debitoare și creditoare NU sunt egale',
    details: `Total Debit: ${totalClosingDebit.toFixed(2)} RON, Total Credit: ${totalClosingCredit.toFixed(2)} RON, Diferență: ${closingBalanceDiff.toFixed(2)} RON`
  });

  // Test 16: General Ledger Entries - Total Debit = Total Credit
  const transactions = xmlDoc.querySelectorAll('GeneralLedgerEntries Journal Transaction');
  let totalTransactionDebit = 0;
  let totalTransactionCredit = 0;
  transactions.forEach(transaction => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach(line => {
      totalTransactionDebit += parseFloat(getValue(line, 'DebitAmount') || '0');
      totalTransactionCredit += parseFloat(getValue(line, 'CreditAmount') || '0');
    });
  });
  const transactionDiff = Math.abs(totalTransactionDebit - totalTransactionCredit);
  results.push({
    testNumber: 16,
    testName: 'Egalitate Rulaje Debitoare și Creditoare',
    status: transactionDiff < 0.01 ? 'pass' : 'fail',
    message: transactionDiff < 0.01 ? 'Rulajele debitoare și creditoare sunt egale' : 'Rulajele debitoare și creditoare NU sunt egale',
    details: `Total Debit: ${totalTransactionDebit.toFixed(2)} RON, Total Credit: ${totalTransactionCredit.toFixed(2)} RON, Diferență: ${transactionDiff.toFixed(2)} RON`
  });

  // Calculate summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  return {
    totalTests: results.length,
    passed,
    failed,
    warnings,
    results
  };
};