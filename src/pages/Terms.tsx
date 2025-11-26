import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
              <CardTitle className="text-4xl">Termeni și Condiții</CardTitle>
              <p className="text-muted-foreground mt-2">
                Ultima actualizare: 26 noiembrie 2025
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Acceptarea Termenilor</h2>
                <p>
                  Bine ați venit la SmartInvoice! Prin accesarea și utilizarea platformei noastre, sunteți de acord să respectați și să fiți obligat de acești termeni și condiții de utilizare. Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați serviciul nostru.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">2. Definiții</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Serviciu"</strong> - platforma SmartInvoice, inclusiv toate funcționalitățile, instrumentele și resursele oferite</li>
                  <li><strong>"Utilizator"</strong> - orice persoană fizică sau juridică care creează un cont și folosește platforma</li>
                  <li><strong>"Cont"</strong> - contul unic creat de utilizator pentru accesarea serviciului</li>
                  <li><strong>"Conținut"</strong> - toate datele, informațiile, documentele și fișierele încărcate de utilizator</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">3. Crearea și Utilizarea Contului</h2>
                <h3 className="text-xl font-semibold mt-4">3.1 Înregistrare</h3>
                <p>
                  Pentru a utiliza SmartInvoice, trebuie să creați un cont furnizând informații exacte, complete și actualizate. Sunteți responsabil pentru menținerea confidențialității parolei contului dumneavoastră și pentru toate activitățile care au loc sub contul dumneavoastră.
                </p>
                
                <h3 className="text-xl font-semibold mt-4">3.2 Eligibilitate</h3>
                <p>
                  Pentru a crea un cont, trebuie să aveți cel puțin 18 ani și să aveți capacitate juridică deplină. Prin crearea unui cont, declarați că informațiile furnizate sunt corecte și că aveți dreptul legal de a utiliza serviciul.
                </p>

                <h3 className="text-xl font-semibold mt-4">3.3 Securitatea Contului</h3>
                <p>
                  Sunteți responsabil pentru:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Păstrarea confidențialității datelor de autentificare</li>
                  <li>Notificarea imediată a oricărei utilizări neautorizate a contului</li>
                  <li>Deconectarea de la cont la sfârșitul fiecărei sesiuni</li>
                  <li>Actualizarea periodică a parolei pentru securitate sporită</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">4. Utilizarea Serviciului</h2>
                <h3 className="text-xl font-semibold mt-4">4.1 Utilizare Permisă</h3>
                <p>
                  SmartInvoice este destinat utilizării legale pentru gestionarea facturilor, cheltuielilor și conformității fiscale pentru afaceri. Vă angajați să utilizați serviciul doar în scopuri legale și conforme cu legislația română.
                </p>

                <h3 className="text-xl font-semibold mt-4">4.2 Utilizare Interzisă</h3>
                <p>
                  Este strict interzis să:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Încărcați conținut ilegal, fraudulos sau înșelător</li>
                  <li>Folosiți serviciul pentru evaziune fiscală sau alte activități ilegale</li>
                  <li>Încercați să accesați neautorizat sisteme sau date ale altor utilizatori</li>
                  <li>Utilizați bot-uri, scripturi sau alte mijloace automate fără permisiune</li>
                  <li>Revindă sau transferă accesul la serviciu fără acordul nostru scris</li>
                  <li>Interferați cu funcționarea normală a platformei</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">5. Proprietate Intelectuală</h2>
                <p>
                  Toate drepturile de proprietate intelectuală asupra platformei SmartInvoice, inclusiv dar nelimitat la design, cod sursă, logo-uri, mărci comerciale și conținut, aparțin SmartInvoice sau licențiatorilor săi. Utilizarea serviciului nu vă conferă niciun drept de proprietate asupra acestora.
                </p>
                <p>
                  Păstrați toate drepturile asupra conținutului pe care îl încărcați pe platformă (facturi, documente, date). Prin utilizarea serviciului, ne acordați o licență limitată, non-exclusivă pentru a procesa și stoca acest conținut în scopul furnizării serviciului.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">6. Protecția Datelor</h2>
                <p>
                  Protecția datelor dumneavoastră personale este o prioritate pentru noi. Colectarea, prelucrarea și stocarea datelor se face în conformitate cu GDPR și legislația română privind protecția datelor. Pentru detalii complete, consultați <Link to="/privacy" className="text-primary hover:underline">Politica de Confidențialitate</Link>.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">7. Responsabilități și Limitări</h2>
                <h3 className="text-xl font-semibold mt-4">7.1 Răspunderea Utilizatorului</h3>
                <p>
                  Utilizatorul este singurul responsabil pentru:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acuratețea și legalitatea informațiilor introduse în platformă</li>
                  <li>Conformitatea cu legislația fiscală și contabilă română</li>
                  <li>Verificarea corectitudinii documentelor generate (facturi, SAF-T, etc.)</li>
                  <li>Depunerea la timp a declarațiilor fiscale la ANAF</li>
                  <li>Păstrarea backup-urilor propriilor date</li>
                </ul>

                <h3 className="text-xl font-semibold mt-4">7.2 Limitarea Răspunderii SmartInvoice</h3>
                <p>
                  SmartInvoice oferă instrumente și funcționalități pentru facilitarea gestionării financiare, dar:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nu furnizăm consultanță fiscală sau contabilă profesională</li>
                  <li>Nu garantăm conformitatea absolută cu toate reglementările ANAF (care se pot schimba)</li>
                  <li>Nu răspundem pentru pierderi financiare rezultate din erori ale utilizatorului</li>
                  <li>Nu garantăm funcționarea neîntreruptă a serviciului (deși depunem eforturi maxime)</li>
                  <li>Nu răspundem pentru pierderea de date cauzată de forță majoră</li>
                </ul>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">8. Prețuri și Plăți</h2>
                <p>
                  SmartInvoice oferă planuri de abonament cu funcționalități diferite. Prețurile sunt afișate în RON și nu includ TVA (dacă este cazul). Ne rezervăm dreptul de a modifica prețurile cu o notificare prealabilă de minimum 30 de zile.
                </p>
                <p>
                  Plățile se procesează prin parteneri de încredere. Abonamentele se reînnoiesc automat conform planului selectat. Puteți anula oricând, iar anularea va avea efect la sfârșitul perioadei de facturare curente.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">9. Suspendarea și Închiderea Contului</h2>
                <p>
                  Ne rezervăm dreptul de a suspenda sau închide contul dumneavoastră în următoarele situații:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Încălcarea acestor termeni și condiții</li>
                  <li>Utilizare frauduloasă sau ilegală a serviciului</li>
                  <li>Neplata abonamentului</li>
                  <li>Cerere din partea autorităților competente</li>
                  <li>Inactivitate prelungită (peste 12 luni)</li>
                </ul>
                <p>
                  Puteți solicita ștergerea contului oricând din secțiunea Setări. După ștergere, datele vor fi eliminate conform politicii de retenție a datelor.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">10. Modificări ale Termenilor</h2>
                <p>
                  Ne rezervăm dreptul de a modifica acești termeni și condiții în orice moment. Modificările substanțiale vor fi comunicate prin email sau prin notificare în platformă cu minimum 15 zile înainte de intrarea în vigoare.
                </p>
                <p>
                  Continuarea utilizării serviciului după modificări constituie acceptarea noilor termeni.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">11. Legea Aplicabilă și Jurisdicție</h2>
                <p>
                  Acești termeni și condiții sunt guvernați de legile României. Orice dispută va fi soluționată de instanțele competente din București, România.
                </p>
              </section>

              <section className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold">12. Contact</h2>
                <p>
                  Pentru întrebări sau nelămuriri legate de acești termeni și condiții, ne puteți contacta la:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> legal@smartinvoice.ro</li>
                  <li><strong>Adresă:</strong> București, România</li>
                </ul>
              </section>

              <div className="mt-12 p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Prin utilizarea SmartInvoice, confirmați că ați citit, înțeles și acceptat acești Termeni și Condiții în totalitate.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;
