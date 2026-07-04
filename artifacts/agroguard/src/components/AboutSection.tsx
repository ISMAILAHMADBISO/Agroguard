import { companyInfo } from "@/data/site-config";
import { Target, Eye, Leaf } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
            About Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            About AgroGuard
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {companyInfo.about}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Mission Card */}
          <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <Target className="h-20 w-20 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                {companyInfo.mission}
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-4 right-4 opacity-10">
              <Eye className="h-20 w-20 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5">
                <Eye className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                {companyInfo.vision}
              </p>
            </div>
          </div>
        </div>

        {/* Core Values Strip */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {["Innovation", "Sustainability", "Empowerment", "Data-Driven", "Climate Resilience"].map(
            (value) => (
              <div
                key={value}
                className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground"
              >
                <Leaf className="h-3.5 w-3.5 text-primary" />
                {value}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
