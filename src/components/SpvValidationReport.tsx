import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { SpvValidationReport as ValidationReport } from "@/utils/spvValidator";

interface SpvValidationReportProps {
  report: ValidationReport;
}

export const SpvValidationReport = ({ report }: SpvValidationReportProps) => {
  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600">Warning</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalTests}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{report.passed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{report.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{report.warnings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Status Alert */}
      {report.failed > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Factura nu poate fi trimisă la ANAF.</strong> Există {report.failed} erori care trebuie corectate înainte de trimitere.
          </AlertDescription>
        </Alert>
      )}

      {report.failed === 0 && report.warnings > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Factura poate fi trimisă, dar există {report.warnings} avertismente care ar trebui verificate.
          </AlertDescription>
        </Alert>
      )}

      {report.failed === 0 && report.warnings === 0 && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Factura este validă!</strong> Toate testele au trecut cu succes. Factura poate fi trimisă către ANAF SPV.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Rezultate Detaliate Validare</CardTitle>
          <CardDescription>
            Rezultatele testelor de validare pentru conformitatea cu cerințele ANAF e-Factura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(test.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{test.name}</span>
                        {getStatusBadge(test.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{test.message}</p>
                      {test.details && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                          {test.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ANAF Requirements Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Referințe ANAF</CardTitle>
          <CardDescription>Documentație oficială pentru e-Factura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/strategii_anaf/proiecte_digitalizare/e_factura"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline block"
          >
            Portal Oficial e-Factura ANAF
          </a>
          <a
            href="https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline block"
          >
            Procedură Înregistrare Aplicații OAuth
          </a>
          <a
            href="https://static.anaf.ro/static/10/Anaf/Informatii_R/UBL_RO_invoice_specifications.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline block"
          >
            Specificații UBL pentru e-Factura
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
