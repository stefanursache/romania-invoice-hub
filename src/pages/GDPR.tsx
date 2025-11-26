import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Shield, Download, Mail, Trash2, Edit, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const GDPR = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SmartInvoice</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la pagina principală
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">Conformitate GDPR</CardTitle>
              <p className="text-muted-foreground mt-2">
                Cum respectăm Regulamentul General privind Protecția Datelor
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Ce este GDPR?</h2>
                <p>
                  Regulamentul General privind Protecția Datelor (GDPR - General Data Protection Regulation) este legislația Uniunii Europene care stabilește regulile privind protecția datelor personale ale cetățenilor UE. Acesta a intrat în vigoare pe 25 mai 2018 și se aplică tuturor companiilor care prelucrează date ale cetățenilor europeni, indiferent unde sunt localizate.
                </p>
                <p>
                  SmartInvoice este pe deplin conformă cu GDPR și implementează toate măsurile necesare pentru protecția datelor dumneavoastră.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Principiile GDPR pe care le Respectăm</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Legalitate și Transparență
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Prelucrăm datele legal, corect și transparent. Vă informăm clar ce date colectăm și de ce.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Limitarea Scopului
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Colectăm date doar pentru scopuri specifice, explicite și legitime.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Minimizarea Datelor
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Colectăm doar datele strict necesare pentru furnizarea serviciilor.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Acuratețe
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Menținem datele actualizate și oferim instrumente pentru corectarea lor.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Limitarea Stocării
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Păstrăm datele doar cât timp este necesar pentru scopurile legitime.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Integritate și Confidențialitate
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Implementăm măsuri tehnice și organizatorice pentru securitatea datelor.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Drepturile Dumneavoastră GDPR</h2>
                <p>
                  Conform GDPR, beneficiați de următoarele drepturi fundamentale privind datele dumneavoastră personale:
                </p>

                <div className="space-y-6 not-prose">
                  <div className="p-6 border-l-4 border-primary bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">1. Dreptul de Acces</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Aveți dreptul să obțineți confirmare că prelucrăm datele dumneavoastră și să primiți o copie a acestora.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Accesați Setări → Descarcă Datele Mele sau contactați-ne la privacy@smartinvoice.ro
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-blue-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Edit className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">2. Dreptul de Rectificare</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Puteți corecta orice date personale incorecte sau incomplete.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Accesați Setări → Profil pentru a actualiza datele sau contactați suportul
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-red-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Trash2 className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">3. Dreptul la Ștergere ("Dreptul de a fi Uitat")</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Puteți solicita ștergerea datelor dumneavoastră în anumite condiții.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Accesați Setări → Șterge Contul sau trimiteți cerere la privacy@smartinvoice.ro
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Notă: Anumite date pot fi păstrate pentru obligații legale (ex: documente fiscale - 10 ani)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-yellow-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Lock className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">4. Dreptul la Restricționarea Prelucrării</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Puteți solicita suspendarea temporară a prelucrării datelor în anumite situații.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Contactați privacy@smartinvoice.ro cu justificarea
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-green-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Download className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">5. Dreptul la Portabilitatea Datelor</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Aveți dreptul să primiți datele într-un format structurat și să le transferați altui operator.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Utilizați funcția de export (CSV, JSON) sau contactați-ne pentru formate specifice
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-purple-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Shield className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">6. Dreptul de Opoziție</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Puteți să vă opuneți prelucrării datelor pentru marketing direct sau alte scopuri specifice.
                        </p>
                        <p className="text-sm font-medium">
                          Cum exercitați: Gestionați preferințele de comunicare în Setări sau dezabonați-vă din emailuri
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l-4 border-orange-500 bg-muted/50">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">7. Dreptul de a Depune Plângere</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Aveți dreptul să depuneți o plângere la autoritatea de supraveghere dacă considerați că drepturile dumneavoastră au fost încălcate.
                        </p>
                        <div className="text-sm space-y-1 bg-background p-3 rounded mt-2">
                          <p className="font-medium">Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</p>
                          <p>B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București</p>
                          <p>Tel: +40.318.059.211 | Email: anspdcp@dataprotection.ro</p>
                          <p>Website: www.dataprotection.ro</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Cum Protejăm Datele Dumneavoastră</h2>
                <p>
                  Implementăm măsuri tehnice și organizatorice avansate pentru a proteja datele împotriva accesului neautorizat, pierderii sau distrugerii:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h3 className="font-semibold mb-2">🔐 Criptare</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• HTTPS/TLS pentru toate conexiunile</li>
                      <li>• AES-256 pentru date în repaus</li>
                      <li>• Parole criptate cu bcrypt</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h3 className="font-semibold mb-2">👤 Control Acces</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Autentificare multi-factor (MFA)</li>
                      <li>• Principle of least privilege</li>
                      <li>• Acces bazat pe roluri (RBAC)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h3 className="font-semibold mb-2">📊 Monitorizare</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Logging și audit trails</li>
                      <li>• Detectare intruziuni (IDS)</li>
                      <li>• Alerte în timp real</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <h3 className="font-semibold mb-2">💾 Backup & Recovery</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Backup-uri automate zilnice</li>
                      <li>• Redundanță geografică</li>
                      <li>• Plan de disaster recovery</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Data Protection Officer (DPO)</h2>
                <p>
                  Am desemnat un Data Protection Officer (Responsabil cu Protecția Datelor) care supervizează conformitatea GDPR și răspunde la întrebările dumneavoastră:
                </p>
                <div className="bg-muted p-6 rounded-lg not-prose">
                  <p className="font-semibold mb-2">Contact DPO:</p>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Email:</strong> dpo@smartinvoice.ro</li>
                    <li><strong>Subiect:</strong> Menționați "GDPR" în subiect pentru prioritizare</li>
                    <li><strong>Timp de răspuns:</strong> Maximum 30 de zile (conform GDPR)</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Încălcări de Date (Data Breach)</h2>
                <p>
                  În cazul improbabil al unei încălcări de securitate care ar putea afecta datele dumneavoastră personale:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Vom notifica ANSPDCP în termen de 72 de ore de la descoperire</li>
                  <li>Vă vom informa direct dacă încălcarea prezintă un risc ridicat pentru drepturile dumneavoastră</li>
                  <li>Vom lua măsuri imediate pentru limitarea impactului</li>
                  <li>Vom implementa măsuri suplimentare pentru prevenirea incidentelor similare</li>
                </ol>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Transferuri Internaționale de Date</h2>
                <p>
                  Datele sunt stocate prioritar în Uniunea Europeană. Dacă este necesar transfer în afara UE/SEE, ne asigurăm că există garanții adecvate:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Clauze contractuale standard aprobate de Comisia Europeană</li>
                  <li>Certificări de adecvare (ex: EU-US Data Privacy Framework)</li>
                  <li>Reguli corporative obligatorii pentru grupuri de companii</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Exercitarea Drepturilor - Proces Simplificat</h2>
                <p>
                  Pentru a vă exercita drepturile GDPR:
                </p>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Trimiteți o cerere:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Email: privacy@smartinvoice.ro sau dpo@smartinvoice.ro</li>
                      <li>Subiect: "Cerere GDPR - [Tipul dreptului]"</li>
                      <li>Includeți: Nume, email asociat contului, descrierea cererii</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Verificare identitate:</strong> Pentru securitatea dumneavoastră, poate fi necesar să vă verificăm identitatea
                  </li>
                  <li>
                    <strong>Procesare:</strong> Analizăm cererea și pregătim răspunsul
                  </li>
                  <li>
                    <strong>Răspuns:</strong> Primiți răspunsul în maximum 30 de zile (extensie posibilă până la 60 de zile pentru cereri complexe)
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Important:</strong> Exercitarea drepturilor GDPR este gratuită. Nu percepem taxe, cu excepția situațiilor în care cererile sunt vădit nefondate sau excesive.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">Întrebări Frecvente (FAQ)</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Cât durează să primesc datele mele?</h3>
                    <p className="text-sm text-muted-foreground">
                      De obicei, în 3-5 zile lucrătoare. Termenul legal maxim este 30 de zile.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Pot șterge doar o parte din datele mele?</h3>
                    <p className="text-sm text-muted-foreground">
                      Da, puteți solicita ștergerea selectivă, cu excepția datelor necesare pentru obligații legale sau contractuale.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Ce se întâmplă cu datele după ce îmi șterg contul?</h3>
                    <p className="text-sm text-muted-foreground">
                      Datele personale sunt șterse/anonimizate în 30 de zile. Documentele fiscale sunt păstrate 10 ani conform legislației române.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Cum știu că datele mele sunt în siguranță?</h3>
                    <p className="text-sm text-muted-foreground">
                      Folosim criptare de nivel bancar, audituri regulate de securitate și respectăm cele mai bune practici din industrie.
                    </p>
                  </div>
                </div>
              </section>

              <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                <div className="text-center space-y-4">
                  <Shield className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold">Angajamentul Nostru GDPR</h3>
                  <p className="max-w-2xl mx-auto">
                    SmartInvoice tratează protecția datelor dumneavoastră cu cea mai mare seriozitate. Conformitatea GDPR nu este doar o obligație legală pentru noi, ci un angajament fundamental față de utilizatorii noștri. Transparența, securitatea și respectarea drepturilor dumneavoastră sunt prioritățile noastre principale.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link to="/privacy">
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Politica de Confidențialitate
                      </Button>
                    </Link>
                    <a href="mailto:privacy@smartinvoice.ro">
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Contactează DPO
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GDPR;
