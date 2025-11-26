import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AccessRequest {
  id: string;
  business_owner_email: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
}

export default function AccountantAccessRequest() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setRequesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if business owner exists
      const { data: ownerData, error: ownerError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim())
        .maybeSingle();

      if (ownerError) throw ownerError;

      if (!ownerData) {
        toast({
          variant: "destructive",
          title: t("accessRequest.userNotFound"),
          description: t("accessRequest.userNotFoundDesc"),
        });
        return;
      }

      // Check if already requested
      const { data: existingRequest } = await supabase
        .from("access_requests")
        .select("id, status")
        .eq("accountant_user_id", user.id)
        .eq("business_owner_id", ownerData.id)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          toast({
            variant: "destructive",
            title: t("accessRequest.alreadyRequested"),
            description: t("accessRequest.alreadyRequestedDesc"),
          });
        } else if (existingRequest.status === "approved") {
          toast({
            variant: "destructive",
            title: t("accessRequest.alreadyApproved"),
            description: t("accessRequest.alreadyApprovedDesc"),
          });
        } else {
          toast({
            variant: "destructive",
            title: t("accessRequest.previouslyRejected"),
            description: t("accessRequest.previouslyRejectedDesc"),
          });
        }
        return;
      }

      // Create access request
      const { error } = await supabase
        .from("access_requests")
        .insert({
          accountant_user_id: user.id,
          business_owner_email: email.trim(),
          business_owner_id: ownerData.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: t("accessRequest.success"),
        description: t("accessRequest.successDesc"),
      });

      setEmail("");
      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return t("accessRequest.statusApproved");
      case "rejected":
        return t("accessRequest.statusRejected");
      default:
        return t("accessRequest.statusPending");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t("accessRequest.title")}
          </CardTitle>
          <CardDescription>
            {t("accessRequest.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequest} className="flex gap-4">
            <Input
              type="email"
              placeholder="business@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
              disabled={requesting}
            />
            <Button type="submit" disabled={requesting || !email.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {requesting ? t("accessRequest.requesting") : t("accessRequest.sendRequest")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!loading && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("accessRequest.myRequests")}</CardTitle>
            <CardDescription>
              {t("accessRequest.myRequestsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{request.business_owner_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("accessRequest.requestedOn")} {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="text-sm font-medium capitalize">
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
