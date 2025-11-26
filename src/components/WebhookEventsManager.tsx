import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  event_data: any;
  processed_at: string;
  status: string;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

interface FailedPayment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
  retry_available: boolean;
  last_retry_at: string | null;
  stripe_payment_id: string | null;
}

export const WebhookEventsManager = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadWebhookEvents(), loadFailedPayments()]);
    setLoading(false);
  };

  const loadWebhookEvents = async () => {
    const { data, error } = await supabase
      .from("webhook_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading webhook events:", error);
      toast.error("Failed to load webhook events");
    } else {
      setWebhookEvents(data || []);
    }
  };

  const loadFailedPayments = async () => {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading failed payments:", error);
      toast.error("Failed to load failed payments");
    } else {
      setFailedPayments(data || []);
    }
  };

  const handleRetryPayment = async (transactionId: string) => {
    setRetryingPayment(transactionId);
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-payment', {
        body: { transactionId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Payment retry successful!");
        await loadData();
      } else {
        toast.error(data?.message || "Payment retry failed");
      }
    } catch (error: any) {
      console.error("Error retrying payment:", error);
      toast.error(error.message || "Failed to retry payment");
    } finally {
      setRetryingPayment(null);
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "destructive" | "secondary" | "outline", icon: any }> = {
      processed: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: AlertCircle },
      pending: { variant: "secondary", icon: Clock },
      succeeded: { variant: "default", icon: CheckCircle2 },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Events & Payments</h2>
          <p className="text-muted-foreground">Monitor Stripe webhooks and retry failed payments</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="failed-payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="failed-payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Failed Payments ({failedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="webhook-events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhook Events ({webhookEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>Payments that failed and can be retried</CardDescription>
            </CardHeader>
            <CardContent>
              {failedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No failed payments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Retry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">{formatDate(payment.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>{payment.description || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">
                          {payment.amount} {payment.currency?.toUpperCase()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm">
                          {payment.last_retry_at ? formatDate(payment.last_retry_at) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleRetryPayment(payment.id)}
                            disabled={!payment.retry_available || retryingPayment === payment.id}
                          >
                            {retryingPayment === payment.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook-events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Events History</CardTitle>
              <CardDescription>Recent Stripe webhook events received</CardDescription>
            </CardHeader>
            <CardContent>
              {webhookEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3" />
                  <p>No webhook events yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {webhookEvents.map((event) => (
                    <Collapsible key={event.id}>
                      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{event.event_type}</span>
                                {getStatusBadge(event.status)}
                                {event.retry_count > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.retry_count} retries
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-mono">{event.event_id}</span> • {formatDate(event.created_at)}
                              </div>
                              {event.error_message && (
                                <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {event.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEventExpansion(event.id)}
                            >
                              {expandedEvents.has(event.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-xs font-semibold mb-2">Event Data:</p>
                            <pre className="text-xs overflow-auto max-h-96">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
