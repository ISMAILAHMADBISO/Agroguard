import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Star, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFarmerQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";

let openModalFn: (() => void) | null = null;

export const openPricingModal = () => {
  if (openModalFn) openModalFn();
};

const PLANS = [
  {
    name: "Free",
    price: "₦0",
    description: "New users",
    features: ["5 AI chatbot questions/month", "2 disease detections/month", "Basic weather information"],
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: "Basic",
    price: "₦1,000",
    period: "/month",
    description: "Small farmers",
    features: ["100 AI questions", "20 disease detections", "Crop advice"],
    buttonText: "Select Basic",
  },
  {
    name: "Standard",
    price: "₦2,500",
    period: "/month",
    description: "Active farmers",
    features: ["Unlimited AI chat", "100 disease detections", "Weather forecasts", "Crop recommendations", "Farm records"],
    buttonText: "Select Standard",
  },
  {
    name: "Premium",
    price: "₦5,000",
    period: "/month",
    description: "Commercial farmers & cooperatives",
    features: ["Everything in Standard", "Priority support", "Advanced reports", "SMS alerts", "More disease detections", "Early access to new features"],
    buttonText: "Select Premium",
    highlighted: true,
  },
];

export function PricingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    openModalFn = () => setIsOpen(true);
    return () => { openModalFn = null; };
  }, []);

  const handleSelectPlan = async (planName: string) => {
    // Simulated Paystack Payment Flow for the Pitch
    setIsSimulatingPayment(true);
    
    // Simulate payment loading
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const res = await fetch("/api/farmers/me/upgrade", { method: "POST" });
      if (!res.ok) throw new Error("Upgrade failed");
      
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: getGetFarmerQueryKey(user.id) });
      }
      
      toast({ 
        title: `Payment Successful!`, 
        description: `You are now upgraded to the ${planName} plan.` 
      });
      setIsOpen(false);
    } catch {
      toast({ title: "Payment failed", variant: "destructive" });
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Upgrade your farm to unlock powerful AI features and maximize your yield.
          </DialogDescription>
        </DialogHeader>
        
        {isSimulatingPayment ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-medium">Processing Payment securely via Paystack...</h3>
            <p className="text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Please do not close this window
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.name} 
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.highlighted 
                    ? "border-amber-500 shadow-md relative bg-amber-50/30" 
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" /> BEST VALUE
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="font-bold text-xl">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-6 flex items-baseline text-3xl font-extrabold">
                  {plan.price}
                  {plan.period && <span className="text-sm font-medium text-muted-foreground ml-1">{plan.period}</span>}
                </div>
                
                <ul className="space-y-3 mb-6 flex-1 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => !plan.disabled && handleSelectPlan(plan.name)}
                  disabled={plan.disabled}
                  variant={plan.highlighted ? "default" : "outline"}
                  className={plan.highlighted ? "w-full bg-amber-500 hover:bg-amber-600 text-white" : "w-full"}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
