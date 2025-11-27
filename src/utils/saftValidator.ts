export interface ValidationResult {
  testNumber: number;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface XSDValidationError {
  element: string;
  error: string;
  path: string;
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

  // Test 9: Master File - Products
  const products = xmlDoc.querySelectorAll('MasterFiles Products Product');
  let productsValid = true;
  let productsDetails = '';
  products.forEach((product, index) => {
    const productCode = getValue(product, 'ProductCode');
    const productDescription = getValue(product, 'ProductDescription');
    const productNumberCode = getValue(product, 'ProductNumberCode');
    
    if (!productCode || !productDescription) {
      productsValid = false;
      productsDetails += `Produs ${index + 1}: date incomplete. `;
    }
  });
  results.push({
    testNumber: 9,
    testName: 'Master File - Produse',
    status: products.length > 0 ? (productsValid ? 'pass' : 'fail') : 'warning',
    message: products.length > 0 ? (productsValid ? `${products.length} produse validate cu succes` : 'Produse cu date incomplete') : 'Nu există produse în fișier',
    details: productsDetails || `Total produse: ${products.length}`
  });

  // Test 10: Master File - Analysis Types
  const analysisTypes = xmlDoc.querySelectorAll('MasterFiles Analysis AnalysisTypeTable AnalysisTypeTableEntry');
  let analysisValid = true;
  let analysisDetails = '';
  analysisTypes.forEach((entry, index) => {
    const analysisType = getValue(entry, 'AnalysisType');
    const analysisTypeDescription = getValue(entry, 'AnalysisTypeDescription');
    
    if (!analysisType || !analysisTypeDescription) {
      analysisValid = false;
      analysisDetails += `Analiză ${index + 1}: date incomplete. `;
    }
  });
  results.push({
    testNumber: 10,
    testName: 'Master File - Tipuri Analiză',
    status: analysisTypes.length > 0 ? (analysisValid ? 'pass' : 'fail') : 'warning',
    message: analysisTypes.length > 0 ? (analysisValid ? `${analysisTypes.length} tipuri analiză validate cu succes` : 'Tipuri analiză incomplete') : 'Nu există tipuri de analiză',
    details: analysisDetails || `Total tipuri analiză: ${analysisTypes.length}`
  });

  // Test 11: Master File - UOM Table
  const uomEntries = xmlDoc.querySelectorAll('MasterFiles UOMTable UOMTableEntry');
  let uomValid = true;
  let uomDetails = '';
  uomEntries.forEach((entry, index) => {
    const unitOfMeasure = getValue(entry, 'UnitOfMeasure');
    const description = getValue(entry, 'Description');
    
    if (!unitOfMeasure || !description) {
      uomValid = false;
      uomDetails += `UOM ${index + 1}: date incomplete. `;
    }
  });
  results.push({
    testNumber: 11,
    testName: 'Master File - Unități Măsură',
    status: uomEntries.length > 0 ? (uomValid ? 'pass' : 'fail') : 'warning',
    message: uomEntries.length > 0 ? (uomValid ? `${uomEntries.length} unități măsură validate cu succes` : 'Unități măsură incomplete') : 'Nu există unități de măsură',
    details: uomDetails || `Total unități măsură: ${uomEntries.length}`
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

  // Test 14: Each Transaction Balance (Debit = Credit per transaction)
  const transactions = xmlDoc.querySelectorAll('GeneralLedgerEntries Journal Transaction');
  let unbalancedTransactions = 0;
  let transactionBalanceDetails = '';
  transactions.forEach((transaction, index) => {
    const transactionID = getValue(transaction, 'TransactionID');
    const lines = transaction.querySelectorAll('Line');
    let transDebit = 0;
    let transCredit = 0;
    lines.forEach(line => {
      transDebit += parseFloat(getValue(line, 'DebitAmount') || '0');
      transCredit += parseFloat(getValue(line, 'CreditAmount') || '0');
    });
    const diff = Math.abs(transDebit - transCredit);
    if (diff > 0.01) {
      unbalancedTransactions++;
      transactionBalanceDetails += `Tranzacție ${transactionID || index + 1}: Debit ${transDebit.toFixed(2)} ≠ Credit ${transCredit.toFixed(2)}. `;
    }
  });
  results.push({
    testNumber: 14,
    testName: 'Echilibru Individual Tranzacții',
    status: unbalancedTransactions === 0 ? 'pass' : 'fail',
    message: unbalancedTransactions === 0 ? `Toate ${transactions.length} tranzacțiile sunt echilibrate` : `${unbalancedTransactions} tranzacții neechilibrate`,
    details: transactionBalanceDetails || `Total tranzacții verificate: ${transactions.length}`
  });

  // Test 15: Customer/Supplier References Validity
  let invalidReferences = 0;
  let referenceDetails = '';
  const customerIds = new Set<string>();
  const supplierIds = new Set<string>();
  
  customers.forEach(customer => {
    const custId = getValue(customer, 'CustomerID');
    if (custId) customerIds.add(custId);
  });
  
  suppliers.forEach(supplier => {
    const suppId = getValue(supplier, 'SupplierID');
    if (suppId) supplierIds.add(suppId);
  });

  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach(line => {
      const customerID = getValue(line, 'CustomerID');
      const supplierID = getValue(line, 'SupplierID');
      
      if (customerID && !customerIds.has(customerID)) {
        invalidReferences++;
        referenceDetails += `Tranzacție ${index + 1}: Client ${customerID} nu există în MasterFiles. `;
      }
      if (supplierID && !supplierIds.has(supplierID)) {
        invalidReferences++;
        referenceDetails += `Tranzacție ${index + 1}: Furnizor ${supplierID} nu există în MasterFiles. `;
      }
    });
  });
  results.push({
    testNumber: 15,
    testName: 'Validitate Referințe Client/Furnizor',
    status: invalidReferences === 0 ? 'pass' : 'fail',
    message: invalidReferences === 0 ? 'Toate referințele către clienți/furnizori sunt valide' : `${invalidReferences} referințe invalide găsite`,
    details: referenceDetails || 'Toate referințele sunt corecte'
  });

  // Test 16: General Ledger Entries - Total Debit = Total Credit
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

  // Test 17: Account References Validity in Transactions
  const accountIds = new Set<string>();
  accounts.forEach(account => {
    const accId = getValue(account, 'AccountID');
    if (accId) accountIds.add(accId);
  });

  let invalidAccountRefs = 0;
  let accountRefDetails = '';
  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach(line => {
      const accountID = getValue(line, 'AccountID');
      if (accountID && !accountIds.has(accountID)) {
        invalidAccountRefs++;
        accountRefDetails += `Tranzacție ${index + 1}: Cont ${accountID} nu există în plan conturi. `;
      }
    });
  });
  results.push({
    testNumber: 17,
    testName: 'Validitate Referințe Conturi',
    status: invalidAccountRefs === 0 ? 'pass' : 'fail',
    message: invalidAccountRefs === 0 ? 'Toate conturile din tranzacții există în planul de conturi' : `${invalidAccountRefs} referințe invalide către conturi`,
    details: accountRefDetails || 'Toate referințele sunt corecte'
  });

  // Test 18: Transaction Date Validity
  const fiscalYearStart = getValue(xmlDoc.querySelector('Header'), 'FiscalYear');
  const startDate = getValue(xmlDoc.querySelector('Header'), 'StartDate');
  const endDate = getValue(xmlDoc.querySelector('Header'), 'EndDate');
  let invalidDates = 0;
  let dateDetails = '';
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    transactions.forEach((transaction, index) => {
      const transDate = getValue(transaction, 'TransactionDate');
      if (transDate) {
        const tDate = new Date(transDate);
        if (tDate < start || tDate > end) {
          invalidDates++;
          dateDetails += `Tranzacție ${index + 1}: Data ${transDate} în afara perioadei ${startDate} - ${endDate}. `;
        }
      }
    });
  }
  results.push({
    testNumber: 18,
    testName: 'Validitate Date Tranzacții',
    status: invalidDates === 0 ? 'pass' : 'fail',
    message: invalidDates === 0 ? 'Toate datele tranzacțiilor sunt în perioada raportată' : `${invalidDates} tranzacții cu date invalide`,
    details: dateDetails || `Perioadă raportată: ${startDate} - ${endDate}`
  });

  // Test 19: Tax Code References Validity
  const taxCodes = new Set<string>();
  taxEntries.forEach(entry => {
    const code = getValue(entry, 'TaxCode');
    if (code) taxCodes.add(code);
  });

  let invalidTaxRefs = 0;
  let taxRefDetails = '';
  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach(line => {
      const taxCode = getValue(line.querySelector('TaxInformation'), 'TaxCode');
      if (taxCode && !taxCodes.has(taxCode)) {
        invalidTaxRefs++;
        taxRefDetails += `Tranzacție ${index + 1}: Cod taxă ${taxCode} nu există în tabel. `;
      }
    });
  });
  results.push({
    testNumber: 19,
    testName: 'Validitate Coduri Taxă',
    status: invalidTaxRefs === 0 ? 'pass' : 'fail',
    message: invalidTaxRefs === 0 ? 'Toate codurile de taxă sunt valide' : `${invalidTaxRefs} referințe invalide către coduri taxă`,
    details: taxRefDetails || 'Toate codurile taxă sunt corecte'
  });

  // Test 20: Transaction Lines Completeness
  let incompleteLines = 0;
  let lineDetails = '';
  transactions.forEach((transaction, index) => {
    const transID = getValue(transaction, 'TransactionID');
    const lines = transaction.querySelectorAll('Line');
    lines.forEach((line, lineIndex) => {
      const recordID = getValue(line, 'RecordID');
      const accountID = getValue(line, 'AccountID');
      const debitAmount = getValue(line, 'DebitAmount');
      const creditAmount = getValue(line, 'CreditAmount');
      
      if (!recordID || !accountID || (!debitAmount && !creditAmount)) {
        incompleteLines++;
        lineDetails += `Tranzacție ${transID || index + 1}, Linie ${lineIndex + 1}: date incomplete. `;
      }
    });
  });
  results.push({
    testNumber: 20,
    testName: 'Completitudine Linii Tranzacții',
    status: incompleteLines === 0 ? 'pass' : 'fail',
    message: incompleteLines === 0 ? 'Toate liniile tranzacțiilor sunt complete' : `${incompleteLines} linii incomplete`,
    details: lineDetails || 'Toate liniile sunt complete'
  });

  // Test 21: Journal ID Consistency
  const journals = xmlDoc.querySelectorAll('GeneralLedgerEntries Journal');
  let invalidJournals = 0;
  let journalDetails = '';
  journals.forEach((journal, index) => {
    const journalID = getValue(journal, 'JournalID');
    const description = getValue(journal, 'Description');
    
    if (!journalID || !description) {
      invalidJournals++;
      journalDetails += `Jurnal ${index + 1}: date incomplete (JournalID sau Description lipsă). `;
    }
  });
  results.push({
    testNumber: 21,
    testName: 'Consistență Jurnale',
    status: invalidJournals === 0 ? 'pass' : 'fail',
    message: invalidJournals === 0 ? `${journals.length} jurnale validate cu succes` : `${invalidJournals} jurnale cu date incomplete`,
    details: journalDetails || `Total jurnale: ${journals.length}`
  });

  // Test 22: Header Completeness
  const header = xmlDoc.querySelector('Header');
  const auditFileVersion = getValue(header, 'AuditFileVersion');
  const companyID = getValue(header, 'CompanyID');
  const taxRegistrationNumber = getValue(header, 'TaxRegistrationNumber');
  const taxAccountingBasis = getValue(header, 'TaxAccountingBasis');
  const companyName = getValue(header, 'CompanyName');
  const businessName = getValue(header, 'BusinessName');
  
  const headerComplete = auditFileVersion && companyID && taxRegistrationNumber && 
                        taxAccountingBasis && companyName && businessName;
  results.push({
    testNumber: 22,
    testName: 'Completitudine Header',
    status: headerComplete ? 'pass' : 'fail',
    message: headerComplete ? 'Header complet cu toate câmpurile obligatorii' : 'Header incomplet - câmpuri obligatorii lipsă',
    details: `AuditFileVersion: ${auditFileVersion || 'LIPSĂ'}, CompanyID: ${companyID || 'LIPSĂ'}, TaxRegistrationNumber: ${taxRegistrationNumber || 'LIPSĂ'}`
  });

  // Test 23: Currency Code Validity
  const headerCurrency = getValue(header, 'CurrencyCode');
  let invalidCurrencies = 0;
  let currencyDetails = '';
  
  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach(line => {
      const currency = getValue(line, 'CurrencyCode');
      if (currency && currency !== headerCurrency && currency !== 'RON') {
        invalidCurrencies++;
        currencyDetails += `Tranzacție ${index + 1}: Monedă ${currency} diferită de moneda raportării. `;
      }
    });
  });
  results.push({
    testNumber: 23,
    testName: 'Validitate Coduri Monedă',
    status: invalidCurrencies === 0 ? 'pass' : 'fail',
    message: invalidCurrencies === 0 ? 'Toate codurile de monedă sunt valide' : `${invalidCurrencies} coduri monedă invalide`,
    details: currencyDetails || `Moneda raportării: ${headerCurrency || 'RON'}`
  });

  // Test 24: Tax Amounts Consistency
  let inconsistentTaxAmounts = 0;
  let taxAmountDetails = '';
  
  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach((line, lineIndex) => {
      const taxInfo = line.querySelector('TaxInformation');
      if (taxInfo) {
        const taxType = getValue(taxInfo, 'TaxType');
        const taxCode = getValue(taxInfo, 'TaxCode');
        const taxPercentage = parseFloat(getValue(taxInfo, 'TaxPercentage') || '0');
        const taxBase = parseFloat(getValue(taxInfo, 'TaxBase') || '0');
        const taxAmount = parseFloat(getValue(taxInfo, 'TaxAmount') || '0');
        
        if (taxBase > 0 && taxPercentage > 0) {
          const calculatedTax = (taxBase * taxPercentage) / 100;
          const diff = Math.abs(calculatedTax - taxAmount);
          if (diff > 0.02) {
            inconsistentTaxAmounts++;
            taxAmountDetails += `Tranzacție ${index + 1}, Linie ${lineIndex + 1}: Taxă calculată ${calculatedTax.toFixed(2)} ≠ Taxă declarată ${taxAmount.toFixed(2)}. `;
          }
        }
      }
    });
  });
  results.push({
    testNumber: 24,
    testName: 'Consistență Sume Taxe',
    status: inconsistentTaxAmounts === 0 ? 'pass' : 'fail',
    message: inconsistentTaxAmounts === 0 ? 'Toate sumele de taxe sunt consistente' : `${inconsistentTaxAmounts} inconsistențe în calcul taxe`,
    details: taxAmountDetails || 'Toate calculele de taxe sunt corecte'
  });

  // Test 25: Source Documents References
  let missingSourceDocs = 0;
  let sourceDocDetails = '';
  
  transactions.forEach((transaction, index) => {
    const lines = transaction.querySelectorAll('Line');
    lines.forEach((line, lineIndex) => {
      const sourceDocID = getValue(line, 'SourceDocumentID');
      // For Romania, source documents are typically required
      if (!sourceDocID && (getValue(line, 'DebitAmount') || getValue(line, 'CreditAmount'))) {
        missingSourceDocs++;
        sourceDocDetails += `Tranzacție ${index + 1}, Linie ${lineIndex + 1}: Lipsă document sursă. `;
      }
    });
  });
  results.push({
    testNumber: 25,
    testName: 'Referințe Documente Sursă',
    status: missingSourceDocs === 0 ? 'pass' : 'warning',
    message: missingSourceDocs === 0 ? 'Toate liniile au documente sursă' : `${missingSourceDocs} linii fără document sursă`,
    details: sourceDocDetails || 'Toate liniile au documente sursă'
  });

  // Test 26: Balance Formula Verification (Opening + Debit - Credit = Closing)
  let balanceFormulaErrors = 0;
  let balanceFormulaDetails = '';
  
  accounts.forEach((account, index) => {
    const accountID = getValue(account, 'AccountID');
    const openingDebit = parseFloat(getValue(account, 'OpeningDebitBalance') || '0');
    const openingCredit = parseFloat(getValue(account, 'OpeningCreditBalance') || '0');
    const closingDebit = parseFloat(getValue(account, 'ClosingDebitBalance') || '0');
    const closingCredit = parseFloat(getValue(account, 'ClosingCreditBalance') || '0');
    
    // Calculate movements for this account
    let accountDebits = 0;
    let accountCredits = 0;
    transactions.forEach(transaction => {
      const lines = transaction.querySelectorAll('Line');
      lines.forEach(line => {
        if (getValue(line, 'AccountID') === accountID) {
          accountDebits += parseFloat(getValue(line, 'DebitAmount') || '0');
          accountCredits += parseFloat(getValue(line, 'CreditAmount') || '0');
        }
      });
    });
    
    // Verify balance formula
    const calculatedClosingDebit = Math.max(0, openingDebit + accountDebits - openingCredit - accountCredits);
    const calculatedClosingCredit = Math.max(0, openingCredit + accountCredits - openingDebit - accountDebits);
    
    const debitDiff = Math.abs(calculatedClosingDebit - closingDebit);
    const creditDiff = Math.abs(calculatedClosingCredit - closingCredit);
    
    if (debitDiff > 0.02 || creditDiff > 0.02) {
      balanceFormulaErrors++;
      balanceFormulaDetails += `Cont ${accountID}: Sold calculat (D:${calculatedClosingDebit.toFixed(2)}, C:${calculatedClosingCredit.toFixed(2)}) ≠ Sold declarat (D:${closingDebit.toFixed(2)}, C:${closingCredit.toFixed(2)}). `;
    }
  });
  results.push({
    testNumber: 26,
    testName: 'Verificare Formulă Solduri',
    status: balanceFormulaErrors === 0 ? 'pass' : 'fail',
    message: balanceFormulaErrors === 0 ? 'Formula soldurilor este corectă pentru toate conturile' : `${balanceFormulaErrors} conturi cu solduri incorecte`,
    details: balanceFormulaDetails || 'Toate soldurile respectă formula: Sold Inițial + Rulaj Debitor - Rulaj Creditor = Sold Final'
  });

  // Test 27: Number of Entries Consistency
  const numberOfEntries = xmlDoc.querySelector('Header NumberOfEntries');
  const declaredEntries = parseInt(getValue(numberOfEntries?.parentElement, 'NumberOfEntries') || '0');
  const actualEntries = transactions.length;
  results.push({
    testNumber: 27,
    testName: 'Consistență Număr Înregistrări',
    status: declaredEntries === actualEntries ? 'pass' : 'fail',
    message: declaredEntries === actualEntries ? `Numărul declarat (${declaredEntries}) corespunde cu numărul real de înregistrări` : `Discrepanță: Declarat ${declaredEntries}, Real ${actualEntries}`,
    details: `Înregistrări declarate în header: ${declaredEntries}, Înregistrări găsite: ${actualEntries}`
  });

  // Test 28: XSD Schema Structure Validation
  const xsdValidation = validateXSDStructure(xmlDoc, getValue);
  results.push({
    testNumber: 28,
    testName: 'Validare Structură XSD (Schema ANAF)',
    status: xsdValidation.errors.length === 0 ? 'pass' : 'fail',
    message: xsdValidation.errors.length === 0 
      ? 'Structura XML respectă schema oficială SAF-T România' 
      : `${xsdValidation.errors.length} violări de structură XSD detectate`,
    details: xsdValidation.errors.length > 0 
      ? xsdValidation.errors.slice(0, 10).map(err => `${err.path}: ${err.error}`).join('\n') + (xsdValidation.errors.length > 10 ? `\n...și încă ${xsdValidation.errors.length - 10} erori` : '')
      : 'Toate elementele obligatorii prezente, tipuri de date corecte, enumerări valide'
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

// XSD Schema Structure Validation based on Romanian SAF-T specification
function validateXSDStructure(
  doc: Document, 
  getValue: (element: Element | null, tagName: string) => string
): { errors: XSDValidationError[] } {
  const errors: XSDValidationError[] = [];

  // Helper to check required element
  const checkRequired = (parent: Element | null, path: string, elementName: string): Element | null => {
    if (!parent) return null;
    const element = parent.querySelector(elementName);
    if (!element) {
      errors.push({
        element: elementName,
        error: 'Element obligatoriu lipsă',
        path: `${path}/${elementName}`
      });
    }
    return element;
  };

  // Helper to validate date format (YYYY-MM-DD)
  const validateDate = (value: string | null, elementName: string, path: string): boolean => {
    if (!value) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      errors.push({
        element: elementName,
        error: `Format dată invalid. Așteptat YYYY-MM-DD, primit: ${value}`,
        path: path
      });
      return false;
    }
    return true;
  };

  // Helper to validate decimal format
  const validateDecimal = (value: string | null, elementName: string, path: string): boolean => {
    if (!value) return true; // Optional decimals
    const decimalRegex = /^-?\d+(\.\d{1,2})?$/;
    if (!decimalRegex.test(value)) {
      errors.push({
        element: elementName,
        error: `Format zecimal invalid: ${value}`,
        path: path
      });
      return false;
    }
    return true;
  };

  // 1. Validate AuditFile root element
  const auditFile = doc.documentElement;
  if (auditFile.tagName !== 'AuditFile') {
    errors.push({
      element: 'AuditFile',
      error: 'Elementul root trebuie să fie AuditFile',
      path: '/'
    });
    return { errors };
  }

  // 2. Validate Header structure
  const header = auditFile.querySelector('Header');
  if (!header) {
    errors.push({
      element: 'Header',
      error: 'Element Header obligatoriu lipsă',
      path: 'AuditFile/Header'
    });
  } else {
    // Required Header fields
    checkRequired(header, 'Header', 'AuditFileVersion');
    const version = getValue(header, 'AuditFileVersion');
    if (version && !['1.0', '1.01_01'].includes(version)) {
      errors.push({
        element: 'AuditFileVersion',
        error: `Versiune invalidă. Trebuie să fie 1.0 sau 1.01_01, primit: ${version}`,
        path: 'Header/AuditFileVersion'
      });
    }

    checkRequired(header, 'Header', 'CompanyID');
    const companyID = getValue(header, 'CompanyID');
    if (companyID && companyID.length > 50) {
      errors.push({
        element: 'CompanyID',
        error: 'CompanyID depășește lungimea maximă de 50 caractere',
        path: 'Header/CompanyID'
      });
    }

    checkRequired(header, 'Header', 'TaxRegistrationNumber');
    checkRequired(header, 'Header', 'TaxAccountingBasis');
    const taxBasis = getValue(header, 'TaxAccountingBasis');
    if (taxBasis && !['F', 'I', 'C', 'S'].includes(taxBasis)) {
      errors.push({
        element: 'TaxAccountingBasis',
        error: `TaxAccountingBasis invalid. Trebuie să fie F, I, C sau S, primit: ${taxBasis}`,
        path: 'Header/TaxAccountingBasis'
      });
    }

    checkRequired(header, 'Header', 'CompanyName');
    checkRequired(header, 'Header', 'DateCreated');
    validateDate(getValue(header, 'DateCreated'), 'DateCreated', 'Header/DateCreated');

    checkRequired(header, 'Header', 'StartDate');
    checkRequired(header, 'Header', 'EndDate');
    validateDate(getValue(header, 'StartDate'), 'StartDate', 'Header/StartDate');
    validateDate(getValue(header, 'EndDate'), 'EndDate', 'Header/EndDate');

    checkRequired(header, 'Header', 'CurrencyCode');
    const currencyCode = getValue(header, 'CurrencyCode');
    if (currencyCode && currencyCode.length !== 3) {
      errors.push({
        element: 'CurrencyCode',
        error: `CurrencyCode trebuie să aibă 3 caractere (ISO 4217), primit: ${currencyCode}`,
        path: 'Header/CurrencyCode'
      });
    }

    checkRequired(header, 'Header', 'TaxEntity');
    checkRequired(header, 'Header', 'ProductCompanyTaxID');
  }

  // 3. Validate MasterFiles structure
  const masterFiles = auditFile.querySelector('MasterFiles');
  if (!masterFiles) {
    errors.push({
      element: 'MasterFiles',
      error: 'Element MasterFiles obligatoriu lipsă',
      path: 'AuditFile/MasterFiles'
    });
  } else {
    // GeneralLedgerAccounts validation
    const glAccounts = masterFiles.querySelectorAll('GeneralLedgerAccounts Account');
    glAccounts.forEach((account, index) => {
      const accountPath = `MasterFiles/GeneralLedgerAccounts/Account[${index + 1}]`;
      
      checkRequired(account, accountPath, 'AccountID');
      const accountID = getValue(account, 'AccountID');
      if (accountID && accountID.length > 30) {
        errors.push({
          element: 'AccountID',
          error: 'AccountID depășește lungimea maximă de 30 caractere',
          path: `${accountPath}/AccountID`
        });
      }

      checkRequired(account, accountPath, 'AccountDescription');
      checkRequired(account, accountPath, 'AccountType');
      const accountType = getValue(account, 'AccountType');
      if (accountType && !['GL', 'GR', 'GM', 'AR', 'AP', 'AA', 'OR', 'OC'].includes(accountType)) {
        errors.push({
          element: 'AccountType',
          error: `AccountType invalid: ${accountType}. Trebuie să fie: GL, GR, GM, AR, AP, AA, OR sau OC`,
          path: `${accountPath}/AccountType`
        });
      }

      validateDecimal(getValue(account, 'OpeningDebitBalance'), 'OpeningDebitBalance', accountPath);
      validateDecimal(getValue(account, 'OpeningCreditBalance'), 'OpeningCreditBalance', accountPath);
      validateDecimal(getValue(account, 'ClosingDebitBalance'), 'ClosingDebitBalance', accountPath);
      validateDecimal(getValue(account, 'ClosingCreditBalance'), 'ClosingCreditBalance', accountPath);
    });

    // Customer validation
    const customers = masterFiles.querySelectorAll('Customer');
    customers.forEach((customer, index) => {
      const customerPath = `MasterFiles/Customer[${index + 1}]`;
      checkRequired(customer, customerPath, 'CustomerID');
      
      const customerID = getValue(customer, 'CustomerID');
      if (customerID && customerID.length > 30) {
        errors.push({
          element: 'CustomerID',
          error: 'CustomerID depășește lungimea maximă de 30 caractere',
          path: `${customerPath}/CustomerID`
        });
      }

      checkRequired(customer, customerPath, 'CompanyName');
      const billingAddress = customer.querySelector('BillingAddress');
      if (billingAddress) {
        checkRequired(billingAddress, `${customerPath}/BillingAddress`, 'City');
        checkRequired(billingAddress, `${customerPath}/BillingAddress`, 'Country');
      }
    });

    // Supplier validation
    const suppliers = masterFiles.querySelectorAll('Supplier');
    suppliers.forEach((supplier, index) => {
      const supplierPath = `MasterFiles/Supplier[${index + 1}]`;
      checkRequired(supplier, supplierPath, 'SupplierID');
      
      const supplierID = getValue(supplier, 'SupplierID');
      if (supplierID && supplierID.length > 30) {
        errors.push({
          element: 'SupplierID',
          error: 'SupplierID depășește lungimea maximă de 30 caractere',
          path: `${supplierPath}/SupplierID`
        });
      }

      checkRequired(supplier, supplierPath, 'CompanyName');
    });

    // TaxTable validation
    const taxEntries = masterFiles.querySelectorAll('TaxTable TaxTableEntry');
    taxEntries.forEach((entry, index) => {
      const taxPath = `MasterFiles/TaxTable/TaxTableEntry[${index + 1}]`;
      
      checkRequired(entry, taxPath, 'TaxType');
      const taxType = getValue(entry, 'TaxType');
      if (taxType && !['IVA', 'IS', 'NS', 'NA'].includes(taxType)) {
        errors.push({
          element: 'TaxType',
          error: `TaxType invalid. Trebuie să fie IVA, IS, NS sau NA, primit: ${taxType}`,
          path: `${taxPath}/TaxType`
        });
      }

      checkRequired(entry, taxPath, 'TaxCode');
      checkRequired(entry, taxPath, 'Description');
      checkRequired(entry, taxPath, 'TaxPercentage');
      validateDecimal(getValue(entry, 'TaxPercentage'), 'TaxPercentage', taxPath);
    });
  }

  // 4. Validate GeneralLedgerEntries structure
  const glEntries = auditFile.querySelector('GeneralLedgerEntries');
  if (glEntries) {
    const journals = glEntries.querySelectorAll('Journal');
    journals.forEach((journal, jIndex) => {
      const journalPath = `GeneralLedgerEntries/Journal[${jIndex + 1}]`;
      checkRequired(journal, journalPath, 'JournalID');
      checkRequired(journal, journalPath, 'Description');
      
      const transactions = journal.querySelectorAll('Transaction');
      transactions.forEach((transaction, tIndex) => {
        const transPath = `${journalPath}/Transaction[${tIndex + 1}]`;
        
        checkRequired(transaction, transPath, 'TransactionID');
        checkRequired(transaction, transPath, 'Period');
        checkRequired(transaction, transPath, 'TransactionDate');
        validateDate(getValue(transaction, 'TransactionDate'), 'TransactionDate', transPath);

        const lines = transaction.querySelectorAll('Line');
        if (lines.length < 2) {
          errors.push({
            element: 'Lines',
            error: 'Tranzacția trebuie să aibă minimum 2 linii (debit și credit)',
            path: `${transPath}/Lines`
          });
        }

        lines.forEach((line, lIndex) => {
          const linePath = `${transPath}/Lines/Line[${lIndex + 1}]`;
          
          checkRequired(line, linePath, 'RecordID');
          checkRequired(line, linePath, 'AccountID');
          
          const debit = getValue(line, 'DebitAmount');
          const credit = getValue(line, 'CreditAmount');
          
          if (!debit && !credit) {
            errors.push({
              element: 'Line',
              error: 'Linia trebuie să aibă DebitAmount sau CreditAmount',
              path: linePath
            });
          }

          validateDecimal(debit, 'DebitAmount', linePath);
          validateDecimal(credit, 'CreditAmount', linePath);
        });
      });
    });
  }

  // 5. Validate SourceDocuments if present
  const sourceDocuments = auditFile.querySelector('SourceDocuments');
  if (sourceDocuments) {
    const salesInvoices = sourceDocuments.querySelectorAll('SalesInvoices Invoice');
    salesInvoices.forEach((invoice, index) => {
      const invoicePath = `SourceDocuments/SalesInvoices/Invoice[${index + 1}]`;
      
      checkRequired(invoice, invoicePath, 'InvoiceNo');
      checkRequired(invoice, invoicePath, 'InvoiceDate');
      validateDate(getValue(invoice, 'InvoiceDate'), 'InvoiceDate', invoicePath);

      const invoiceType = getValue(invoice, 'InvoiceType');
      if (invoiceType && !['FT', 'FS', 'FR', 'ND', 'NC'].includes(invoiceType)) {
        errors.push({
          element: 'InvoiceType',
          error: `InvoiceType invalid: ${invoiceType}. Trebuie să fie: FT, FS, FR, ND sau NC`,
          path: `${invoicePath}/InvoiceType`
        });
      }

      checkRequired(invoice, invoicePath, 'CustomerID');
    });
  }

  return { errors };
}