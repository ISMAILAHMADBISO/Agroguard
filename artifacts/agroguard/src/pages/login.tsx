import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/agroguard-logo.png" alt="AgroGuard" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-bold text-primary">AgroGuard Limited</span>
          </div>
          <p className="text-muted-foreground text-sm">Agricultural IoT Platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Platform Login</CardTitle>
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
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">Demo Credentials</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between bg-muted rounded px-3 py-1.5">
                  <span className="font-medium">Admin</span>
                  <span>amina.okonkwo@agroguard.ng</span>
                </div>
                <div className="flex justify-between bg-muted rounded px-3 py-1.5">
                  <span className="font-medium">Agronomist</span>
                  <span>fatima.alhassan@agroguard.ng</span>
                </div>
                <div className="flex justify-between bg-muted rounded px-3 py-1.5">
                  <span className="font-medium">Field Officer</span>
                  <span>ibrahim.garba@agroguard.ng</span>
                </div>
                <p className="text-center pt-1">Password for all: <span className="font-mono font-semibold text-foreground">AgroGuard2024!</span></p>
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
