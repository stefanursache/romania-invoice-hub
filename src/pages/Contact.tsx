import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Numele trebuie să aibă cel puțin 2 caractere" })
    .max(100, { message: "Numele este prea lung (max 100 caractere)" }),
  email: z.string()
    .trim()
    .email({ message: "Adresă de email invalidă" })
    .max(255, { message: "Email-ul este prea lung" }),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\+\-\(\)]+$/, { message: "Număr de telefon invalid" })
    .min(10, { message: "Numărul de telefon este prea scurt" })
    .max(20, { message: "Numărul de telefon este prea lung" })
    .optional()
    .or(z.literal("")),
  subject: z.string()
    .trim()
    .min(5, { message: "Subiectul trebuie să aibă cel puțin 5 caractere" })
    .max(200, { message: "Subiectul este prea lung (max 200 caractere)" }),
  message: z.string()
    .trim()
    .min(10, { message: "Mesajul trebuie să aibă cel puțin 10 caractere" })
    .max(2000, { message: "Mesajul este prea lung (max 2000 caractere)" })
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ContactFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Eroare validare",
        description: "Te rugăm să corectezi erorile din formular",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Mesaj trimis cu succes!",
        description: "Îți vom răspunde în cel mai scurt timp posibil.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu am putut trimite mesajul. Te rugăm să încerci din nou.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <Badge variant="secondary" className="mb-4 gap-2">
              <MessageSquare className="h-3 w-3" />
              Contact
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hai să vorbim!
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Suntem aici să te ajutăm. Trimite-ne un mesaj și îți vom răspunde cât mai curând posibil.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Scrie-ne oricând
                </p>
                <a href="mailto:contact@smartinvoice.ro" className="text-primary hover:underline">
                  contact@smartinvoice.ro
                </a>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Telefon</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Luni - Vineri, 9:00 - 18:00
                </p>
                <a href="tel:+40123456789" className="text-primary hover:underline">
                  +40 123 456 789
                </a>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Birou</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  București, România
                </p>
                <p className="text-primary">
                  Str. Exemplu, Nr. 123
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Trimite-ne un mesaj</CardTitle>
                <CardDescription>
                  Completează formularul și îți vom răspunde în maxim 24 de ore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nume complet <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ion Popescu"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="ion@exemplu.ro"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon (opțional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+40 123 456 789"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subiect <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Despre ce vrei să discutăm?"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Mesaj <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Scrie aici mesajul tău..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      disabled={loading}
                      className={errors.message ? "border-destructive" : ""}
                      maxLength={2000}
                    />
                    <div className="flex justify-between items-center">
                      {errors.message ? (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {formData.message.length} / 2000 caractere
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Se trimite...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Trimite mesajul
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Întrebări frecvente
              </h2>
              <p className="text-lg text-muted-foreground">
                Poate găsești răspunsul aici înainte de a ne contacta
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Cât durează să primesc un răspuns?",
                  a: "De obicei răspundem în maximum 24 de ore în zilele lucrătoare."
                },
                {
                  q: "Pot programa o demo a platformei?",
                  a: "Sigur! Trimite-ne un email sau sună-ne pentru a programa o sesiune demo personalizată."
                },
                {
                  q: "Oferiți suport tehnic?",
                  a: "Da, oferim suport tehnic complet pentru toți utilizatorii platformei noastre."
                },
                {
                  q: "Există o perioadă de probă gratuită?",
                  a: "Da, poți testa gratuit platforma pentru a vedea dacă se potrivește nevoilor tale."
                }
              ].map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Response Time Info */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Program de lucru</h3>
            <p className="text-muted-foreground">
              Luni - Vineri: 9:00 - 18:00 | Sâmbătă - Duminică: Închis
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Mesajele primite în afara programului vor fi procesate în următoarea zi lucrătoare
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
