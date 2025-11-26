import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
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
              <CardTitle className="text-4xl">Politica de Confidențialitate</CardTitle>
              <p className="text-muted-foreground mt-2">
                Ultima actualizare: 26 noiembrie 2025
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 not-prose">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Shield className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold text-sm">Protecție Maximă</h3>
                  <p className="text-xs text-muted-foreground">Datele tale sunt criptate și securizate</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Lock className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="font-semibold text-sm">Confidențialitate</h3>
                  <p className="text-xs text-muted-foreground">Nu vindem datele tale terților</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Eye className="h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold text-sm">Transparență</h3>
                  <p className="text-xs text-muted-foreground">Control complet asupra datelor tale</p>
                </div>
              </div>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Introducere</h2>
                <p>
                  Bine ați venit la SmartInvoice! Protecția datelor dumneavoastră personale este o prioritate fundamentală pentru noi. Această politică de confidențialitate explică ce date colectăm, cum le folosim, cum le protejăm și care sunt drepturile dumneavoastră conform GDPR și legislației române privind protecția datelor.
                </p>
                <p>
                  SmartInvoice respectă pe deplin Regulamentul General privind Protecția Datelor (GDPR - Regulamentul UE 2016/679) și Legea nr. 190/2018 privind măsuri de punere în aplicare a GDPR.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">2. Operatorul de Date</h2>
                <p>
                  Operatorul de date cu caracter personal este SmartInvoice:
                </p>
                <ul className="list-none space-y-2 bg-muted p-4 rounded-lg">
                  <li><strong>Denumire:</strong> SmartInvoice SRL</li>
                  <li><strong>Sediu:</strong> București, România</li>
                  <li><strong>Email contact:</strong> privacy@smartinvoice.ro</li>
                  <li><strong>DPO (Data Protection Officer):</strong> dpo@smartinvoice.ro</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">3. Ce Date Colectăm</h2>
                
                <h3 className="text-xl font-semibold mt-4">3.1 Date de Identificare</h3>
                <p>La crearea contului colectăm:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nume și prenume (sau denumire firmă)</li>
                  <li>Adresa de email</li>
                  <li>Număr de telefon (opțional)</li>
                  <li>Parolă (criptată)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">3.2 Date Privind Compania</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Denumirea companiei</li>
                  <li>CUI/CIF</li>
                  <li>Număr de înregistrare la Registrul Comerțului (Reg. Com.)</li>
                  <li>Adresa sediului social</li>
                  <li>Cont IBAN</li>
                  <li>Date de contact (telefon, email companie)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">3.3 Date Financiare și Tranzacționale</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Facturi emise și primite</li>
                  <li>Cheltuieli și bonuri fiscale</li>
                  <li>Extrase bancare (dacă sunt încărcate)</li>
                  <li>Date despre clienți și furnizori</li>
                  <li>Rapoarte SAF-T și alte documente fiscale</li>
                  <li>Plan de conturi</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">3.4 Date Tehnice și de Utilizare</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Adresa IP</li>
                  <li>Tip de browser și versiune</li>
                  <li>Sistem de operare</li>
                  <li>Data și ora accesului</li>
                  <li>Pagini vizitate și acțiuni efectuate</li>
                  <li>Cookie-uri și identificatori unici</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">3.5 Date de la Terți</h3>
                <p>
                  Dacă alegeți să vă autentificați prin Google sau alți furnizori, vom primi datele de bază de la aceștia (nume, email, fotografie de profil) conform permisiunilor pe care le acordați.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">4. Cum Folosim Datele</h2>
                <p>Utilizăm datele colectate pentru următoarele scopuri legitime:</p>
                
                <h3 className="text-xl font-semibold mt-4">4.1 Furnizarea Serviciului</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Crearea și gestionarea contului dumneavoastră</li>
                  <li>Procesarea și stocarea facturilor, cheltuielilor și documentelor</li>
                  <li>Generarea rapoartelor SAF-T și eFactura pentru ANAF</li>
                  <li>Facilitarea colaborării cu contabilul</li>
                  <li>Oferirea funcționalităților platformei (dashboard, analize, etc.)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">4.2 Comunicare și Suport</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Trimiterea de notificări importante despre cont</li>
                  <li>Răspunsuri la întrebări și solicitări de suport</li>
                  <li>Informări despre actualizări ale serviciului</li>
                  <li>Comunicări administrative și legale</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">4.3 Îmbunătățirea Serviciului</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Analiză a modului de utilizare a platformei</li>
                  <li>Identificarea și rezolvarea problemelor tehnice</li>
                  <li>Dezvoltarea de noi funcționalități</li>
                  <li>Optimizarea performanței și experienței utilizatorului</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">4.4 Securitate și Prevenirea Fraudelor</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Detectarea și prevenirea activităților frauduloase</li>
                  <li>Protecția împotriva accesului neautorizat</li>
                  <li>Asigurarea securității datelor și infrastructurii</li>
                  <li>Respectarea obligațiilor legale</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">4.5 Conformitate Legală</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respectarea obligațiilor fiscale și contabile</li>
                  <li>Răspunsuri la solicitări ale autorităților competente</li>
                  <li>Arhivarea documentelor conform legislației</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">5. Baza Legală a Prelucrării</h2>
                <p>Prelucrăm datele dumneavoastră pe baza următoarelor temeiuri legale:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consimțământ:</strong> prin crearea contului și acceptarea termenilor</li>
                  <li><strong>Contract:</strong> pentru furnizarea serviciilor solicitate</li>
                  <li><strong>Obligație legală:</strong> pentru conformitatea fiscală și contabilă</li>
                  <li><strong>Interes legitim:</strong> pentru îmbunătățirea serviciului și securitate</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">6. Partajarea Datelor</h2>
                <p>
                  <strong>Nu vindem datele dumneavoastră.</strong> Partajăm datele doar în următoarele situații limitate:
                </p>

                <h3 className="text-xl font-semibold mt-4">6.1 Furnizori de Servicii</h3>
                <p>Colaborăm cu furnizori de încredere pentru:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Hosting și stocare:</strong> Supabase (infrastructură securizată în UE)</li>
                  <li><strong>Servicii AI:</strong> pentru funcționalitatea OCR (date anonimizate când e posibil)</li>
                  <li><strong>Procesare plăți:</strong> procesatori de plăți certificați PCI DSS</li>
                  <li><strong>Email:</strong> furnizori de servicii email pentru notificări</li>
                </ul>
                <p>
                  Toți furnizorii sunt obligați contractual să protejeze datele conform GDPR.
                </p>

                <h3 className="text-xl font-semibold mt-4">6.2 Contabili și Colaboratori Autorizați</h3>
                <p>
                  Dacă invitați un contabil sau alt colaborator să acceseze datele companiei dumneavoastră, acesta va avea acces la informațiile relevante necesare pentru serviciile sale.
                </p>

                <h3 className="text-xl font-semibold mt-4">6.3 Obligații Legale</h3>
                <p>
                  Putem divulga date autorităților competente (ANAF, instanțe, poliție) când suntem obligați legal sau când este necesar pentru protecția drepturilor noastre.
                </p>

                <h3 className="text-xl font-semibold mt-4">6.4 Transfer Internațional</h3>
                <p>
                  Datele sunt stocate prioritar în Uniunea Europeană. Dacă este necesar transfer în afara UE, ne asigurăm că există garanții adecvate (clauze contractuale standard, Privacy Shield, etc.).
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">7. Securitatea Datelor</h2>
                <p>
                  Implementăm măsuri tehnice și organizatorice pentru protejarea datelor:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Criptare:</strong> datele sunt criptate în tranzit (HTTPS/TLS) și în repaus (AES-256)</li>
                  <li><strong>Autentificare:</strong> parole criptate, autentificare multi-factor disponibilă</li>
                  <li><strong>Control acces:</strong> acces restricționat doar pentru personalul autorizat</li>
                  <li><strong>Monitorizare:</strong> monitorizare continuă pentru detectarea incidentelor</li>
                  <li><strong>Backup-uri:</strong> backup-uri regulate și securizate</li>
                  <li><strong>Teste de securitate:</strong> audituri și teste de penetrare periodice</li>
                  <li><strong>Politici interne:</strong> proceduri stricte de securitate pentru echipă</li>
                </ul>
                <p>
                  Deși implementăm cele mai bune practici de securitate, nicio metodă de transmitere sau stocare electronică nu este 100% sigură. Vă recomandăm să folosiți o parolă puternică și să nu o partajați.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">8. Retenția Datelor</h2>
                <p>
                  Păstrăm datele dumneavoastră atât timp cât:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Aveți un cont activ</li>
                  <li>Este necesar pentru furnizarea serviciilor</li>
                  <li>Există obligații legale de păstrare (ex: documente fiscale - 10 ani conform legii române)</li>
                  <li>Este necesar pentru rezolvarea disputelor sau aplicarea termenilor</li>
                </ul>
                <p>
                  După ștergerea contului, datele personale vor fi anonimizate sau șterse, cu excepția celor pentru care există obligație legală de păstrare.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">9. Drepturile Dumneavoastră GDPR</h2>
                <p>
                  Conform GDPR, aveți următoarele drepturi:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mt-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🔍 Dreptul de acces</h4>
                    <p className="text-sm text-muted-foreground">Să obțineți confirmare că procesăm datele dumneavoastră și copii ale acestora</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">✏️ Dreptul de rectificare</h4>
                    <p className="text-sm text-muted-foreground">Să corectați datele incorecte sau incomplete</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🗑️ Dreptul la ștergere</h4>
                    <p className="text-sm text-muted-foreground">Să solicitați ștergerea datelor ("dreptul de a fi uitat")</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">⏸️ Dreptul la restricționare</h4>
                    <p className="text-sm text-muted-foreground">Să restricționați temporar prelucrarea datelor</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">📦 Dreptul la portabilitate</h4>
                    <p className="text-sm text-muted-foreground">Să primiți datele într-un format structurat și să le transferați</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🚫 Dreptul de opoziție</h4>
                    <p className="text-sm text-muted-foreground">Să vă opuneți prelucrării în anumite scopuri</p>
                  </div>
                </div>

                <p className="mt-4">
                  Pentru exercitarea drepturilor, contactați-ne la <strong>privacy@smartinvoice.ro</strong>. Veți primi un răspuns în maxim 30 de zile.
                </p>
                <p>
                  De asemenea, aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) dacă considerați că drepturile dumneavoastră au fost încălcate.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">10. Cookie-uri</h2>
                <p>
                  Folosim cookie-uri și tehnologii similare pentru:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Esențiale:</strong> necesare pentru funcționarea platformei (ex: autentificare, preferințe)</li>
                  <li><strong>Funcționale:</strong> pentru a vă aminti preferințele (ex: limba)</li>
                  <li><strong>Analiză:</strong> pentru a înțelege cum utilizați platforma (anonimizat)</li>
                </ul>
                <p>
                  Puteți gestiona preferințele pentru cookie-uri în setările browserului. Blocarea cookie-urilor esențiale poate afecta funcționarea platformei.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">11. Minori</h2>
                <p>
                  Serviciul nostru nu este destinat persoanelor sub 18 ani. Nu colectăm în mod intenționat date de la minori. Dacă descoperim astfel de date, le vom șterge imediat.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">12. Modificări ale Politicii</h2>
                <p>
                  Putem actualiza această politică periodic pentru a reflecta schimbări în practici sau legislație. Modificările importante vor fi comunicate prin email sau notificare în platformă. Data ultimei actualizări este indicată în partea de sus a documentului.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">13. Contact</h2>
                <p>
                  Pentru întrebări despre această politică sau exercitarea drepturilor dumneavoastră:
                </p>
                <ul className="list-none space-y-2 bg-muted p-4 rounded-lg">
                  <li><strong>Email privind confidențialitatea:</strong> privacy@smartinvoice.ro</li>
                  <li><strong>DPO (Data Protection Officer):</strong> dpo@smartinvoice.ro</li>
                  <li><strong>Adresă:</strong> București, România</li>
                </ul>
              </section>

              <div className="mt-12 p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
                <div className="flex items-start gap-4">
                  <Database className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Angajamentul Nostru</h3>
                    <p className="text-sm">
                      Ne angajăm să protejăm confidențialitatea și securitatea datelor dumneavoastră. Transparența și respectarea drepturilor dumneavoastră sunt fundamentale pentru noi. Dacă aveți orice întrebare sau preocupare, nu ezitați să ne contactați.
                    </p>
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

export default Privacy;
