import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Sitemap() {
  const [xmlContent, setXmlContent] = useState<string>("");

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const { data: posts, error } = await supabase
          .from("blog_posts")
          .select("slug, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (error) throw error;

        const baseUrl = window.location.origin;
        const staticPages = [
          { loc: "/", priority: "1.0", changefreq: "weekly" },
          { loc: "/auth", priority: "0.8", changefreq: "monthly" },
          { loc: "/dashboard", priority: "0.9", changefreq: "daily" },
          { loc: "/invoices", priority: "0.9", changefreq: "daily" },
          { loc: "/invoice-form", priority: "0.8", changefreq: "weekly" },
          { loc: "/clients", priority: "0.8", changefreq: "weekly" },
          { loc: "/expenses", priority: "0.7", changefreq: "weekly" },
          { loc: "/reports", priority: "0.8", changefreq: "weekly" },
          { loc: "/saft-validator", priority: "0.8", changefreq: "weekly" },
          { loc: "/bank-statements", priority: "0.7", changefreq: "weekly" },
          { loc: "/inventory", priority: "0.7", changefreq: "weekly" },
          { loc: "/chart-of-accounts", priority: "0.7", changefreq: "weekly" },
          { loc: "/settings", priority: "0.6", changefreq: "monthly" },
          { loc: "/team", priority: "0.6", changefreq: "monthly" },
          { loc: "/pricing", priority: "0.9", changefreq: "monthly" },
          { loc: "/about", priority: "0.7", changefreq: "monthly" },
          { loc: "/blog", priority: "0.8", changefreq: "daily" },
          { loc: "/contact", priority: "0.7", changefreq: "monthly" },
          { loc: "/privacy", priority: "0.5", changefreq: "yearly" },
          { loc: "/terms", priority: "0.5", changefreq: "yearly" },
          { loc: "/gdpr", priority: "0.5", changefreq: "yearly" },
        ];

        const blogUrls = (posts || []).map((post) => ({
          loc: `/blog/${post.slug}`,
          lastmod: new Date(post.published_at).toISOString().split("T")[0],
          priority: "0.8",
          changefreq: "monthly",
        }));

        const allUrls = [
          ...staticPages.map((page) => ({
            ...page,
            lastmod: "2025-12-01",
          })),
          ...blogUrls,
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

        setXmlContent(xml);
      } catch (error) {
        console.error("Error generating sitemap:", error);
      }
    };

    generateSitemap();
  }, []);

  useEffect(() => {
    if (xmlContent) {
      document.title = "Sitemap | SmartInvoice";
    }
  }, [xmlContent]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
        <div className="bg-card border rounded-lg p-6">
          <pre className="text-xs overflow-auto whitespace-pre-wrap">
            {xmlContent || "Se generează sitemap..."}
          </pre>
        </div>
      </div>
    </div>
  );
}