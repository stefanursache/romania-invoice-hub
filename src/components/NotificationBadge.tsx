import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const NotificationBadge = () => {
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertCount();
    
    // Refresh alert count every 5 minutes
    const interval = setInterval(loadAlertCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlertCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is an accountant
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "accountant") {
        setLoading(false);
        return;
      }

      // Get all workspace memberships
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_owner_id")
        .eq("member_user_id", user.id);

      if (!memberships) {
        setLoading(false);
        return;
      }

      let totalAlerts = 0;

      // Quick count of high-priority alerts only (overdue invoices and missing info)
      for (const membership of memberships) {
        const ownerId = membership.workspace_owner_id;

        // Check for missing company information
        const { data: profile } = await supabase
          .from("profiles")
          .select("cui_cif, reg_com, address")
          .eq("id", ownerId)
          .single();

        if (!profile?.cui_cif || !profile?.reg_com || !profile?.address) {
          totalAlerts++;
        }

        // Check for overdue invoices
        const today = new Date().toISOString().split('T')[0];
        const { count: overdueCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ownerId)
          .eq("status", "sent")
          .lt("due_date", today);

        if (overdueCount && overdueCount > 0) {
          totalAlerts++;
        }

        // Check for draft invoices
        const { count: draftCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ownerId)
          .eq("status", "draft");

        if (draftCount && draftCount > 0) {
          totalAlerts++;
        }
      }

      setAlertCount(totalAlerts);
    } catch (error) {
      console.error("Error loading alert count:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate("/accountant-dashboard");
  };

  if (loading || alertCount === 0) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
      title={`${alertCount} alert${alertCount > 1 ? 's' : ''}`}
    >
      <Bell className="h-5 w-5" />
      {alertCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {alertCount > 9 ? '9+' : alertCount}
        </Badge>
      )}
    </Button>
  );
};
