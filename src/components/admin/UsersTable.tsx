import { useState } from "react";
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
import { Edit, FileText, Users } from "lucide-react";
import { UserPlanManager } from "./UserPlanManager";

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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Companie</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Facturi Luna Asta</TableHead>
              <TableHead>Membri Echipă</TableHead>
              <TableHead>Data Înregistrare</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Niciun utilizator găsit
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const limits = getPlanLimits(user.payment_plan);
                const invoiceUsage = limits.invoices === "∞" ? 0 : (user.invoices_this_month / Number(limits.invoices)) * 100;
                const memberUsage = limits.members === "∞" ? 0 : ((user.member_count + 1) / Number(limits.members)) * 100;

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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlan(user)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editează Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <UserPlanManager
          user={selectedUser}
          open={planManagerOpen}
          onOpenChange={setPlanManagerOpen}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};
