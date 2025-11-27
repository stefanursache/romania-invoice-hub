import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, Rocket, Crown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      icon: Building2,
      description: "Perfect pentru mici afaceri și PFA-uri",
      monthlyPrice: 15,
      annualPrice: 150,
      teamMembers: 3,
      badge: "3 luni gratuit",
      features: [
        { text: "Până la 3 membri în echipă", included: true },
        { text: "50 facturi/lună", included: true },
        { text: "Gestionare clienți nelimitați", included: true },
        { text: "Generare PDF + XML", included: true },
        { text: "e-Factura (ANAF) inclusă", included: true },
        { text: "SAF-T (D406) automat", included: true },
        { text: "Rapoarte de bază", included: true },
        { text: "Suport email", included: true },
      ],
      cta: "Începe gratuit",
      popular: false,
    },
    {
      name: "Professional",
      icon: Rocket,
      description: "Pentru afaceri în creștere cu echipe mari",
      monthlyPrice: 35,
      annualPrice: 299,
      teamMembers: 10,
      badge: "Recomandat",
      features: [
        { text: "Până la 10 membri în echipă", included: true },
        { text: "Facturi nelimitate", included: true },
        { text: "Tot din Starter +", included: true },
        { text: "Gestiune stocuri avansată", included: true },
        { text: "Rapoarte avansate", included: true },
        { text: "API acces complet", included: true },
        { text: "Multi-locație", included: true },
        { text: "Backup automat zilnic", included: true },
        { text: "Suport prioritar", included: true },
      ],
      cta: "Alege Professional",
      popular: true,
    },
    {
      name: "Enterprise",
      icon: Crown,
      description: "Pentru corporații cu echipe extinse",
      monthlyPrice: null,
      annualPrice: null,
      teamMembers: null,
      badge: "Personalizat",
      features: [
        { text: "Membri nelimitați în echipă", included: true },
        { text: "Facturi nelimitate", included: true },
        { text: "Tot din Professional +", included: true },
        { text: "White-label branding", included: true },
        { text: "Integrări personalizate", included: true },
        { text: "Manager de cont dedicat", included: true },
        { text: "Training pe loc", included: true },
        { text: "SLA garantat 99.9%", included: true },
        { text: "Suport dedicat 24/7", included: true },
      ],
      cta: "Contactează vânzări",
      popular: false,
    },
  ];

  const calculatePrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return "Personalizat";
    
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    const period = isAnnual ? "an" : "lună";
    const savings = isAnnual && plan.monthlyPrice > 0 
      ? Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100)
      : 0;

    return (
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-lg text-muted-foreground">RON</span>
        </div>
        <div className="text-sm text-muted-foreground">
          per {period}
          {savings > 0 && (
            <Badge variant="secondary" className="ml-2">
              Economisești {savings}%
            </Badge>
          )}
        </div>
        {plan.name === "Starter" && (
          <div className="text-xs font-semibold text-primary mt-1">
            Primele 3 luni gratuit
          </div>
        )}
        {isAnnual && plan.monthlyPrice > 0 && (
          <div className="text-xs text-muted-foreground">
            ({Math.round(price / 12)} RON/lună)
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              SmartInvoice
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost">Autentificare</Button>
              </Link>
              <Link to="/auth">
                <Button>Încearcă gratuit</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="mb-4" variant="secondary">
            Prețuri competitive pentru România
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight">
            Planuri simple și transparente
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Alege planul potrivit pentru afacerea ta. Toate planurile includ acces la e-Factura și SAF-T.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Label htmlFor="billing-toggle" className={!isAnnual ? "font-bold" : ""}>
              Lunar
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? "font-bold" : ""}>
              Anual
              <Badge variant="default" className="ml-2">
                Economisești până la 17%
              </Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                className={`relative flex flex-col ${
                  plan.popular
                    ? "border-primary shadow-lg scale-105 z-10"
                    : "border-border"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {plan.badge}
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-6 w-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="min-h-[48px]">{plan.description}</CardDescription>
                  
                  {/* Team Members Badge */}
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {plan.teamMembers 
                        ? `${plan.teamMembers} ${plan.teamMembers === 1 ? 'membru' : 'membri'} în echipă` 
                        : 'Membri nelimitați'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">{calculatePrice(plan)}</div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link to="/auth" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Comparison with Competitors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            De ce SmartInvoice?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Preț competitiv</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Începând de la doar 15 RON/lună după perioada de probă gratuită, oferim mai multe funcționalități decât competitorii care taxează 65+ RON/lună.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Mai ieftin cu 75% vs SmartBill
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    3 luni gratuit pentru Starter
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Totul inclus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  e-Factura, SAF-T, rapoarte avansate - toate incluse în plan, fără costuri suplimentare.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    e-Factura ANAF gratuit
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    SAF-T (D406) automat
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Suport local</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Echipă românească dedicată care înțelege perfect legislația și nevoile locale.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Suport în limba română
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Actualizări legislative instant
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Întrebări frecvente
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pot schimba planul oricând?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Da, poți face upgrade sau downgrade oricând dorești. Diferența de preț va fi calculată proporțional.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Este inclus TVA în prețuri?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Prețurile afișate nu includ TVA (19%). Prețul final va fi preț + TVA conform legislației românești.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ce metode de plată acceptați?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acceptăm carduri bancare (Visa, Mastercard), transfer bancar și plată prin factura proformă.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Există reduceri pentru start-up-uri?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Da! Companiile în primul an de funcționare beneficiază de 50% reducere pentru primele 12 luni.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center mt-16 py-16 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Gata să începi?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Încearcă SmartInvoice gratuit timp de 3 luni cu planul Starter. Fără card, fără obligații.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Începe gratuit 3 luni
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contactează-ne
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 SmartInvoice. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
