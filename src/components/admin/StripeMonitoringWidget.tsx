import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, CheckCircle, XCircle, Clock, Zap, CreditCard, Users } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WebhookEvent {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  error_message: string | null;
  retry_count: number | null;
}

interface SubscriptionStats {
  active: number;
  trialing: number;
  past_due: number;
  canceled: number;
  total: number;
}

export function StripeMonitoringWidget() {
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<WebhookEvent[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    active: 0,
    trialing: 0,
    past_due: 0,
    canceled: 0,
    total: 0,
  });
  const [eventsToday, setEventsToday] = useState(0);
  const [failedEventsToday, setFailedEventsToday] = useState(0);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load recent webhook events
      const { data: eventsData, error: eventsError } = await supabase
        .from("webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;
      setRecentEvents(eventsData || []);

      // Load subscription stats
      const { data: subsData, error: subsError } = await supabase
        .from("user_subscriptions")
        .select("status");

      if (subsError) throw subsError;

      const stats = (subsData || []).reduce(
        (acc, sub) => {
          acc.total++;
          if (sub.status === "active") acc.active++;
          else if (sub.status === "trialing") acc.trialing++;
          else if (sub.status === "past_due") acc.past_due++;
          else if (sub.status === "canceled") acc.canceled++;
          return acc;
        },
        { active: 0, trialing: 0, past_due: 0, canceled: 0, total: 0 }
      );

      setSubscriptionStats(stats);

      // Count today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayCount } = await supabase
        .from("webhook_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setEventsToday(todayCount || 0);

      const { count: failedCount } = await supabase
        .from("webhook_events")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", today.toISOString());

      setFailedEventsToday(failedCount || 0);
    } catch (error: any) {
      console.error("Error loading monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("webhook_events_monitor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webhook_events",
        },
        (payload) => {
          console.log("New webhook event received:", payload);
          const newEvent = payload.new as WebhookEvent;
          
          setRecentEvents((prev) => [newEvent, ...prev.slice(0, 9)]);
          setEventsToday((prev) => prev + 1);
          
          if (newEvent.status === "failed") {
            setFailedEventsToday((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_subscriptions",
        },
        () => {
          // Reload subscription stats when subscriptions change
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getEventIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadgeVariant = (status: string) => {
    switch (status) {
      case "processed":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionStats.total} total subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.trialing}</div>
            <p className="text-xs text-muted-foreground">
              Active trial periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsToday}</div>
            <p className="text-xs text-muted-foreground">
              {failedEventsToday} failed events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {failedEventsToday === 0 ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div className="text-lg font-bold text-green-500">Healthy</div>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-yellow-500" />
                  <div className="text-lg font-bold text-yellow-500">Issues</div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              System status
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Webhook Events
          </CardTitle>
          <CardDescription>Live stream of incoming Stripe webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent events</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {getEventIcon(event.status)}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono">{event.event_type}</code>
                          <Badge variant={getEventBadgeVariant(event.status)}>
                            {event.status}
                          </Badge>
                          {event.retry_count && event.retry_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {event.retry_count} retries
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "MMM dd, yyyy HH:mm:ss")}
                        </p>
                        {event.error_message && (
                          <p className="text-xs text-red-500 truncate">
                            Error: {event.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {subscriptionStats.past_due > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <XCircle className="h-5 w-5" />
              Attention Required
            </CardTitle>
            <CardDescription>Subscriptions needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Past Due Subscriptions</span>
                <Badge variant="destructive">{subscriptionStats.past_due}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                These subscriptions have failed payments and require follow-up
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
