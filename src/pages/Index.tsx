import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, FileText, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Soluție pentru PFA și micro-SRL
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Facturare inteligentă
            </span>
            <br />
            pentru afaceri românești
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Automatizează facturarea, generează eFactura pentru ANAF, și controlează cash-flow-ul 
            afacerii tale într-o singură platformă.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Începe gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Autentificare
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tot ce ai nevoie pentru facturare
          </h2>
          <p className="text-xl text-muted-foreground">
            Simplu, rapid, și adaptat pentru România
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Facturare rapidă</h3>
            <p className="text-muted-foreground">
              Creează facturi profesionale în câteva secunde. Generează automat XML pentru eFactura ANAF.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Urmărire cash-flow</h3>
            <p className="text-muted-foreground">
              Monitorizează încasările și previzionează intrările de bani. Rămâi mereu la curent cu situația financiară.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Colaborare contabil</h3>
            <p className="text-muted-foreground">
              Invită-ți contabilul să acceseze datele direct din platformă. Fără Excel, fără email-uri.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Gata să simplifici facturarea?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Alătură-te miilor de PFA-uri și micro-SRL-uri care și-au simplificat deja procesul de facturare.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Începe acum - gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SmartInvoice Romania. Creat pentru afaceri românești.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;