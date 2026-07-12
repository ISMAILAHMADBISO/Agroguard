import { Link } from "wouter";
import { useState } from "react";
import {
  Leaf,
  Droplets,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Cpu,
  Gauge,
  Thermometer,
  FlaskConical,
  Battery,
  Package,
  Check,
  X,
  Quote,
  Radio,
  Cloud,
  Brain,
  Bell,
  TrendingUp,
  CalendarCheck,
  Clock,
  Send,
  ChevronRight,
  Menu,
} from "lucide-react";
import { ProductCarousel } from "@/components/product-carousel";
import AchievementsSection from "@/components/AchievementsSection";
import AboutSection from "@/components/AboutSection";
import TrustSection from "@/components/TrustSection";
import AnimatedCounter from "@/components/AnimatedCounter";
import SocialIcons from "@/components/SocialIcons";
import { impactCounters, customerJourneySteps, socialLinks, businessHours } from "@/data/site-config";
import ceoPhoto from "@assets/ceo_1780575358267.jpeg";
import ctoPhoto from "@assets/usmanh_1780575358268.jpeg";
import cooPhoto from "@assets/ladan_1780575358269.jpeg";

/* Icon lookup for the customer journey steps */
const journeyIconMap: Record<string, React.ElementType> = {
  Package, Radio, Cloud, Brain, Bell, TrendingUp,
};

