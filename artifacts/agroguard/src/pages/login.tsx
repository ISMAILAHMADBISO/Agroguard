/**
 * Login page — staff and farmer credential authentication.
 * Split layout: sliding branded imagery on the left, sign-in form on the right.
 * Sends POST /api/auth/login and stores the session cookie.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, homePathForUser } from "@/context/auth";
import { AuthCarousel } from "@/components/auth-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/context/language";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      setLocation(u.mustChangePassword ? "/change-password" : homePathForUser(u));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:min-h-0 lg:fixed lg:inset-0 lg:overflow-hidden flex flex-col lg:flex-row relative">
      {/* Absolute Language Switcher */}
      <div className="absolute top-4 right-4 z-50 bg-background/50 backdrop-blur-sm rounded-lg border shadow-sm">
        <LanguageSwitcher />
      </div>

      {/* Left: sliding imagery (hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/2 lg:relative h-[300px] lg:h-full shrink-0 overflow-hidden bg-sidebar">
        <AuthCarousel />
      </div>

      {/* Right: sign-in form */}
      <div className="flex-1 flex bg-gradient-to-br from-green-50 via-background to-emerald-50 px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md m-auto space-y-6 pt-10 lg:pt-0">
          {/* Brand (mobile only — carousel carries it on desktop) */}
          <div className="text-center lg:hidden">
            <div className="flex items-center justify-center mb-4">
              <img src="/agroguard-logo.png" alt="AgroGuard" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-primary">AgroGuard Limited</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("Agricultural IoT Platform")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("Welcome back")}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t("Sign in with your staff or farmer credentials to access the platform.")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email Address")}</Label>
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
              <Label htmlFor="password">{t("Password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
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
              {loading ? t("Signing in...") : t("Sign In")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {t("Don't have an account?")}{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t("Sign up as a farmer")}
            </Link>
          </p>

          
          <p className="text-center text-xs text-muted-foreground">
            <a href="/" className="hover:text-primary transition-colors">{t("Back to homepage")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
