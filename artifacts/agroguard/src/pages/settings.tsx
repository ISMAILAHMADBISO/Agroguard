import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useLanguage } from "@/context/language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, useGetFarmer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, Bell, Globe, Phone, Mail } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isFarmer = user?.userType === "farmer";

  // Fetch farmer data to get preferences if user is a farmer
  const { data: farmer, isLoading: farmerLoading } = useGetFarmer(user?.id ?? 0, {
    query: { enabled: isFarmer && !!user?.id },
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
    inApp: true,
    weeklyTips: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (farmer?.notificationPreferences) {
      setNotificationPrefs({
        email: farmer.notificationPreferences.email ?? true,
        sms: farmer.notificationPreferences.sms ?? false,
        inApp: farmer.notificationPreferences.inApp ?? true,
        weeklyTips: farmer.notificationPreferences.weeklyTips ?? true,
      });
    }
  }, [farmer]);

  const savePreferences = async () => {
    if (!isFarmer || !user?.id) return;
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/farmers/${user.id}/preferences`, {
        notificationPreferences: notificationPrefs
      });
      toast({ title: "Preferences saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["farmers", user.id] });
    } catch (err) {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" /> Settings
        </h2>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-blue-500" /> Language Preferences
            </CardTitle>
            <CardDescription>Choose your preferred language for the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Language</Label>
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="ar">Arabic (RTL)</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Translates the interface into your chosen language. Currently applied language is active immediately.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences (Farmers only for now) */}
        {isFarmer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-amber-500" /> Notification Settings
              </CardTitle>
              <CardDescription>Manage how we communicate with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {farmerLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive critical alerts via email</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email}
                      onCheckedChange={(c) => setNotificationPrefs((prev) => ({ ...prev, email: c }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.sms}
                      onCheckedChange={(c) => setNotificationPrefs((prev) => ({ ...prev, sms: c }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show alerts on the dashboard</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.inApp}
                      onCheckedChange={(c) => setNotificationPrefs((prev) => ({ ...prev, inApp: c }))}
                    />
                  </div>
                  
                  <div className="border-t pt-4"></div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Farming Tips</Label>
                      <p className="text-sm text-muted-foreground">Get agronomy advice and weather tips every Monday</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.weeklyTips}
                      onCheckedChange={(c) => setNotificationPrefs((prev) => ({ ...prev, weeklyTips: c }))}
                    />
                  </div>

                  <Button className="w-full mt-4" onClick={savePreferences} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
