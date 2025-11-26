import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Search,
  TrendingUp,
  FileText,
  Lightbulb,
  BookOpen,
  User
} from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Ghid complet: Cum să emiti facturi conforme ANAF în 2025",
    excerpt: "Tot ce trebuie să știi despre emiterea facturilor în România - de la cerințe legale la bune practici.",
    category: "Legislație",
    date: "15 Ian 2025",
    readTime: "8 min",
    image: "📋",
    featured: true
  },
  {
    id: 2,
    title: "SAF-T România: Ghid practic pentru export și raportare",
    excerpt: "Înțelege cerințele SAF-T și cum să exporți corect datele financiare către ANAF.",
    category: "Conformitate",
    date: "10 Ian 2025",
    readTime: "10 min",
    image: "📊",
    featured: true
  },
  {
    id: 3,
    title: "5 greșeli comune în facturare și cum să le eviți",
    excerpt: "Descoperă cele mai frecvente erori pe care antreprenorii le fac și cum să le previi.",
    category: "Bune practici",
    date: "5 Ian 2025",
    readTime: "6 min",
    image: "⚠️",
    featured: false
  },
  {
    id: 4,
    title: "Colaborarea cu contabilul: Cum să optimizezi procesele",
    excerpt: "Sfaturi practice pentru o colaborare eficientă între antreprenor și contabil.",
    category: "Productivitate",
    date: "28 Dec 2024",
    readTime: "7 min",
    image: "🤝",
    featured: false
  },
  {
    id: 5,
    title: "Automatizarea facturării: De ce contează pentru afacerea ta",
    excerpt: "Descoperă beneficiile automatizării și cum poate economisi timp prețios.",
    category: "Tehnologie",
    date: "20 Dec 2024",
    readTime: "5 min",
    image: "⚡",
    featured: false
  },
  {
    id: 6,
    title: "Plan de conturi: Structura corectă pentru micro-întreprinderi",
    excerpt: "Ghid practic pentru configurarea planului de conturi conform standardelor românești.",
    category: "Contabilitate",
    date: "15 Dec 2024",
    readTime: "9 min",
    image: "📖",
    featured: false
  }
];

const categories = [
  { name: "Toate", count: blogPosts.length },
  { name: "Legislație", count: 1 },
  { name: "Conformitate", count: 1 },
  { name: "Bune practici", count: 1 },
  { name: "Productivitate", count: 1 },
  { name: "Tehnologie", count: 1 },
  { name: "Contabilitate", count: 1 }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <Badge variant="secondary" className="mb-4 gap-2">
              <BookOpen className="h-3 w-3" />
              Blog SmartInvoice
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Învață. Crește. Reușește.
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Articole, ghiduri și sfaturi despre facturare, contabilitate și gestionarea afacerii tale
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Caută articole..."
                className="pl-10 h-12 bg-background/95 backdrop-blur"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={category.name === "Toate" ? "default" : "outline"}
                className="gap-2"
              >
                {category.name}
                <Badge variant="secondary" className="ml-1">{category.count}</Badge>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Articole în tendințe</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {blogPosts.filter(post => post.featured).map((post) => (
              <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-6xl">
                  {post.image}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="gap-2 group-hover:gap-3 transition-all">
                    Citește mai mult
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All Posts */}
          <div className="flex items-center gap-2 mb-8">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Toate articolele</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.filter(post => !post.featured).map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-5xl">
                  {post.image}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 w-full">
                    Citește
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Rămâi la curent cu noutățile
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Primește articole noi, ghiduri și sfaturi direct în inbox
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="adresa@email.ro"
                className="h-12"
              />
              <Button size="lg" className="gap-2">
                Abonează-te
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Fără spam. Poți anula abonamentul oricând.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Gata să începi?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Pune în practică ce ai învățat cu SmartInvoice România
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Creează cont gratuit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
