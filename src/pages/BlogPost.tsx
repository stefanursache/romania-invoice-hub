import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Eye, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  published_at: string;
  reading_time_minutes: number;
  views_count: number;
  meta_description: string;
  meta_keywords: string[];
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (error) throw error;

        setPost(data);

        // Increment view count
        await supabase
          .from("blog_posts")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", data.id);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        toast.error("Nu am putut încărca articolul");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    // Add Schema.org Article structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.meta_description || post.excerpt,
      "image": `${window.location.origin}/placeholder.svg`,
      "author": {
        "@type": "Organization",
        "name": post.author,
      },
      "publisher": {
        "@type": "Organization",
        "name": "SmartInvoice România",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/placeholder.svg`,
        },
      },
      "datePublished": post.published_at,
      "dateModified": post.published_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href,
      },
      "keywords": post.meta_keywords?.join(", "),
      "articleBody": post.content,
      "wordCount": post.content.split(/\s+/).length,
      "timeRequired": `PT${post.reading_time_minutes}M`,
      "inLanguage": "ro-RO",
    };

    // Update document meta tags
    document.title = `${post.title} | Blog SmartInvoice`;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", post.meta_description || post.excerpt);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && post.meta_keywords) {
      metaKeywords.setAttribute("content", post.meta_keywords.join(", "));
    }

    // Add structured data script
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [post]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiat în clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Articolul nu a fost găsit</h1>
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 border-b">
        <div className="container mx-auto px-4">
          <Link to="/blog">
            <Button variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la blog
            </Button>
          </Link>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "d MMMM yyyy", { locale: ro })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min citire
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {post.views_count} vizualizări
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">✍️</span>
                </div>
                <div>
                  <p className="font-medium">{post.author}</p>
                  <p className="text-sm text-muted-foreground">Autor</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Distribuie
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="prose prose-lg max-w-none p-8 md:p-12">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-base leading-relaxed mb-4 text-foreground">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 text-foreground">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-base leading-relaxed text-foreground">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </CardContent>
          </Card>

          {/* Keywords */}
          {post.meta_keywords && post.meta_keywords.length > 0 && (
            <div className="mt-8">
              <Separator className="mb-6" />
              <div className="flex flex-wrap gap-2">
                {post.meta_keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10 border-none">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Gata să începi cu SmartInvoice?
              </h2>
              <p className="text-muted-foreground mb-6">
                Pune în practică ce ai învățat cu platforma noastră de facturare
              </p>
              <Link to="/auth">
                <Button size="lg">Creează cont gratuit</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  );
}