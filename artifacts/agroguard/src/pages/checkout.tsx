import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";

// For this example, we inject the Paystack SDK script dynamically
const loadPaystack = () => {
  return new Promise<void>((resolve) => {
    if ((window as any).PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

const formSchema = z.object({
  farmName: z.string().min(2, "Farm name must be at least 2 characters"),
  farmAddress: z.string().min(5, "Please enter full delivery address"),
  state: z.string().min(2, "State is required"),
  lga: z.string().min(2, "LGA is required"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  farmSizeHectares: z.coerce.number().optional(),
  cropTypes: z.string().optional(),
});

export default function CheckoutPage() {
  const [match, params] = useRoute("/checkout/:product");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const productType = params?.product === "premium" ? "premium" : "standard";
  const price = productType === "premium" ? 200000 : 160000;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmName: user?.farmName || "",
      farmAddress: user?.location || "",
      state: "",
      lga: "",
      contactPhone: user?.phone || "",
      farmSizeHectares: user?.farmSizeHectares || undefined,
      cropTypes: user?.cropTypes || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsProcessing(true);
    try {
      await loadPaystack();

      const paystack = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
        email: user?.email,
        amount: price * 100, // in kobo
        currency: "NGN",
        callback: async (response: any) => {
          // Payment complete, submit order to backend
          try {
            const token = getAuthToken();
            const res = await fetch("/api/orders/checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                productType,
                ...values,
                paystackReference: response.reference,
              }),
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Failed to place order");
            }

            toast({
              title: "Order Placed Successfully! 🎉",
              description: "Your AgroGuard hardware order is being processed.",
            });
            setLocation("/orders");
          } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Order Error",
              description: error.message,
            });
            setIsProcessing(false);
          }
        },
        onClose: () => {
          toast({
            variant: "destructive",
            title: "Payment Cancelled",
            description: "You cancelled the payment process.",
          });
          setIsProcessing(false);
        },
      });

      paystack.openIframe();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment gateway.",
      });
      setIsProcessing(false);
    }
  }

  if (!match) return null;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Checkout Form */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Delivery Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="farmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farm Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Green Acres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="farmAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Delivery Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Farm Road, Village" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Kaduna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LGA</FormLabel>
                      <FormControl>
                        <Input placeholder="Zaria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full mt-6 text-lg py-6" disabled={isProcessing}>
                {isProcessing ? "Processing..." : `Pay ₦${price.toLocaleString()}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="bg-slate-50 dark:bg-slate-900 border-2">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your hardware selection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg capitalize">AgroGuard {productType}</h3>
                  <p className="text-sm text-muted-foreground">Complete IoT Sensor Kit</p>
                </div>
                <div className="font-bold text-xl">₦{price.toLocaleString()}</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">1 Year Subscription Included</h4>
                    <p className="text-sm text-muted-foreground">Platform access is free for the first year.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Warranty Covered</h4>
                    <p className="text-sm text-muted-foreground">Standard 1-year hardware warranty included.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">Installation & Delivery</h4>
                    <p className="text-sm text-muted-foreground">A field officer will be assigned to install and activate your device.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start bg-slate-100 dark:bg-slate-800 pt-6 rounded-b-lg">
              <div className="flex justify-between w-full mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₦{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full mb-4">
                <span className="text-muted-foreground">Tax & Installation</span>
                <span className="text-green-600 font-medium">Included</span>
              </div>
              <div className="flex justify-between w-full text-xl font-bold border-t pt-4">
                <span>Total</span>
                <span>₦{price.toLocaleString()}</span>
              </div>
            </CardFooter>
          </Card>
          
          <Alert className="mt-6 border-amber-200 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Your payment is secured by Paystack. AgroGuard does not store your card details.
            </AlertDescription>
          </Alert>
        </div>

      </div>
    </div>
  );
}
