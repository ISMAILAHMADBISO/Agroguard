/**
 * Change password page.
 * Shown when a user must change a temporary password, or voluntarily from the menu.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth, homePathForUser } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mustChange = user?.mustChangePassword ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setLocation(user ? homePathForUser({ ...user, mustChangePassword: false }) : "/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-emerald-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/agroguard-logo.png" alt="AgroGuard" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-primary">AgroGuard Limited</h1>
        </div>

        <Card className="shadow-xl border-0 ring-1 ring-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">
              {mustChange ? "Set a New Password" : "Change Password"}
            </CardTitle>
            <CardDescription>
              {mustChange
                ? "For your security, please replace your temporary password before continuing."
                : "Update the password you use to sign in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">
                  {mustChange ? "Temporary Password" : "Current Password"}
                </Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2.5">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? "Saving..." : "Update Password"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-11 text-base"
                disabled={loading}
                onClick={async () => {
                  await logout();
                  setLocation("/login");
                }}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
