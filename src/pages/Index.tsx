import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Clock,
  Download,
  BarChart3,
  Sparkles,
  Receipt,
  BookOpen,
  Landmark,
  Menu
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }
        
        if (session) {
          // User is logged in, get their role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleError) {
            console.error('Role error:', roleError);
            // If there's an error getting the role, default to dashboard
            navigate('/dashboard');
            return;
          }

          if (roleData?.role === 'accountant') {
            navigate('/accountant-dashboard');
          } else {
            navigate('/dashboard');
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SmartInvoice</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/about">
              <Button variant="ghost">Despre noi</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost">Prețuri</Button>
            </Link>
            <Link to="/blog">
              <Button variant="ghost">Blog</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="ghost">Autentificare</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="group">
                Începe gratuit
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/about">
                    <Button variant="ghost" className="w-full justify-start">Despre noi</Button>
                  </Link>
                  <Link to="/pricing">
                    <Button variant="ghost" className="w-full justify-start">Prețuri</Button>
                  </Link>
                  <Link to="/blog">
                    <Button variant="ghost" className="w-full justify-start">Blog</Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="ghost" className="w-full justify-start">Contact</Button>
                  </Link>
                  <Link to="/auth?mode=login">
                    <Button variant="outline" className="w-full">Autentificare</Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button className="w-full">Începe gratuit</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              Soluție completă pentru afaceri românești
            </Badge>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
              Facturare inteligentă<br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                pentru România
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Automatizează facturarea, generează eFactura pentru ANAF și controlează cash-flow-ul 
              afacerii tale. Totul într-o singură platformă modernă.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="text-lg px-8 h-14 group shadow-lg hover:shadow-xl transition-all">
                  Începe acum - gratuit
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14"
                onClick={() => setDemoDialogOpen(true)}
              >
                <Download className="mr-2 h-5 w-5" />
                Vezi demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Conformitate ANAF</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Date securizate</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Setup instant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 animate-fade-in">
            <Badge variant="outline" className="mb-2">Funcționalități</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Tot ce ai nevoie pentru<br />facturare profesională
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Soluție completă adaptată pentru nevoile afacerilor românești
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Facturare rapidă",
                description: "Creează facturi profesionale în secunde. Export automat XML pentru eFactura ANAF.",
                color: "from-blue-500 to-cyan-500",
                delay: "0"
              },
              {
                icon: TrendingUp,
                title: "Urmărire cash-flow",
                description: "Dashboard în timp real cu previziuni financiare și analize detaliate.",
                color: "from-purple-500 to-pink-500",
                delay: "100"
              },
              {
                icon: Users,
                title: "Colaborare contabil",
                description: "Invită-ți contabilul pentru acces direct la date. Fără Excel, fără email-uri.",
                color: "from-orange-500 to-red-500",
                delay: "200"
              },
              {
                icon: BarChart3,
                title: "Rapoarte SAF-T",
                description: "Generare automată lunară SAF-T (D406) pentru conformitate ANAF.",
                color: "from-green-500 to-emerald-500",
                delay: "300"
              },
              {
                icon: Clock,
                title: "Economisește timp",
                description: "Automatizează procesele repetitive și concentrează-te pe afacere.",
                color: "from-indigo-500 to-blue-500",
                delay: "400"
              },
              {
                icon: Shield,
                title: "Securitate maximă",
                description: "Date criptate, backup automat și conformitate GDPR garantată.",
                color: "from-rose-500 to-pink-500",
                delay: "500"
              }
            ].map((feature, idx) => (
              <Card 
                key={idx} 
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/10" />
            <CardContent className="p-12 md:p-16 relative">
              <div className="grid md:grid-cols-3 gap-12 text-center">
                {[
                  { value: "10,000+", label: "Facturi generate" },
                  { value: "500+", label: "Companii active" },
                  { value: "99.9%", label: "Uptime garantat" }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-5xl md:text-6xl font-bold">{stat.value}</div>
                    <div className="text-lg opacity-90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold">
            Gata să simplifici<br />facturarea?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Alătură-te miilor de PFA-uri și micro-SRL-uri care și-au simplificat procesul de facturare și conformitate fiscală.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="text-lg px-8 h-14 group shadow-lg">
                Începe acum - gratuit
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">SmartInvoice</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Soluție modernă de facturare pentru afaceri românești
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produs</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Funcționalități</a></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Prețuri</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Companie</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">Despre noi</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Termeni și condiții</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Confidențialitate</Link></li>
                <li><Link to="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 SmartInvoice Romania. Creat cu ❤️ pentru afaceri românești.</p>
          </div>
        </div>
      </footer>

      {/* Demo Dialog */}
      <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">SmartInvoice - Demo Platformă</DialogTitle>
            <DialogDescription>
              Explorează funcționalitățile complete ale platformei noastre de facturare
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Dashboard Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Dashboard Inteligent</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Vizualizează în timp real toate informațiile importante despre afacerea ta: 
                      venituri, cheltuieli, facturi în așteptare și grafice de analiză.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Grafice interactive cu venituri și cheltuieli</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Monitorizare cash-flow în timp real</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Statistici rapide și alerte importante</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoicing */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Facturare Profesională</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Creează și gestionează facturi profesionale în câteva secunde. Export automat XML pentru eFactura ANAF.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Creare rapidă de facturi cu template-uri profesionale</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Generare automată eFactura XML pentru ANAF</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Import facturi din imagine cu OCR AI</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Gestionare clienți și istoric facturi</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Management */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Receipt className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Gestionare Cheltuieli</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Scanează bonuri fiscale și digitalizează automat cheltuielile folosind tehnologie OCR AI.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Scanare automată bonuri cu AI (OCR)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Categorizare automată cheltuieli</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Calcul automat TVA deductibil</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Export rapoarte cheltuieli</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SAF-T Reports */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Rapoarte SAF-T (D406)</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generare automată lunară SAF-T XML pentru declarația D406 la ANAF. Conformitate totală cu legislația română.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Generare automată SAF-T XML (D406)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Programare automată lunară</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Validare date înainte de export</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Istoric complet rapoarte</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accountant Collaboration */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Colaborare cu Contabilul</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Invită-ți contabilul să acceseze direct datele financiare. Fără email-uri, fără Excel-uri.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Acces securizat pentru contabil</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Descărcare facturi, cheltuieli și rapoarte</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Generare documente ANAF (eFactura, SAF-T)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Gestionare multiple companii</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart of Accounts */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Plan de Conturi</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Plan de conturi pre-configurat conform standardelor românești de contabilitate.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Conturi standard românești pre-populate</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Adaugă și personalizează conturi</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Conformitate ANAF garantată</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Statements */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-500/10 rounded-lg">
                    <Landmark className="h-6 w-6 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Extrase Bancare</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Încarcă și gestionează extrasele bancare pentru reconciliere completă.
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Upload securizat documente bancare</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Acces partajat cu contabilul</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Organizare cronologică</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-8 text-center text-primary-foreground">
              <h3 className="text-2xl font-bold mb-3">Gata să începi?</h3>
              <p className="mb-6 opacity-90">
                Creează contul gratuit și automatizează complet procesul de facturare
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Începe acum - gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;