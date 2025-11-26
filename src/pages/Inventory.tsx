import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Package, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ArrowUpCircle, ArrowDownCircle, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  purchase_price: number;
  sale_price: number;
  vat_rate: number;
  is_active: boolean;
  created_at: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_price: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  products: Product;
}

const Inventory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    unit_of_measure: "buc",
    minimum_stock: 0,
    purchase_price: 0,
    sale_price: 0,
    vat_rate: 19,
  });

  const [movementData, setMovementData] = useState({
    product_id: "",
    movement_type: "in" as 'in' | 'out' | 'adjustment',
    quantity: 0,
    unit_price: 0,
    notes: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadData(user.id);
  };

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load movements
      const { data: movementsData, error: movementsError } = await supabase
        .from("stock_movements")
        .select("*, products(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (movementsError) throw movementsError;
      setMovements((movementsData || []) as StockMovement[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t('inventory.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.name) {
        toast.error(t('inventory.nameRequired'));
        return;
      }

      const productData = {
        ...formData,
        user_id: user.id,
        current_stock: 0,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success(t('inventory.productUpdated'));
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;
        toast.success(t('inventory.productAdded'));
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        description: "",
        category: "",
        unit_of_measure: "buc",
        minimum_stock: 0,
        purchase_price: 0,
        sale_price: 0,
        vat_rate: 19,
      });
      await loadData(user.id);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(t('inventory.saveError'));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('inventory.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success(t('inventory.productDeleted'));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadData(user.id);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(t('inventory.deleteError'));
    }
  };

  const handleAddMovement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!movementData.product_id || !movementData.quantity) {
        toast.error(t('inventory.movementRequired'));
        return;
      }

      const { error } = await supabase
        .from("stock_movements")
        .insert([{
          ...movementData,
          user_id: user.id,
          created_by: user.id,
        }]);

      if (error) throw error;
      toast.success(t('inventory.movementAdded'));
      
      setIsAddMovementOpen(false);
      setMovementData({
        product_id: "",
        movement_type: "in",
        quantity: 0,
        unit_price: 0,
        notes: "",
      });
      await loadData(user.id);
    } catch (error) {
      console.error("Error adding movement:", error);
      toast.error(t('inventory.movementError'));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "",
      unit_of_measure: product.unit_of_measure,
      minimum_stock: product.minimum_stock,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      vat_rate: product.vat_rate,
    });
    setIsAddProductOpen(true);
  };

  const calculateTotalStockValue = () => {
    return products.reduce((total, product) => {
      return total + (product.current_stock * product.purchase_price);
    }, 0);
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.current_stock <= p.minimum_stock && p.is_active);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'out':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <SettingsIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const lowStockProducts = getLowStockProducts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('inventory.title')}</h1>
            <p className="text-muted-foreground">{t('inventory.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddMovementOpen} onOpenChange={setIsAddMovementOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('inventory.addMovement')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('inventory.newMovement')}</DialogTitle>
                  <DialogDescription>{t('inventory.movementDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('inventory.product')}</Label>
                    <Select value={movementData.product_id} onValueChange={(value) => setMovementData({...movementData, product_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('inventory.selectProduct')} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.current_stock} {product.unit_of_measure})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('inventory.movementType')}</Label>
                    <Select value={movementData.movement_type} onValueChange={(value: any) => setMovementData({...movementData, movement_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">{t('inventory.movementIn')}</SelectItem>
                        <SelectItem value="out">{t('inventory.movementOut')}</SelectItem>
                        <SelectItem value="adjustment">{t('inventory.movementAdjustment')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('inventory.quantity')}</Label>
                    <Input
                      type="number"
                      value={movementData.quantity}
                      onChange={(e) => setMovementData({...movementData, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.unitPrice')}</Label>
                    <Input
                      type="number"
                      value={movementData.unit_price}
                      onChange={(e) => setMovementData({...movementData, unit_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.notes')}</Label>
                    <Textarea
                      value={movementData.notes}
                      onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddMovement}>{t('common.save')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddProductOpen} onOpenChange={(open) => {
              setIsAddProductOpen(open);
              if (!open) {
                setEditingProduct(null);
                setFormData({
                  name: "",
                  sku: "",
                  description: "",
                  category: "",
                  unit_of_measure: "buc",
                  minimum_stock: 0,
                  purchase_price: 0,
                  sale_price: 0,
                  vat_rate: 19,
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.newProduct')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? t('inventory.editProduct') : t('inventory.newProduct')}</DialogTitle>
                  <DialogDescription>{t('inventory.productDescription')}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{t('inventory.name')} *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.sku')}</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.category')}</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{t('inventory.description')}</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.unitOfMeasure')}</Label>
                    <Select value={formData.unit_of_measure} onValueChange={(value) => setFormData({...formData, unit_of_measure: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buc">buc (bucată)</SelectItem>
                        <SelectItem value="kg">kg (kilogram)</SelectItem>
                        <SelectItem value="l">l (litru)</SelectItem>
                        <SelectItem value="m">m (metru)</SelectItem>
                        <SelectItem value="m2">m² (metru pătrat)</SelectItem>
                        <SelectItem value="h">h (oră)</SelectItem>
                        <SelectItem value="set">set</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('inventory.minimumStock')}</Label>
                    <Input
                      type="number"
                      value={formData.minimum_stock}
                      onChange={(e) => setFormData({...formData, minimum_stock: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.purchasePrice')}</Label>
                    <Input
                      type="number"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({...formData, purchase_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.salePrice')}</Label>
                    <Input
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({...formData, sale_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>{t('inventory.vatRate')}</Label>
                    <Select value={String(formData.vat_rate)} onValueChange={(value) => setFormData({...formData, vat_rate: Number(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="9">9%</SelectItem>
                        <SelectItem value="19">19%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProduct}>{editingProduct ? t('common.update') : t('common.save')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.totalProducts')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">{products.filter(p => p.is_active).length} {t('inventory.active')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.totalValue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateTotalStockValue().toFixed(2)} RON</div>
              <p className="text-xs text-muted-foreground">{t('inventory.atPurchasePrice')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('inventory.lowStock')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts.length}</div>
              <p className="text-xs text-muted-foreground">{t('inventory.needsAttention')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-amber-700 dark:text-amber-400">{t('inventory.lowStockAlert')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
                      {product.current_stock} / {product.minimum_stock} {product.unit_of_measure}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">{t('inventory.products')}</TabsTrigger>
            <TabsTrigger value="movements">{t('inventory.movements')}</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.productList')}</CardTitle>
                <CardDescription>{t('inventory.manageProducts')}</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('inventory.noProducts')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">{t('inventory.name')}</th>
                          <th className="text-left p-2 font-medium">{t('inventory.sku')}</th>
                          <th className="text-left p-2 font-medium">{t('inventory.category')}</th>
                          <th className="text-right p-2 font-medium">{t('inventory.stock')}</th>
                          <th className="text-right p-2 font-medium">{t('inventory.purchasePrice')}</th>
                          <th className="text-right p-2 font-medium">{t('inventory.salePrice')}</th>
                          <th className="text-right p-2 font-medium">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.description && (
                                  <div className="text-xs text-muted-foreground">{product.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-sm">{product.sku || "-"}</td>
                            <td className="p-2">
                              {product.category ? (
                                <Badge variant="secondary">{product.category}</Badge>
                              ) : "-"}
                            </td>
                            <td className="p-2 text-right">
                              <Badge variant={product.current_stock <= product.minimum_stock ? "destructive" : "default"}>
                                {product.current_stock} {product.unit_of_measure}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{product.purchase_price.toFixed(2)} RON</td>
                            <td className="p-2 text-right">{product.sale_price.toFixed(2)} RON</td>
                            <td className="p-2">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.stockMovements')}</CardTitle>
                <CardDescription>{t('inventory.movementHistory')}</CardDescription>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('inventory.noMovements')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {movements.map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getMovementIcon(movement.movement_type)}
                          <div>
                            <div className="font-medium">{movement.products.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(movement.created_at), "dd MMM yyyy HH:mm")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity} {movement.products.unit_of_measure}
                          </div>
                          {movement.unit_price && (
                            <div className="text-sm text-muted-foreground">
                              {movement.unit_price.toFixed(2)} RON/{movement.products.unit_of_measure}
                            </div>
                          )}
                          {movement.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{movement.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
