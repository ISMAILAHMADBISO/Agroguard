import { trustPoints } from "@/data/site-config";
import {
  Activity,
  ShieldCheck,
  Droplets,
  CloudSun,
  Thermometer,
  Bell,
  LayoutDashboard,
  Lock,
  Globe,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Activity,
  ShieldCheck,
  Droplets,
  CloudSun,
  Thermometer,
  Bell,
  LayoutDashboard,
  Lock,
  Globe,
};

export default function TrustSection() {
  return (
    <section id="trust" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
            Why Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Farmers Trust AgroGuard
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From real-time monitoring to AI-powered insights — every feature is built for the
            realities of African agriculture.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {trustPoints.map((point, index) => {
            const Icon = iconMap[point.icon] ?? Activity;
            return (
              <div
                key={index}
                className="group bg-card p-6 rounded-xl border border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
