import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Search,
  TrendingUp,
  FileText,
  Lightbulb,
  BookOpen,
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  published_at: string;
  reading_time_minutes: number;
}

const categories = [
  { name: "Toate", count: 0 },
  { name: "Legislație", count: 0 },
  { name: "Conformitate", count: 0 },
  { name: "Bune practici", count: 0 },
  { name: "Productivitate", count: 0 },
  { name: "Tehnologie", count: 0 },
  { name: "Contabilitate", count: 0 }
];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, author, published_at, reading_time_minutes")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredPosts = filteredPosts.slice(0, 2);
  const regularPosts = filteredPosts.slice(2);

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-6 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {featuredPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-6xl">
                      📋
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.published_at), "d MMM yyyy", { locale: ro })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min
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
                </Link>
              ))}
            </div>
          ) : null}

          {/* All Posts */}
          <div className="flex items-center gap-2 mb-8">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Toate articolele</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-muted" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-6 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardHeader>
                </Card>
              ))
            ) : regularPosts.length > 0 ? (
              regularPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                    <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-5xl">
                      📄
                    </div>
                    <CardHeader>
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
                          {format(new Date(post.published_at), "d MMM", { locale: ro })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_minutes} min
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2 w-full">
                        Citește
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nu am găsit articole" : "Articolele vor apărea aici în curând"}
                </p>
              </div>
            )}
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
