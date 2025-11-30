import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Loader2, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

export function SubscriptionManagement() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [canceling, setCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Load subscription
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subData) {
      setSubscription(subData);
    }

    // Load transactions
    const { data: transData } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (transData) {
      setTransactions(transData);
    }

    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Abonament anulat cu succes. Se va încheia la sfârșitul perioadei curente.');
        await loadData();
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error(error.message || 'Eroare la anularea abonamentului');
    } finally {
      setCanceling(false);
      setShowCancelDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; className: string; label: string }> = {
      active: {
        icon: CheckCircle,
        className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
        label: "Activ"
      },
      canceled: {
        icon: XCircle,
        className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
        label: "Anulat"
      },
      past_due: {
        icon: AlertCircle,
        className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
        label: "Întârziere"
      },
      incomplete: {
        icon: Clock,
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
        label: "Incomplet"
      }
    };

    const config = statusConfig[status] || {
      icon: AlertCircle,
      className: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
      label: status
    };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getTransactionStatusBadge = (status: string) => {
    if (status === 'succeeded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <CheckCircle className="h-3 w-3" />
          Reușit
        </span>
      );
    } else if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <XCircle className="h-3 w-3" />
          Eșuat
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          <Clock className="h-3 w-3" />
          În așteptare
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Niciun abonament activ</CardTitle>
          <CardDescription>Alege un plan pentru a începe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Momentan nu ai un abonament activ
            </p>
            <Button onClick={() => window.location.href = '/pricing'}>
              Vezi planurile disponibile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Abonament curent</CardTitle>
          <CardDescription>Detalii despre planul tău de plată</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold capitalize">{subscription.plan_name}</h3>
              <p className="text-sm text-muted-foreground">Plan lunar</p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Perioadă curentă</p>
                <p className="text-sm font-medium">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Următoarea factură</p>
                <p className="text-sm font-medium">
                  {subscription.cancel_at_period_end 
                    ? "Anulat - nu se va reînnoi"
                    : formatDate(subscription.current_period_end)
                  }
                </p>
              </div>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    Abonament programat pentru anulare
                  </p>
                  <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
                    Accesul tău va continua până la {formatDate(subscription.current_period_end)}. După această dată, abonamentul se va încheia.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/pricing'}
            >
              Schimbă planul
            </Button>
            
            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={canceling}
              >
                {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anulează abonamentul
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Istoric tranzacții</CardTitle>
          <CardDescription>Ultimele 10 tranzacții de plată</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nicio tranzacție înregistrată</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descriere</TableHead>
                    <TableHead>Sumă</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.description || 'Plată abonament'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell>
                        {getTransactionStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur că vrei să anulezi?</AlertDialogTitle>
            <AlertDialogDescription>
              Abonamentul tău va rămâne activ până la sfârșitul perioadei curente de facturare ({formatDate(subscription.current_period_end)}). 
              După această dată, nu vei mai fi taxat și accesul la funcționalitățile premium va înceta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Renunță</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmă anularea
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
