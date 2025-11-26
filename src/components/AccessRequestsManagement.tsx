import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AccessRequest {
  id: string;
  accountant_user_id: string;
  business_owner_email: string;
  status: string;
  requested_at: string;
  profiles: {
    company_name: string;
    email: string;
  } | null;
}

export default function AccessRequestsManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .or(`business_owner_id.eq.${user.id},business_owner_email.eq.${user.email}`)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch accountant profiles
      if (data && data.length > 0) {
        const accountantIds = data.map(r => r.accountant_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, company_name, email")
          .in("id", accountantIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        const requestsWithProfiles = data.map(request => ({
          ...request,
          profiles: profileMap.get(request.accountant_user_id) || null
        }));
        
        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, accountantUserId: string) => {
    setProcessing(requestId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update request status
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Add to workspace_members
      const { error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_owner_id: user.id,
          member_user_id: accountantUserId,
          role: "accountant",
        });

      if (insertError) {
        // If already exists, ignore the error
        if (insertError.code !== "23505") {
          throw insertError;
        }
      }

      toast({
        title: t("accessRequest.approved"),
        description: t("accessRequest.approvedDesc"),
      });

      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: t("accessRequest.rejected"),
        description: t("accessRequest.rejectedDesc"),
      });

      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t("accessRequest.incomingRequests")}
        </CardTitle>
        <CardDescription>
          {t("accessRequest.incomingRequestsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">
                  {request.profiles?.company_name || request.profiles?.email || t("common.unknown")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {request.profiles?.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("accessRequest.requestedOn")} {new Date(request.requested_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {t("accessRequest.statusPending")}
                </Badge>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(request.id, request.accountant_user_id)}
                  disabled={processing === request.id}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t("accessRequest.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  disabled={processing === request.id}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t("accessRequest.reject")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
