import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  member_user_id: string;
  role: string;
  invited_at: string;
  profiles: {
    company_name: string;
  };
}

export default function Team() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is an accountant
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    // Accountants should not access team management
    if (roleData?.role === "accountant") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Accountants cannot manage team members. This is for business owners only.",
      });
      navigate("/accountant-dashboard");
      return;
    }

    setCurrentUserId(session.user.id);
    loadMembers();
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          id,
          member_user_id,
          role,
          invited_at
        `)
        .order("invited_at", { ascending: false });

      if (error) throw error;

      // Fetch profile names separately
      if (data && data.length > 0) {
        const userIds = data.map(m => m.member_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, company_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.company_name]));
        
        const membersWithProfiles = data.map(member => ({
          ...member,
          profiles: {
            company_name: profileMap.get(member.member_user_id) || "Unknown"
          }
        }));
        
        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      // First, check if user exists with this email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email, company_name")
        .eq("email", email)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        toast({
          variant: "destructive",
          title: "User not found",
          description: "No accountant exists with this email. They need to sign up first with an accountant account.",
        });
        return;
      }

      // Add member to workspace
      const { error } = await supabase
        .from("workspace_members")
        .insert({
          workspace_owner_id: currentUserId,
          member_user_id: userData.id,
          role: "accountant",
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            variant: "destructive",
            title: "Already invited",
            description: "This user is already a member of your workspace.",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: `${userData.company_name || userData.email} has been added to your team!`,
      });

      setEmail("");
      loadMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });

      loadMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Invite accountants to collaborate with read-only access to your invoices and data.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Accountant
            </CardTitle>
            <CardDescription>
              Enter the email address of an accountant who already has an account. They'll get immediate read-only access to your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-4">
              <Input
                type="email"
                placeholder="accountant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
                disabled={inviting}
              />
              <Button type="submit" disabled={inviting || !email.trim()}>
                <UserPlus className="w-4 h-4 mr-2" />
                {inviting ? "Adding..." : "Add Accountant"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {members.length === 0 ? "No team members yet" : `${members.length} team member(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No team members yet. Invite an accountant to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{member.profiles?.company_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {new Date(member.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
