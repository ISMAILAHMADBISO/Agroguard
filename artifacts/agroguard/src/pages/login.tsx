/**
 * Login page — staff credential authentication.
 * Sends POST /api/auth/login and stores the session cookie.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-emerald-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/agroguard-logo.png"
              alt="AgroGuard"
              className="h-16 w-16 rounded-full object-cover ring-4 ring-primary/20 shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary">AgroGuard Limited</h1>
          <p className="text-muted-foreground text-sm mt-1">Agricultural IoT Platform</p>
        </div>

        <Card className="shadow-xl border-0 ring-1 ring-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Staff Login</CardTitle>
            <CardDescription>
              Sign in with your staff credentials to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@agroguard.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2.5">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3 font-semibold uppercase tracking-wider">
                Demo Credentials
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  { role: "Admin", email: "amina.okonkwo@agroguard.ng" },
                  { role: "Agronomist", email: "fatima.alhassan@agroguard.ng" },
                  { role: "Field Officer", email: "ibrahim.garba@agroguard.ng" },
                  { role: "Support", email: "support@agroguard.ng" },
                ].map(({ role, email: e }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(e); setPassword("AgroGuard2024!"); }}
                    className="w-full flex justify-between items-center bg-muted hover:bg-muted/70 rounded px-3 py-1.5 transition-colors cursor-pointer text-left"
                  >
                    <span className="font-semibold text-foreground">{role}</span>
                    <span className="text-muted-foreground truncate ml-2">{e}</span>
                  </button>
                ))}
                <p className="text-center pt-1 text-muted-foreground">
                  Password: <span className="font-mono font-semibold text-foreground">AgroGuard2024!</span>
                  <span className="ml-1 text-xs">(click any row to fill)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">Back to homepage</a>
        </p>
      </div>
    </div>
  );
}
