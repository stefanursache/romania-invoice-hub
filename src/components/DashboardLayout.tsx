import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  FileBarChart,
  BookOpen,
  Receipt,
  ArrowLeft,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          // Load user role when session changes
          setTimeout(() => {
            loadUserRole(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    setUserRole(roleData?.role || null);

    // Check if viewing another company's workspace
    const activeWorkspaceOwner = sessionStorage.getItem("active_workspace_owner");
    if (activeWorkspaceOwner && roleData?.role === "accountant") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", activeWorkspaceOwner)
        .single();
      
      setViewingCompany(profile?.company_name || null);
    }
  };

  const handleBackToAccountantDashboard = () => {
    sessionStorage.removeItem("active_workspace_owner");
    setViewingCompany(null);
    navigate("/accountant-dashboard");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Eroare la deconectare");
    } else {
      toast.success("Deconectat cu succes");
      navigate("/auth");
    }
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/clients", icon: Users, label: "Clienți" },
    { href: "/invoices", icon: FileText, label: "Facturi" },
    { href: "/expenses", icon: Receipt, label: "Cheltuieli" },
    { href: "/chart-of-accounts", icon: BookOpen, label: "Plan de Conturi" },
    { href: "/team", icon: Users, label: "Echipă" },
    { href: "/reports", icon: FileBarChart, label: "Rapoarte" },
    { href: "/settings", icon: Settings, label: "Setări" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border shadow-lg"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">SmartInvoice</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">{user?.email}</p>
            
            {userRole === "accountant" && viewingCompany && (
              <div className="mt-3 ml-[52px]">
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {viewingCompany}
                </Badge>
              </div>
            )}
          </div>

          {userRole === "accountant" && viewingCompany && (
            <Button
              onClick={handleBackToAccountantDashboard}
              variant="outline"
              className="mb-4 justify-start gap-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la companiile mele
            </Button>
          )}

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Deconectare
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </div>
  );
};

export default DashboardLayout;