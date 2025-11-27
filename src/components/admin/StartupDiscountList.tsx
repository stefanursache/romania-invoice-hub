import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Sparkles, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { StartupDiscountManager } from "./StartupDiscountManager";

interface UserWithDiscount {
  id: string;
  company_name: string;
  email: string;
  created_at: string;
  discount_status: {
    is_eligible: boolean;
    eligibility_type: string;
    months_remaining: number;
    notes: string | null;
  } | null;
}

export function StartupDiscountList() {
  const [users, setUsers] = useState<UserWithDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
    currentStatus: any;
  } | null>(null);

  useEffect(() => {
    loadUsersWithDiscountStatus();
  }, []);

  const loadUsersWithDiscountStatus = async () => {
    setLoading(true);
    try {
      // Get all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, company_name, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get discount status for each user
      const usersWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: discountData } = await supabase.rpc(
            "get_startup_discount_eligibility",
            { _user_id: profile.id }
          );

          return {
            ...profile,
            discount_status: discountData?.[0] || null,
          };
        })
      );

      setUsers(usersWithStatus);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Eroare la încărcarea datelor", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: UserWithDiscount["discount_status"]) => {
    if (!status) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Necunoscut
        </Badge>
      );
    }

    if (status.eligibility_type === "admin_approved" && status.is_eligible) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle2 className="h-3 w-3" />
          Aprobat
        </Badge>
      );
    }

    if (status.eligibility_type === "requires_approval") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Necesită aprobare
        </Badge>
      );
    }

    if (status.eligibility_type === "expired_approval") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expirat
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        Respins
      </Badge>
    );
  };

  const getExpirationInfo = (status: UserWithDiscount["discount_status"]) => {
    if (!status || !status.is_eligible) return "-";
    
    if (status.months_remaining === 999) {
      return "Nelimitat";
    }

    return `${status.months_remaining} luni`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Caută după companie sau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Companie</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cont creat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expirare</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nu au fost găsiți utilizatori
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.created_at).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.discount_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {user.discount_status?.is_eligible && (
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        )}
                        {getExpirationInfo(user.discount_status)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {user.discount_status?.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedUser({
                            userId: user.id,
                            userName: user.company_name,
                            currentStatus: user.discount_status,
                          })
                        }
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gestionează
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total utilizatori: {users.length}</span>
          <span>
            Aprobați:{" "}
            {users.filter((u) => u.discount_status?.is_eligible).length}
          </span>
        </div>
      </div>

      {selectedUser && (
        <StartupDiscountManager
          open={true}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          currentStatus={selectedUser.currentStatus}
          onUpdate={loadUsersWithDiscountStatus}
        />
      )}
    </>
  );
}
