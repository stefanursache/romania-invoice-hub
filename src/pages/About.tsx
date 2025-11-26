import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Heart
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <Badge variant="secondary" className="mb-4 gap-2">
              <Sparkles className="h-3 w-3" />
              Despre SmartInvoice Romania
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Simplificăm contabilitatea pentru afacerea ta
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Platforma românească de facturare și contabilitate care îți economisește timp și 
              te ajută să te concentrezi pe ceea ce contează cu adevărat - dezvoltarea afacerii tale.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2">
                  Începe gratuit
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Contactează-ne
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Misiunea noastră</h2>
            <p className="text-lg text-muted-foreground">
              Creăm instrumente simple și eficiente care permit antreprenorilor români să gestioneze 
              financiar și contabil afacerea lor fără complicații.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Simplu & Intuitiv</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface ușor de utilizat, fără curbe de învățare complexe. Începi să lucrezi în câteva minute.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Rapid & Eficient</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatizează procesele repetitive și economisește ore întregi din fiecare lună.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Sigur & Conform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  100% conform legislației românești. Datele tale sunt protejate și criptate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Valorile noastre</h2>
            <p className="text-lg text-muted-foreground">
              Principiile care ne ghidează în tot ceea ce facem
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Inovație continuă</h3>
                  <p className="text-muted-foreground">
                    Îmbunătățim constant platforma pentru a oferi cele mai moderne funcționalități.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Clienții primii</h3>
                  <p className="text-muted-foreground">
                    Feedback-ul tău contează. Construim funcționalități bazate pe nevoile reale.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Eficiență maximă</h3>
                  <p className="text-muted-foreground">
                    Timpul tău este prețios. Automatizăm tot ce se poate automatiza.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Suport dedicat</h3>
                  <p className="text-muted-foreground">
                    Echipa noastră este mereu disponibilă să te ajute să reușești.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">De ce SmartInvoice?</h2>
            <p className="text-lg text-muted-foreground">
              Funcționalități create special pentru piața românească
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              "Facturi și proforma conform legislației românești",
              "Export SAF-T pentru ANAF",
              "Gestionare clienți și furnizori",
              "Rapoarte financiare detaliate",
              "Colaborare cu contabilul tău",
              "Plan de conturi românesc pre-configurat",
              "Suport pentru mai multe monede (RON, EUR, USD)",
              "Backup automat și securitate maximă"
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="font-medium">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Gata să simplifici contabilitatea?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Alătură-te celor care și-au simplificat deja procesele financiare cu SmartInvoice
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Începe gratuit acum
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Programează o demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
