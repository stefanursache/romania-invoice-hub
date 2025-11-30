import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Ban, DollarSign, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  profiles: {
    email: string;
    company_name: string;
  } | null;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_id: string | null;
  description: string | null;
  created_at: string;
  profiles: {
    email: string;
    company_name: string;
  } | null;
}

export function SubscriptionManager() {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (subsError) throw subsError;

      // Load transactions
      const { data: txData, error: txError } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (txError) throw txError;

      // Get unique user IDs
      const userIds = [
        ...new Set([
          ...(subsData || []).map((s) => s.user_id),
          ...(txData || []).map((t) => t.user_id),
        ]),
      ];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, company_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, { email: p.email || "", company_name: p.company_name }])
      );

      // Merge profiles with subscriptions
      const subsWithProfiles = (subsData || []).map((sub) => ({
        ...sub,
        profiles: profilesMap.get(sub.user_id) || null,
      }));

      // Merge profiles with transactions
      const txWithProfiles = (txData || []).map((tx) => ({
        ...tx,
        profiles: profilesMap.get(tx.user_id) || null,
      }));

      setSubscriptions(subsWithProfiles);
      setTransactions(txWithProfiles);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Error loading data", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSub?.stripe_subscription_id) {
      toast.error("No Stripe subscription ID found");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-cancel-subscription", {
        body: {
          subscriptionId: selectedSub.stripe_subscription_id,
          userId: selectedSub.user_id,
        },
      });

      if (error) throw error;

      toast.success("Subscription cancelled successfully");
      setShowCancelDialog(false);
      setSelectedSub(null);
      await loadData();
    } catch (error: any) {
      toast.error("Error cancelling subscription", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedTx?.stripe_payment_id) {
      toast.error("No Stripe payment ID found");
      return;
    }

    const amount = refundAmount ? parseFloat(refundAmount) * 100 : undefined;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-refund-payment", {
        body: {
          paymentIntentId: selectedTx.stripe_payment_id,
          amount: amount,
          transactionId: selectedTx.id,
        },
      });

      if (error) throw error;

      toast.success("Refund processed successfully");
      setShowRefundDialog(false);
      setSelectedTx(null);
      setRefundAmount("");
      await loadData();
    } catch (error: any) {
      toast.error("Error processing refund", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    searchEmail ? sub.profiles?.email?.toLowerCase().includes(searchEmail.toLowerCase()) : true
  );

  const filteredTransactions = transactions.filter((tx) =>
    searchEmail ? tx.profiles?.email?.toLowerCase().includes(searchEmail.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Filter subscriptions and transactions by email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Manage customer subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && subscriptions.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No subscriptions found</p>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sub.profiles?.company_name}</p>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                      {sub.cancel_at_period_end && (
                        <Badge variant="outline">Cancelling</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                    <p className="text-sm">
                      {sub.plan_name} Plan
                      {sub.current_period_end && (
                        <span className="text-muted-foreground">
                          {" • "}Renews {format(new Date(sub.current_period_end), "MMM dd, yyyy")}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedSub(sub);
                      setShowCancelDialog(true);
                    }}
                    disabled={sub.cancel_at_period_end || sub.status !== "active"}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>Issue refunds for completed payments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && transactions.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tx.profiles?.company_name}</p>
                      <Badge variant={tx.status === "succeeded" ? "default" : tx.status === "refunded" ? "secondary" : "destructive"}>
                        {tx.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tx.profiles?.email}</p>
                    <p className="text-sm">
                      <span className="font-medium">
                        {(tx.amount / 100).toFixed(2)} {tx.currency?.toUpperCase()}
                      </span>
                      {tx.description && (
                        <span className="text-muted-foreground"> • {tx.description}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTx(tx);
                      setRefundAmount((tx.amount / 100).toString());
                      setShowRefundDialog(true);
                    }}
                    disabled={tx.status !== "succeeded"}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? The customer will retain access until the end of their current billing period.
              <div className="mt-4 p-3 rounded-md bg-muted">
                <p className="text-sm font-medium">{selectedSub?.profiles?.company_name}</p>
                <p className="text-sm text-muted-foreground">{selectedSub?.profiles?.email}</p>
                <p className="text-sm">{selectedSub?.plan_name} Plan</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Issue a full or partial refund for this payment. Leave amount empty for full refund.
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">{selectedTx?.profiles?.company_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTx?.profiles?.email}</p>
                  <p className="text-sm">
                    Original: {selectedTx && (selectedTx.amount / 100).toFixed(2)} {selectedTx?.currency?.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Amount (leave empty for full refund)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 29.99"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