export default function LandingPage() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactType, setContactType] = useState("demo");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      contactType === "demo" ? "Demo Request" : contactType === "pilot" ? "Pilot Request" : "General Enquiry"
    );
    const body = encodeURIComponent(
      `Name: ${contactName}\nEmail: ${contactEmail}\nType: ${contactType}\n\n${contactMessage}`
    );
    window.open(`mailto:${socialLinks.email}?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl text-primary">AgroGuard Limited</span>
          </div>
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#product" className="hover:text-primary transition-colors">Product</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#trust" className="hover:text-primary transition-colors">Why Us</a>
            <a href="#team" className="hover:text-primary transition-colors">Team</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Get Started
            </Link>
            <button 
              className="lg:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-b border-border absolute w-full left-0 top-16 shadow-lg pb-4">
            <nav className="flex flex-col px-4 pt-2 space-y-4 text-sm font-medium">
              <a href="#about" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#features" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#product" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Product</a>
              <a href="#pricing" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#how-it-works" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
              <a href="#trust" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Why Us</a>
              <a href="#team" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Team</a>
              <a href="#contact" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <div className="pt-2 border-t flex flex-col gap-4">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ──────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/farm-bg.jpg" alt="Nigerian Farmland" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          </div>
          <div className="container relative z-10 mx-auto px-4 text-center md:text-left">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
                Enterprise Agricultural Intelligence for Nigeria
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
                Empowering smallholder farmers with real time IoT monitoring, AI driven crop recommendations, and precision farm management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a href="#contact" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  <CalendarCheck className="h-5 w-5 mr-2" />
                  Book a Demo
                </a>
                <a href="#contact" className="inline-flex h-12 items-center justify-center rounded-md bg-white/10 px-8 text-base font-medium text-white border border-white/20 shadow backdrop-blur transition-colors hover:bg-white/20">
                  Request a Pilot
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Impact Stats ──────────────────────────────────────────────── */}
        <section className="py-14 bg-white border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {impactCounters.map((counter) => (
                <div key={counter.label} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    <AnimatedCounter value={counter.value} suffix={counter.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                    {counter.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────────────────────────────────── */}
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
                <p className="text-muted-foreground">Readings and alerts reach the farmer on their AgroGuard receiver unit and the dashboard, with clear recommendations for action.</p>
              </div>
            </div>
            <div className="text-center mt-10">
              <a href="#contact" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Get Started
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </section>

        {/* ─── About AgroGuard ───────────────────────────────────────────── */}
        <AboutSection />

        {/* ─── Achievements ──────────────────────────────────────────────── */}
        <AchievementsSection />

        {/* ─── Product / Specifications ───────────────────────────────────── */}
        <section id="product" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                  The Hardware
                </span>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  AgroGuard Node 7 in 1 Smart Soil Sensor
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  A rugged, solar ready field device built for Nigerian farmland. The AgroGuard
                  Node reads seven soil channels and streams them to the cloud over WiFi or
                  long range LoRa giving you a complete picture of what is happening beneath
                  your crops.
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    { icon: Droplets, label: "Soil Moisture", value: "0–100% RH" },
                    { icon: Thermometer, label: "Soil Temperature", value: "-40 to 80 °C" },
                    { icon: Gauge, label: "Electrical Conductivity", value: "0–20 mS/m" },
                    { icon: FlaskConical, label: "pH + N-P-K", value: "4 channels" },
                    { icon: Radio, label: "Connectivity", value: "WiFi + LoRa 868 MHz" },
                    { icon: Battery, label: "Power", value: "Solar / Li-ion, weeks" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{label}</div>
                        <div className="text-sm text-muted-foreground">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <a href="#contact" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Schedule a Consultation
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
              <div className="relative">
                <ProductCarousel />
                <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 bg-card border border-border rounded-xl shadow-lg px-5 py-3">
                  <Cpu className="h-6 w-6 text-primary" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Device + RS485 Modbus</div>
                    <div className="text-xs text-muted-foreground">Industrial grade sensing</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── In the Box ────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">In the Box</h2>
              <p className="text-muted-foreground">Everything a farmer needs to get monitoring from day one.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Cpu, title: "AgroGuard Node", desc: "Farmer Receiver gateway with OLED status display." },
                { icon: FlaskConical, title: "7-in-1 Soil Probe", desc: "RS485 stainless-steel sensor and cabling." },
                { icon: Battery, title: "Solar Power Kit", desc: "Panel, rechargeable battery and controller." },
                { icon: Package, title: "Field Mount & Guide", desc: "Weatherproof enclosure and quick-start guide." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card p-8 rounded-xl border border-border shadow-sm text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing / Pre-Order ────────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                Pre Order Now
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-4">Reserve Your AgroGuard Device</h2>
              <p className="text-muted-foreground">
                Be among the first farmers to deploy AgroGuard. Pre order today and lock in
                early bird pricing before general availability.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Early Bird */}
              <div className="relative bg-card p-8 rounded-2xl border-2 border-primary shadow-lg flex flex-col">
                <span className="absolute -top-3 left-8 inline-block text-xs font-semibold uppercase tracking-wider text-primary-foreground bg-primary rounded-full px-3 py-1">
                  Early Bird
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">Pre-Order Price</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-foreground">&#8358;160,000</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Limited launch allocation. Save against the regular price.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Complete AgroGuard Node + 7-in-1 soil probe",
                    "Farmer receiver unit with on-device readout",
                    "Solar power kit and field mount",
                    "Priority onboarding and platform access",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Pre Order Now
                </Link>
              </div>
              {/* Regular */}
              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-2">Regular Price</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-foreground">&#8358;200,000</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Standard price after the pre-order window closes.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Complete AgroGuard Node + 7-in-1 soil probe",
                    "Farmer receiver unit with on-device readout",
                    "Solar power kit and field mount",
                    "Standard onboarding and platform access",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="inline-flex h-12 w-full items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                  Talk to Our Team
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Why Choose AgroGuard (Comparison) ──────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AgroGuard</h2>
              <p className="text-muted-foreground">How precision monitoring compares to traditional farming.</p>
            </div>
            <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-border shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-4 px-6 text-sm font-semibold text-foreground">Capability</th>
                    <th className="py-4 px-6 text-sm font-semibold text-muted-foreground text-center">Traditional Farming</th>
                    <th className="py-4 px-6 text-sm font-semibold text-primary text-center">AgroGuard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { cap: "Real-time soil data", trad: "Manual inspection", agro: "Real-time monitoring" },
                    { cap: "7 in 1 nutrient analysis", trad: "Guesswork", agro: "AI-powered recommendations" },
                    { cap: "AI crop & disease guidance", trad: "Delayed decisions", agro: "Smart alerts" },
                    { cap: "Instant dashboard alerts", trad: "High crop losses", agro: "Early disease detection" },
                    { cap: "Irrigation management", trad: "Water wastage", agro: "Better irrigation decisions" },
                    { cap: "Remote monitoring anywhere", trad: "Reactive management", agro: "Improved productivity" },
                  ].map(({ cap, trad, agro }) => (
                    <tr key={cap}>
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{cap}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground hidden sm:inline">{trad}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-xs text-primary font-medium hidden sm:inline">{agro}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── How AgroGuard Works (Customer Journey) ─────────────────────── */}
        <section id="how it works" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                Customer Journey
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-4">How AgroGuard Works</h2>
              <p className="text-muted-foreground">From installation to actionable insight a simple, powerful process.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {customerJourneySteps.map(({ step, icon, title, description }) => {
                const Icon = journeyIconMap[icon] ?? Package;
                return (
                  <div key={step} className="relative bg-card p-8 rounded-xl border border-border shadow-sm">
                    <div className="absolute top-6 right-6 text-4xl font-extrabold text-primary/10">{step}</div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-3">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-12">
              <a href="#contact" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                <CalendarCheck className="h-5 w-5 mr-2" />
                Book a Demo
              </a>
            </div>
          </div>
        </section>

        {/* ─── Why Farmers Trust AgroGuard ─────────────────────────────────── */}
        <TrustSection />


        {/* ─── Testimonials ──────────────────────────────────────────────── */}
        <section id="testimonials" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Trusted by Farmers</h2>
              <p className="text-muted-foreground">Real results from fields across Northern Nigeria.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "My maize yield went up by a third in one season. I now water only when the soil truly needs it.", name: "Aliyu Bello", role: "Maize Farmer, Kaduna" },
                { quote: "The dashboard alerts caught a nutrient problem early. AgroGuard saved my tomato harvest.", name: "Hauwa Suleiman", role: "Tomato Grower, Kano" },
                { quote: "As a field officer I monitor dozens of farms from my phone. It has transformed how we work.", name: "Chinedu Okafor", role: "Field Officer, Niger State" },
              ].map(({ quote, name, role }) => (
                <div key={name} className="bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-foreground leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="font-bold text-foreground">{name}</div>
                    <div className="text-sm text-muted-foreground">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─── Team ──────────────────────────────────────────────────────── */}
        <section id="team" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Meet the Founders</h2>
              <p className="text-muted-foreground">Combining agricultural expertise with deep technology experience.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  photo: ceoPhoto,
                  name: "Ismail Ahmad",
                  title: "Founder & Chief Executive Officer (CEO)",
                  desc: "Responsible for product vision, business strategy, partnerships, and company growth.",
                },
                {
                  photo: ctoPhoto,
                  name: "Usman Umar Garba",
                  title: "Chief Operating Officer (COO)",
                  desc: "Responsible for operations, implementation, deployment, and business development.",
                },
                {
                  photo: cooPhoto,
                  name: "Sadiya Abdullahi Ladan",
                  title: "Chief Technology Officer (CTO)",
                  desc: "Responsible for software engineering, AI systems, cloud infrastructure, and product development.",
                },
              ].map(({ photo, name, title, desc }) => (
                <div key={name} className="bg-card rounded-xl border border-border shadow-sm p-6 text-center">
                  <div className="w-28 h-28 mx-auto rounded-full bg-muted mb-4 overflow-hidden ring-4 ring-primary/10">
                    <img src={photo} alt={name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{name}</h3>
                  <p className="text-primary font-medium text-sm mb-2">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Contact ───────────────────────────────────────────────────── */}
        <section id="contact" className="py-24 bg-white text-foreground border-t border-border">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4">Let's grow together</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed max-w-md">
                  Whether you farm one hectare or manage hundreds, our team will help you get
                  started with precision monitoring. Reach out and we will be in touch.
                </p>
                <ul className="space-y-4 mb-8 text-foreground">
                  <li className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                    <span>Jamaa, Zaria, Kaduna State, Nigeria</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-primary" />
                    <a href={`mailto:${socialLinks.email}`} className="hover:text-primary transition-colors">{socialLinks.email}</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-primary" />
                    <a href={`tel:${socialLinks.phone}`} className="hover:text-primary transition-colors">{socialLinks.phone}</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-primary" />
                    <span>{businessHours.weekdays}</span>
                  </li>
                </ul>
                <SocialIcons variant="default" size="md" />
              </div>

              {/* Contact / Demo Form */}
              <div className="bg-white text-foreground rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-bold mb-2">Contact AgroGuard</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Book a demo, request a pilot, or send us a general enquiry.
                </p>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-type" className="block text-sm font-medium text-foreground mb-1">I want to</label>
                    <select
                      id="contact-type"
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="demo">Book a Demo</option>
                      <option value="pilot">Request a Pilot</option>
                      <option value="consult">Schedule a Consultation</option>
                      <option value="enquiry">General Enquiry</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1">Message</label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Tell us about your farm, your needs, or your questions..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Premium Footer ──────────────────────────────────────────────── */}
      <footer className="bg-sidebar py-14 border-t border-sidebar-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-8 w-8 object-contain opacity-80" />
                <span className="font-bold text-lg text-sidebar-foreground">AgroGuard Ltd.</span>
              </div>
              <p className="text-sidebar-foreground/70 text-sm mb-4 leading-relaxed">
                Securing the future of Nigerian agriculture through data-driven precision and empowering farmers everywhere.
              </p>
              <div className="flex justify-center md:justify-start">
                <SocialIcons variant="light" size="sm" />
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4 text-sm uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-sidebar-foreground/70 text-sm">
                <li><a href="#features" className="hover:text-primary transition-colors">Soil Monitoring</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">AI Disease Detection</a></li>
                <li><a href="#product" className="hover:text-primary transition-colors">Smart Sensors</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Farm Analytics</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sidebar-foreground/70 text-sm">
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#team" className="hover:text-primary transition-colors">Our Team</a></li>
                <li><a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sidebar-foreground/70 text-sm">
                <li><Link href="/login" className="hover:text-primary transition-colors">Platform Login</Link></li>
                <li><Link href="/signup" className="hover:text-primary transition-colors">Create Account</Link></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4 text-sm uppercase tracking-wider">Get In Touch</h4>
              <ul className="space-y-3 text-sidebar-foreground/70 text-sm">
                <li className="flex items-start gap-2 justify-center md:justify-start">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Jamaa, Zaria, Kaduna State, Nigeria</span>
                </li>
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`mailto:${socialLinks.email}`} className="hover:text-primary transition-colors">{socialLinks.email}</a>
                </li>
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${socialLinks.phone}`} className="hover:text-primary transition-colors">{socialLinks.phone}</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-sidebar-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-sidebar-foreground/60">
            <div>&copy; {new Date().getFullYear()} AgroGuard Limited. All Rights Reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span className="text-sidebar-border">|</span>
              <a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
