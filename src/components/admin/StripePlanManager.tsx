import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StripePlanManager() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
  });
  
  const [newPrice, setNewPrice] = useState({
    productId: "",
    amount: "",
    currency: "usd",
    interval: "month",
    intervalCount: "1",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-stripe-connection");
      
      if (error) throw error;
      
      if (data.success) {
        setConnectionStatus("connected");
        toast.success("Stripe connection successful!", {
          description: `Account: ${data.account?.email || "Connected"}`,
        });
      } else {
        setConnectionStatus("error");
        toast.error("Stripe connection failed", {
          description: data.error || "Unknown error",
        });
      }
    } catch (error: any) {
      setConnectionStatus("error");
      toast.error("Error testing connection", {
        description: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-stripe-products");
      
      if (error) throw error;
      
      setProducts(data.products || []);
    } catch (error: any) {
      console.error("Error loading products:", error);
      toast.error("Error loading products", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name) {
      toast.error("Product name is required");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-stripe-product", {
        body: newProduct,
      });
      
      if (error) throw error;
      
      toast.success("Product created successfully!");
      setNewProduct({ name: "", description: "" });
      await loadProducts();
    } catch (error: any) {
      toast.error("Error creating product", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrice = async () => {
    if (!newPrice.productId || !newPrice.amount) {
      toast.error("Product and amount are required");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-stripe-price", {
        body: {
          productId: newPrice.productId,
          amount: parseInt(newPrice.amount) * 100, // Convert to cents
          currency: newPrice.currency,
          interval: newPrice.interval,
          intervalCount: parseInt(newPrice.intervalCount),
        },
      });
      
      if (error) throw error;
      
      toast.success("Price created successfully!");
      setNewPrice({ productId: "", amount: "", currency: "usd", interval: "month", intervalCount: "1" });
      await loadProducts();
    } catch (error: any) {
      toast.error("Error creating price", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connection Status</CardTitle>
          <CardDescription>Test your Stripe API connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={testConnection} disabled={testing}>
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            {connectionStatus === "connected" && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {connectionStatus === "error" && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Connection Failed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Stripe Product</CardTitle>
          <CardDescription>Create a new product in Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g., Professional Plan"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productDesc">Description</Label>
              <Input
                id="productDesc"
                placeholder="e.g., Full access to all features"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={createProduct} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Product
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Stripe Price</CardTitle>
          <CardDescription>Add a pricing tier to an existing product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceProduct">Product</Label>
              <Select value={newPrice.productId} onValueChange={(value) => setNewPrice({ ...newPrice, productId: value })}>
                <SelectTrigger id="priceProduct">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceAmount">Amount</Label>
              <Input
                id="priceAmount"
                type="number"
                placeholder="e.g., 29.99"
                value={newPrice.amount}
                onChange={(e) => setNewPrice({ ...newPrice, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceCurrency">Currency</Label>
              <Select value={newPrice.currency} onValueChange={(value) => setNewPrice({ ...newPrice, currency: value })}>
                <SelectTrigger id="priceCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="ron">RON</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceInterval">Billing Interval</Label>
              <Select value={newPrice.interval} onValueChange={(value) => setNewPrice({ ...newPrice, interval: value })}>
                <SelectTrigger id="priceInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createPrice} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Price
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stripe Products</CardTitle>
            <CardDescription>View all products and prices configured in Stripe</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No products found. Create one to get started.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        {product.description && (
                          <CardDescription>{product.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {product.prices && product.prices.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Prices:</p>
                        <div className="space-y-2">
                          {product.prices.map((price: any) => (
                            <div key={price.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                              <span className="text-sm">
                                {(price.unit_amount / 100).toFixed(2)} {price.currency.toUpperCase()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                per {price.recurring?.interval_count > 1 && `${price.recurring.interval_count} `}
                                {price.recurring?.interval}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
