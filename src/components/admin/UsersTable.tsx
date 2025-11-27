import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, FileText, Users, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { UserPlanManager } from "./UserPlanManager";
import { StartupDiscountManager } from "./StartupDiscountManager";

interface UserData {
  id: string;
  email: string;
  company_name: string;
  payment_plan: string;
  created_at: string;
  invoice_count: number;
  member_count: number;
  invoices_this_month: number;
}

interface UsersTableProps {
  users: UserData[];
  onRefresh: () => void;
}

export const UsersTable = ({ users, onRefresh }: UsersTableProps) => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [planManagerOpen, setPlanManagerOpen] = useState(false);
  const [discountManagerOpen, setDiscountManagerOpen] = useState(false);
  const [discountStatuses, setDiscountStatuses] = useState<Record<string, any>>({});
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  useEffect(() => {
    loadDiscountStatuses();
  }, [users]);

  const loadDiscountStatuses = async () => {
    if (users.length === 0) return;
    
    setLoadingDiscounts(true);
    try {
      const statuses: Record<string, any> = {};
      
      await Promise.all(
        users.map(async (user) => {
          const { data, error } = await supabase.rpc("get_startup_discount_eligibility", {
            _user_id: user.id,
          });

          if (!error && data && data.length > 0) {
            statuses[user.id] = data[0];
          }
        })
      );

      setDiscountStatuses(statuses);
    } catch (error) {
      console.error("Error loading discount statuses:", error);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "starter":
        return "default";
      case "professional":
        return "secondary";
      case "enterprise":
        return "default";
      default:
        return "outline";
    }
  };

  const getPlanLimits = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "starter":
        return { invoices: 25, members: 3 };
      case "professional":
        return { invoices: 100, members: 10 };
      case "enterprise":
        return { invoices: "∞", members: "∞" };
      default:
        return { invoices: 0, members: 1 };
    }
  };

  const handleEditPlan = (user: UserData) => {
    setSelectedUser(user);
    setPlanManagerOpen(true);
  };

  const handleManageDiscount = (user: UserData) => {
    setSelectedUser(user);
    setDiscountManagerOpen(true);
  };

  const handleDiscountUpdate = () => {
    loadDiscountStatuses();
    onRefresh();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Companie</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Reducere Start-up</TableHead>
              <TableHead>Facturi Luna Asta</TableHead>
              <TableHead>Membri Echipă</TableHead>
              <TableHead>Data Înregistrare</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Niciun utilizator găsit
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const limits = getPlanLimits(user.payment_plan);
                const invoiceUsage = limits.invoices === "∞" ? 0 : (user.invoices_this_month / Number(limits.invoices)) * 100;
                const memberUsage = limits.members === "∞" ? 0 : ((user.member_count + 1) / Number(limits.members)) * 100;
                const discountStatus = discountStatuses[user.id];

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.company_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(user.payment_plan)} className="capitalize">
                        {user.payment_plan || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {loadingDiscounts ? (
                        <Badge variant="outline">Se încarcă...</Badge>
                      ) : discountStatus ? (
                        <div className="flex items-center gap-2">
                          {discountStatus.is_eligible ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <Badge variant="default" className="bg-green-600 gap-1">
                                <Sparkles className="h-3 w-3" />
                                {discountStatus.eligibility_type === "manual_override" ? "Manual" : "Auto"}
                              </Badge>
                              {discountStatus.months_remaining < 999 && (
                                <span className="text-xs text-muted-foreground">
                                  {discountStatus.months_remaining}L
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline">Nu</Badge>
                            </>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className={invoiceUsage >= 100 ? "text-destructive font-semibold" : invoiceUsage >= 80 ? "text-warning font-semibold" : ""}>
                          {user.invoices_this_month} / {limits.invoices}
                        </span>
                        {invoiceUsage >= 80 && limits.invoices !== "∞" && (
                          <Badge variant={invoiceUsage >= 100 ? "destructive" : "default"} className="text-xs">
                            {Math.round(invoiceUsage)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className={memberUsage >= 100 ? "text-destructive font-semibold" : ""}>
                          {user.member_count + 1} / {limits.members}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageDiscount(user)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Reducere
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(user)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Plan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <>
          <UserPlanManager
            user={selectedUser}
            open={planManagerOpen}
            onOpenChange={setPlanManagerOpen}
            onSuccess={onRefresh}
          />
          <StartupDiscountManager
            open={discountManagerOpen}
            onOpenChange={setDiscountManagerOpen}
            userId={selectedUser.id}
            userName={selectedUser.company_name}
            currentStatus={discountStatuses[selectedUser.id] || null}
            onUpdate={handleDiscountUpdate}
          />
        </>
      )}
    </>
  );
};
