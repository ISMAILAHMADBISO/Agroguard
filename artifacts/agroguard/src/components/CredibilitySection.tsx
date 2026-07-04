import { credibilityItems } from "@/data/site-config";
import { Award, Rocket, Handshake, Newspaper } from "lucide-react";

const typeIconMap: Record<string, React.ElementType> = {
  incubation: Rocket,
  award: Award,
  event: Newspaper,
  partner: Handshake,
};

const typeLabelMap: Record<string, string> = {
  incubation: "Incubation Programme",
  award: "Award & Recognition",
  event: "Event & Pitch",
  partner: "Strategic Partnership",
};

export default function CredibilitySection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
            Recognition
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Awards, Programs & Partners
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            AgroGuard is recognized by leading institutions and innovation programs across Africa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {credibilityItems.map((item, index) => {
            const Icon = typeIconMap[item.type] ?? Award;
            const label = typeLabelMap[item.type] ?? "Recognition";
            return (
              <div
                key={index}
                className="group relative bg-card p-6 rounded-xl border border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
                  {label}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Partner Logos Placeholder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-6">
            Trusted By & Collaborating With
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
            {["UNDP", "NIGCOMSAT", "University of Lagos", "NITDA"].map(
              (name) => (
                <div
                  key={name}
                  className="px-6 py-3 border border-border rounded-lg bg-muted/50 text-sm font-semibold text-muted-foreground"
                >
                  {name}
                </div>
              )
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Partner logos will be displayed here as collaborations are formalized.
          </p>
        </div>
      </div>
    </section>
  );
}
