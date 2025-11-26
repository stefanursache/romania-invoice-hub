import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useTranslation } from "react-i18next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Building2,
  ChevronDown,
  Check,
  Home
} from "lucide-react";
import { toast } from "sonner";

interface WorkspaceOption {
  id: string;
  name: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<string | null>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

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
    setActiveWorkspaceId(activeWorkspaceOwner);
    
    if (roleData?.role === "accountant") {
      // Load all available workspaces for accountant
      await loadAccountantWorkspaces(userId);
      
      if (activeWorkspaceOwner) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name")
          .eq("id", activeWorkspaceOwner)
          .single();
        
        setViewingCompany(profile?.company_name || null);
      }
    }
  };

  const loadAccountantWorkspaces = async (userId: string) => {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_owner_id")
      .eq("member_user_id", userId);

    if (!memberships) return;

    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, company_name")
          .eq("id", membership.workspace_owner_id)
          .single();

        return profile ? { id: profile.id, name: profile.company_name } : null;
      })
    );

    setAvailableWorkspaces(workspaces.filter((w): w is WorkspaceOption => w !== null));
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    sessionStorage.setItem("active_workspace_owner", workspaceId);
    setActiveWorkspaceId(workspaceId);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("id", workspaceId)
      .single();
    
    setViewingCompany(profile?.company_name || null);
    toast.success(`${t('common.viewing')}: ${profile?.company_name}`);
    
    // Reload current page to refresh data
    window.location.reload();
  };

  const handleBackToAccountantDashboard = () => {
    sessionStorage.removeItem("active_workspace_owner");
    setViewingCompany(null);
    setActiveWorkspaceId(null);
    navigate("/accountant-dashboard");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t('nav.signOutError'));
    } else {
      toast.success(t('nav.signOutSuccess'));
      navigate("/auth");
    }
  };

  // Filter navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { 
        href: userRole === "accountant" ? "/accountant-dashboard" : "/dashboard", 
        icon: LayoutDashboard, 
        label: userRole === "accountant" ? t('nav.myCompanies') : t('nav.dashboard')
      },
      { href: "/clients", icon: Users, label: t('nav.clients') },
      { href: "/invoices", icon: FileText, label: t('nav.invoices') },
      { href: "/expenses", icon: Receipt, label: t('nav.expenses') },
      { href: "/chart-of-accounts", icon: BookOpen, label: t('nav.chartOfAccounts') },
      { href: "/reports", icon: FileBarChart, label: t('nav.reports') },
    ];

    // Only show Team for business owners (not accountants)
    if (userRole !== "accountant") {
      baseItems.push({ href: "/team", icon: Users, label: t('nav.team') });
    }

    // Settings always shown (for personal account settings)
    baseItems.push({ href: "/settings", icon: Settings, label: t('nav.settings') });

    return baseItems;
  };

  const navItems = getNavItems();

  const getPageName = (path: string) => {
    const item = navItems.find(nav => nav.href === path);
    return item?.label || t('common.page');
  };

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
            
            {userRole === "accountant" && availableWorkspaces.length > 0 && (
              <div className="mt-3 ml-[52px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" size="sm" className="w-full justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {viewingCompany || t('breadcrumb.switchCompany')}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-[240px] bg-popover z-50"
                  >
                    <DropdownMenuLabel>{t('breadcrumb.myCompanies')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableWorkspaces.map((workspace) => (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{workspace.name}</span>
                          </div>
                          {activeWorkspaceId === workspace.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleBackToAccountantDashboard}
                      className="cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('accountantDashboard.yourCompanies')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              {t('accountantDashboard.yourCompanies')}
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

          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 justify-start gap-3"
            >
              <LogOut className="h-5 w-5" />
              {t('nav.signOut')}
            </Button>
            {userRole === "accountant" && <NotificationBadge />}
            <LanguageToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Breadcrumb Navigation for Accountants */}
        {userRole === "accountant" && (
          <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="p-4 lg:px-8 lg:py-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/accountant-dashboard" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {t('breadcrumb.myCompanies')}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  
                  {viewingCompany && activeWorkspaceId && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground">
                            <Building2 className="h-4 w-4" />
                            {viewingCompany}
                            <ChevronDown className="h-3 w-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[280px] bg-popover z-50">
                            <DropdownMenuLabel>{t('breadcrumb.switchCompany')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableWorkspaces.map((workspace) => (
                              <DropdownMenuItem
                                key={workspace.id}
                                onClick={() => handleSwitchWorkspace(workspace.id)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span className="truncate">{workspace.name}</span>
                                  </div>
                                  {activeWorkspaceId === workspace.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </BreadcrumbItem>
                      
                      {location.pathname !== "/dashboard" && location.pathname !== "/accountant-dashboard" && (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>{getPageName(location.pathname)}</BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      )}
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        )}
        
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