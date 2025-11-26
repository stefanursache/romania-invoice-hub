import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Check, X, Building2, Calculator } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Parola trebuie să conțină minimum 8 caractere")
  .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
  .regex(/[a-z]/, "Parola trebuie să conțină cel puțin o literă mică")
  .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră");

const emailSchema = z.string().email("Email invalid");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userRole, setUserRole] = useState<"business" | "accountant">("business");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (pwd: string) => {
    const result = passwordSchema.safeParse(pwd);
    if (!result.success) {
      return result.error.errors.map(err => err.message);
    }
    return [];
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!isLogin) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        toast.error("Email invalid");
        setLoading(false);
        return;
      }

      // Validate password on signup
      if (!isLogin) {
        const pwdErrors = validatePassword(password);
        if (pwdErrors.length > 0) {
          toast.error("Parola nu îndeplinește cerințele de securitate");
          setLoading(false);
          return;
        }
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check user role to redirect appropriately
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();
        
        toast.success("Autentificare reușită!");
        
        if (roleData?.role === "accountant") {
          navigate("/accountant-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              company_name: userRole === "business" ? companyName : undefined,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) throw error;
        
        // If session exists (auto-confirm enabled), create user role and redirect
        if (data.session && data.user) {
          // Insert user role
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: userRole,
            });
          
          if (roleError) {
            console.error("Error creating user role:", roleError);
            toast.error("Eroare la crearea contului. Te rugăm să încerci din nou.");
            // Sign out the user since role creation failed
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          
          // Verify role was created successfully
          const { data: verifyRole, error: verifyError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();
          
          if (verifyError || !verifyRole) {
            console.error("Error verifying user role:", verifyError);
            toast.error("Eroare la crearea contului. Te rugăm să încerci din nou.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          
          toast.success("Cont creat cu succes!");
          
          // Small delay to ensure database commit
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (userRole === "accountant") {
            navigate("/accountant-dashboard");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Email confirmation required
          toast.success("Cont creat cu succes! Verifică emailul pentru confirmare.");
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "A apărut o eroare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            SmartInvoice
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Intră în cont" : "Creează un cont nou"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-3">
                  <Label>Tip utilizator</Label>
                  <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as "business" | "accountant")}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="business" id="business" />
                      <Label htmlFor="business" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Afacere / PFA</p>
                          <p className="text-sm text-muted-foreground">Emite facturi și gestionează clienți</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="accountant" id="accountant" />
                      <Label htmlFor="accountant" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Calculator className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">Contabil</p>
                          <p className="text-sm text-muted-foreground">Lucrează pentru multiple companii</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {userRole === "business" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Nume companie</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Ex: SRL Consulting"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplu.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parolă</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && password && (
                <div className="mt-3 space-y-2 text-sm">
                  <PasswordRequirement met={password.length >= 8} text="Minimum 8 caractere" />
                  <PasswordRequirement met={/[A-Z]/.test(password)} text="O literă mare" />
                  <PasswordRequirement met={/[a-z]/.test(password)} text="O literă mică" />
                  <PasswordRequirement met={/[0-9]/.test(password)} text="O cifră" />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Autentificare" : "Creare cont"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Nu ai cont? Înregistrează-te" : "Ai cont deja? Autentifică-te"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground" />
    )}
    <span className={met ? "text-green-500" : "text-muted-foreground"}>{text}</span>
  </div>
);

export default Auth;