import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Leaf, Droplets, Sun, ShieldCheck, MapPin, Mail, Phone } from "lucide-react";

export default function LandingPage() {
  const { data: stats } = useGetDashboardStats();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl text-primary">AgroGuard Limited</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#team" className="hover:text-primary transition-colors">Team</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Platform Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/farm-bg.jpg" alt="Nigerian Farmland" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          </div>
          <div className="container relative z-10 mx-auto px-4 text-center md:text-left">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
                Enterprise Agricultural Intelligence for Nigeria
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
                Empowering smallholder farmers with real-time IoT monitoring, AI-driven crop recommendations, and precision farm management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Access Platform
                </Link>
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats?.totalFarmers || "5,000+"}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Farmers Network</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats?.totalDevices || "12,000+"}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Active IoT Devices</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats?.totalReadingsToday ? (stats.totalReadingsToday / 1000).toFixed(1) + 'k' : "1M+"}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Daily Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Platform Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Precision Agriculture at Scale</h2>
              <p className="text-muted-foreground">Built for the realities of Nigerian farming. Our platform combines rugged hardware with advanced analytics.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Droplets className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Soil Monitoring</h3>
                <p className="text-muted-foreground">Track soil moisture and temperature minute-by-minute. Optimize irrigation and prevent crop stress before it happens.</p>
              </div>
              <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Disease Prediction</h3>
                <p className="text-muted-foreground">Early warning systems for blights and pests using localized weather data and machine learning models.</p>
              </div>
              <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Actionable Insights</h3>
                <p className="text-muted-foreground">Receive SMS and WhatsApp alerts in local languages with specific recommendations for intervention.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Leadership Team</h2>
              <p className="text-muted-foreground">Combining agricultural expertise with deep technology experience.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                  <div className="text-4xl text-muted-foreground font-semibold">AO</div>
                </div>
                <h3 className="text-lg font-bold text-foreground">Dr. Amina Okonkwo</h3>
                <p className="text-primary font-medium mb-2">CEO & Co-Founder</p>
                <p className="text-sm text-muted-foreground">Agricultural technology strategist with 15 years in Nigerian agri-development.</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                  <div className="text-4xl text-muted-foreground font-semibold">CA</div>
                </div>
                <h3 className="text-lg font-bold text-foreground">Chukwuemeka Adeyemi</h3>
                <p className="text-primary font-medium mb-2">CTO & Co-Founder</p>
                <p className="text-sm text-muted-foreground">IoT systems engineer specializing in embedded systems and cloud infrastructure.</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                  <div className="text-4xl text-muted-foreground font-semibold">FA</div>
                </div>
                <h3 className="text-lg font-bold text-foreground">Fatima Al-Hassan</h3>
                <p className="text-primary font-medium mb-2">Head of AI & Data Science</p>
                <p className="text-sm text-muted-foreground">Machine learning specialist focused on precision agriculture and climate modeling.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar py-12 border-t border-sidebar-border">
        <div className="container mx-auto px-4 text-center md:text-left grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-8 w-8 object-contain opacity-80" />
              <span className="font-bold text-xl text-sidebar-foreground">AgroGuard Limited</span>
            </div>
            <p className="text-sidebar-foreground/70 max-w-md mx-auto md:mx-0">
              Securing the future of Nigerian agriculture through data-driven precision and empowering farmers everywhere.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sidebar-foreground mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-sidebar-foreground/70">
              <li className="flex items-start gap-2 justify-center md:justify-start">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>Jamaa, Zaria, Kaduna State, Nigeria</span>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@agroguard.tech" className="hover:text-primary transition-colors">info@agroguard.tech</a>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+2347089459265" className="hover:text-primary transition-colors">+234 708 945 9265</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sidebar-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sidebar-foreground/70">
              <li><Link href="/login" className="hover:text-primary transition-colors">Platform Login</Link></li>
              <li><a href="#features" className="hover:text-primary transition-colors">IoT Devices</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Analytics</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sidebar-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sidebar-foreground/70">
              <li><a href="#team" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="mailto:info@agroguard.tech" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-10 pt-6 border-t border-sidebar-border/60 text-center text-sm text-sidebar-foreground/60">
          &copy; {new Date().getFullYear()} AgroGuard Limited. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
