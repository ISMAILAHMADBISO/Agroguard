/**
 * Signup page — public farmer self-registration.
 * Split layout mirroring the login page: branded carousel + registration form.
 * On success the farmer is logged straight in and sent to their farm overview.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, homePathForUser, type FarmerSignupInput } from "@/context/auth";
import { AuthCarousel } from "@/components/auth-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/context/language";

export default function SignupPage() {
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    farmName: "",
    farmSizeHectares: "",
    cropTypes: "",
    whatsappNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const payload: FarmerSignupInput = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: form.location,
        farmName: form.farmName || undefined,
        cropTypes: form.cropTypes || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        farmSizeHectares: form.farmSizeHectares ? Number(form.farmSizeHectares) : undefined,
      };
      const u = await signup(payload);
      setLocation(homePathForUser(u));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:min-h-0 lg:fixed lg:inset-0 lg:overflow-hidden flex flex-col lg:flex-row">
      {/* Left: sliding imagery (hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/2 lg:relative h-[300px] lg:h-full shrink-0 overflow-hidden bg-sidebar">
        <AuthCarousel />
      </div>

      {/* Absolute Language Switcher */}
      <div className="absolute top-4 right-4 z-50 bg-background/50 backdrop-blur-sm rounded-lg border shadow-sm">
        <LanguageSwitcher />
      </div>

      {/* Right: registration form */}
      <div className="flex-1 flex bg-gradient-to-br from-green-50 via-background to-emerald-50 px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md m-auto space-y-6 pt-10 lg:pt-0">
          <div className="text-center lg:hidden">
            <div className="flex items-center justify-center mb-4">
              <img src="/agroguard-logo.png" alt="AgroGuard" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-primary">AgroGuard Limited</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("Agricultural IoT Platform")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("Create your farmer account")}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t("Register to monitor your farm, receive alerts and get AI guidance.")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Full Name")}</Label>
              <Input id="name" value={form.name} onChange={set("name")} required placeholder="Emeka Chukwu" className="h-11" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("Email Address")}</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" placeholder="you@farm.ng" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone Number")}</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} required placeholder="+234 803 000 0000" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <Input id="password" type="password" value={form.password} onChange={set("password")} required autoComplete="new-password" placeholder="At least 8 characters" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t("Location (State / LGA)")}</Label>
              <Input id="location" value={form.location} onChange={set("location")} required placeholder="Zaria, Kaduna State" className="h-11" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmName">{t("Farm Name")} <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="farmName" value={form.farmName} onChange={set("farmName")} placeholder="Green Valley Farm" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmSizeHectares">{t("Farm Size (ha)")} <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="farmSizeHectares" type="number" min="0" step="0.1" value={form.farmSizeHectares} onChange={set("farmSizeHectares")} placeholder="2.5" className="h-11" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cropTypes">{t("Crops")} <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="cropTypes" value={form.cropTypes} onChange={set("cropTypes")} placeholder="Maize, Tomato" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">{t("WhatsApp")} <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="whatsappNumber" value={form.whatsappNumber} onChange={set("whatsappNumber")} placeholder="+234 803 000 0000" className="h-11" />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2.5">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? t("Creating account...") : t("Create Account")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {t("Already have an account?")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("Sign in")}
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
