import { Link } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ShopPage() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">AgroGuard Hardware</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Equip your farm with enterprise-grade IoT sensors. Monitor soil health, detect threats early, and automate your workflow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Standard Tier */}
        <Card className="flex flex-col border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">AgroGuard Standard</CardTitle>
            <CardDescription>Perfect for small to medium farms starting their digital transformation.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-4xl font-bold mb-6">₦160,000</div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Core Sensors (Moisture, Temp, Humidity)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Basic Alerts & Notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Standard Installation Included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>1 Year Warranty</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/checkout/standard" className="w-full">
              <Button className="w-full" variant="outline">Purchase Standard</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Premium Tier */}
        <Card className="flex flex-col border-2 border-primary shadow-lg shadow-primary/10 relative">
          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 uppercase tracking-wider">
              Recommended
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">AgroGuard Premium</CardTitle>
            <CardDescription>Comprehensive monitoring with 7-in-1 advanced sensors for commercial operations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-4xl font-bold mb-6 text-primary">₦200,000</div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span className="font-medium">Everything in Standard, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>7-in-1 Soil Sensor (N, P, K, pH, EC)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Fire & Heavy Rain Detection</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority Installation & Setup</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>3 Year Extended Warranty</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/checkout/premium" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                Purchase Premium
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
