import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetDashboardStats } from "@workspace/api-client-react";
import {
  Leaf,
  Droplets,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Cpu,
  Wifi,
  Gauge,
  Thermometer,
  FlaskConical,
  Battery,
  Package,
  Check,
  X,
  Quote,
  UserPlus,
  Radio,
  LineChart,
} from "lucide-react";
import { ProductCarousel } from "@/components/product-carousel";
import ceoPhoto from "@assets/ceo_1780575358267.jpeg";
import ctoPhoto from "@assets/usmanh_1780575358268.jpeg";
import cooPhoto from "@assets/ladan_1780575358269.jpeg";

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
            <a href="#product" className="hover:text-primary transition-colors">Product</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Stories</a>
            <a href="#team" className="hover:text-primary transition-colors">Team</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
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
                <a href="#pricing" className="inline-flex h-12 items-center justify-center rounded-md bg-white/10 px-8 text-base font-medium text-white border border-white/20 shadow backdrop-blur transition-colors hover:bg-white/20">
                  Contact Sales
                </a>
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
                <p className="text-muted-foreground">Readings and alerts reach the farmer on their AgroGuard receiver unit and on WhatsApp, in local languages with clear recommendations for action.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product / Specifications */}
        <section id="product" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                  The Hardware
                </span>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  AgroGuard Node — 7-in-1 Smart Soil Sensor
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  A rugged, solar-ready field device built for Nigerian farmland. The AgroGuard
                  Node reads seven soil channels and streams them to the cloud over WiFi or
                  long-range LoRa — giving you a complete picture of what is happening beneath
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
              </div>
              <div className="relative">
                <ProductCarousel />
                <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 bg-card border border-border rounded-xl shadow-lg px-5 py-3">
                  <Cpu className="h-6 w-6 text-primary" />
                  <div>
                    <div className="text-sm font-bold text-foreground">ESP32 + RS485 Modbus</div>
                    <div className="text-xs text-muted-foreground">Industrial-grade sensing</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* In the Box */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">In the Box</h2>
              <p className="text-muted-foreground">Everything a farmer needs to get monitoring from day one.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Cpu, title: "AgroGuard Node", desc: "ESP32 gateway with OLED status display." },
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

        {/* Pricing / Pre-Order */}
        <section id="pricing" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                Pre-Order Now
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-4">Reserve Your AgroGuard Node</h2>
              <p className="text-muted-foreground">
                Be among the first farmers to deploy AgroGuard. Pre-order today and lock in
                early-bird pricing before general availability.
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
                  Pre-Order Now
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
                  Ask a Question
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Why AgroGuard</h2>
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
                    "Real-time soil data",
                    "7-in-1 nutrient analysis",
                    "AI crop & disease guidance",
                    "Instant WhatsApp alerts",
                    "Remote monitoring anywhere",
                  ].map((cap) => (
                    <tr key={cap}>
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{cap}</td>
                      <td className="py-4 px-6 text-center">
                        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3 Simple Steps */}
        <section id="how-it-works" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">3 Simple Steps</h2>
              <p className="text-muted-foreground">From unboxing to actionable insight in minutes.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "01", icon: UserPlus, title: "Register", desc: "Create your free farmer account and add your farm details in minutes." },
                { step: "02", icon: Radio, title: "Deploy", desc: "Plant the AgroGuard Node in your field — it connects automatically and starts streaming." },
                { step: "03", icon: LineChart, title: "Grow Smarter", desc: "Watch live readings, receive AI recommendations and act before problems spread." },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="relative bg-card p-8 rounded-xl border border-border shadow-sm">
                  <div className="absolute top-6 right-6 text-4xl font-extrabold text-primary/10">{step}</div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Create Your Free Account
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Trusted by Farmers</h2>
              <p className="text-muted-foreground">Real results from fields across Northern Nigeria.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "My maize yield went up by a third in one season. I now water only when the soil truly needs it.", name: "Aliyu Bello", role: "Maize Farmer, Kaduna" },
                { quote: "The WhatsApp alerts caught a nutrient problem early. AgroGuard saved my tomato harvest.", name: "Hauwa Suleiman", role: "Tomato Grower, Kano" },
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

        {/* Team */}
        <section id="team" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Leadership Team</h2>
              <p className="text-muted-foreground">Combining agricultural expertise with deep technology experience.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted mb-4 overflow-hidden">
                  <img src={ceoPhoto} alt="Ismail Ahmad" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Ismail Ahmad</h3>
                <p className="text-primary font-medium mb-2">Founder & CEO</p>
                <p className="text-sm text-muted-foreground">Agricultural technology strategist driving AgroGuard's mission to empower Nigerian smallholder farmers.</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted mb-4 overflow-hidden">
                  <img src={ctoPhoto} alt="Usman Umar Garba" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Usman Umar Garba</h3>
                <p className="text-primary font-medium mb-2">CTO</p>
                <p className="text-sm text-muted-foreground">IoT systems engineer specializing in embedded sensors and cloud infrastructure.</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted mb-4 overflow-hidden">
                  <img src={cooPhoto} alt="Sadiya Abdullahi Ladan" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Sadiya Abdullahi Ladan</h3>
                <p className="text-primary font-medium mb-2">COO</p>
                <p className="text-sm text-muted-foreground">Operations lead coordinating field deployment, farmer onboarding and partner relations.</p>
              </div>
            </div>
          </div>
        </section>
        {/* Contact */}
        <section id="contact" className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Let's grow together</h2>
                <p className="text-primary-foreground/80 mb-8 leading-relaxed max-w-md">
                  Whether you farm one hectare or manage hundreds, our team will help you get
                  started with precision monitoring. Reach out and we will be in touch.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <span>Jamaa, Zaria, Kaduna State, Nigeria</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0" />
                    <a href="mailto:info@agroguard.tech" className="hover:underline">info@agroguard.tech</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0" />
                    <a href="tel:+2347089459265" className="hover:underline">+234 708 945 9265</a>
                  </li>
                </ul>
              </div>
              <div className="bg-white text-foreground rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-bold mb-2">Get started today</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Create a free farmer account or sign in to the platform.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/signup" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Create Free Account
                  </Link>
                  <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
                    Platform Login
                  </Link>
                  <a href="mailto:info@agroguard.tech" className="inline-flex h-12 w-full items-center justify-center rounded-md px-8 text-base font-medium text-primary hover:underline">
                    Talk to Sales
                  </a>
                </div>
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
