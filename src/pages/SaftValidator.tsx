import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react";
import { validateSaftXml, ValidationReport } from "@/utils/saftValidator";
import { toast } from "sonner";

const SaftValidator = () => {
  const [xmlContent, setXmlContent] = useState("");
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      toast.error("Vă rugăm să încărcați un fișier XML valid");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlContent(content);
      toast.success("Fișier încărcat cu succes");
    };
    reader.onerror = () => {
      toast.error("Eroare la citirea fișierului");
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    if (!xmlContent.trim()) {
      toast.error("Vă rugăm să încărcați sau să inserați conținut XML");
      return;
    }

    setIsValidating(true);
    setTimeout(() => {
      try {
        const report = validateSaftXml(xmlContent);
        setValidationReport(report);
        
        if (report.failed === 0 && report.warnings === 0) {
          toast.success("Toate testele au trecut cu succes!");
        } else if (report.failed > 0) {
          toast.error(`${report.failed} teste au eșuat`);
        } else {
          toast.warning(`${report.warnings} avertismente detectate`);
        }
      } catch (error) {
        toast.error("Eroare la validarea XML");
        console.error(error);
      } finally {
        setIsValidating(false);
      }
    }, 500);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    };
    const labels = {
      pass: 'TRECUT',
      fail: 'EȘUAT',
      warning: 'AVERTISMENT'
    };
    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Validare SAF-T XML</h1>
          <p className="text-muted-foreground">
            Testați conformitatea fișierelor SAF-T XML conform specificațiilor ANAF
          </p>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Această pagină implementează testele oficiale ANAF pentru validarea fișierelor SAF-T (D406).
            Testele verifică conformitatea datelor pentru a asigura depunerea corectă și completă.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Încărcare Fișier XML</CardTitle>
              <CardDescription>
                Încărcați fișierul SAF-T XML generat sau inserați conținutul manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Încarcă Fișier XML
                    </span>
                  </Button>
                </label>
              </div>

              <Textarea
                placeholder="Sau inserați conținutul XML aici..."
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />

              <Button 
                onClick={handleValidate} 
                disabled={!xmlContent.trim() || isValidating}
                className="w-full"
              >
                {isValidating ? "Validare în curs..." : "Validează SAF-T XML"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rezultate Validare</CardTitle>
              <CardDescription>
                Statistici și sumarul testelor efectuate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card border rounded-lg">
                      <div className="text-2xl font-bold">{validationReport.totalTests}</div>
                      <div className="text-sm text-muted-foreground">Total Teste</div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{validationReport.passed}</div>
                      <div className="text-sm text-green-700">Trecute</div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">{validationReport.failed}</div>
                      <div className="text-sm text-red-700">Eșuate</div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700">{validationReport.warnings}</div>
                      <div className="text-sm text-yellow-700">Avertismente</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Rata de Succes</span>
                    <span className="text-xl font-bold">
                      {Math.round((validationReport.passed / validationReport.totalTests) * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Rezultatele validării vor apărea aici</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {validationReport && (
          <Card>
            <CardHeader>
              <CardTitle>Detalii Teste ({validationReport.results.length} teste)</CardTitle>
              <CardDescription>
                Rezultate detaliate pentru fiecare test ANAF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationReport.results.map((result) => (
                  <div
                    key={result.testNumber}
                    className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Test {result.testNumber}</span>
                            {getStatusBadge(result.status)}
                          </div>
                          <h4 className="font-medium mb-1">{result.testName}</h4>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.details && (
                            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                              {result.details}
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
        )}

        <Card>
          <CardHeader>
            <CardTitle>Documente ANAF</CardTitle>
            <CardDescription>
              Documentele oficiale ANAF utilizate pentru validare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                Această pagină implementează testele din comunicatele oficiale ANAF:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Seria I: 22 teste de consistență (Comunicat 09.03.2023)</li>
                  <li>Seria II: 11 teste aditionale pentru General Ledger Entries</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SaftValidator;