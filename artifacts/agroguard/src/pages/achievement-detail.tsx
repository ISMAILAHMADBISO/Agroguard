import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  MapPin,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { achievements as staticAchievements } from "@/data/achievements";

export default function AchievementDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allAchievements = [
    ...staticAchievements.map(a => ({
      ...a,
      imageUrl: a.image,
      content: a.content.join("\n\n")
    })),
    ...(achievements || [])
  ];

  const currentAchievement = allAchievements.find((a: any) => a.slug === slug);

  if (!currentAchievement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Achievement Not Found</h2>
        <p className="text-muted-foreground mb-6">The achievement you are looking for does not exist or has been moved.</p>
        <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
          Go Back Home
        </Link>
      </div>
    );
  }

  const currentIndex = allAchievements.findIndex((a: any) => a.slug === slug);
  const prevAchievement = currentIndex > 0 ? allAchievements[currentIndex - 1] : null;
  const nextAchievement = currentIndex < allAchievements.length - 1 ? allAchievements[currentIndex + 1] : null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: "Link Copied",
      description: "The article link has been copied to your clipboard.",
    });
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(currentAchievement.title)}`;
    window.open(url, "_blank");
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank");
  };

  const handleShareLinkedin = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img src="/agroguard-logo.png" alt="AgroGuard Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl text-primary">AgroGuard Limited</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Back to Home
            </Link>
            <Link href="/login" className="h-9 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb / Back Button */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to Journey & Achievements
            </Link>
          </div>

          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden shadow-md mb-8 aspect-video md:aspect-[21/9] bg-muted">
            <img
              src={currentAchievement.imageUrl}
              alt={currentAchievement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs md:text-sm font-medium">
                <span className="inline-flex items-center gap-1 bg-emerald-600 px-3 py-1 rounded-full text-white shadow-xs">
                  <Tag className="h-3 w-3" />
                  {currentAchievement.category}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-200">
                  <Calendar className="h-3.5 w-3.5" />
                  {currentAchievement.date}
                </span>
              </div>
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {currentAchievement.title}
              </h1>
            </div>
          </div>

          {/* Article Layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Article Body */}
            <div className="lg:col-span-2 space-y-6">
              <article className="prose prose-emerald max-w-none text-foreground leading-relaxed">
                {currentAchievement.content.split("\n\n").map((paragraph: string, index: number) => (
                  <p key={index} className="text-base md:text-lg text-muted-foreground mb-6">
                    {paragraph}
                  </p>
                ))}
              </article>

              {/* Prev/Next Navigation */}
              <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                {prevAchievement ? (
                  <Link href={`/achievements/${prevAchievement.slug}`}>
                    <div className="w-full sm:w-auto flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors max-w-sm">
                      <ChevronLeft className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Previous Article</div>
                        <div className="font-bold text-sm text-foreground line-clamp-1 mt-0.5">{prevAchievement.title}</div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {nextAchievement ? (
                  <Link href={`/achievements/${nextAchievement.slug}`}>
                    <div className="w-full sm:w-auto flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors max-w-sm ml-auto text-right">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Next Article</div>
                        <div className="font-bold text-sm text-foreground line-clamp-1 mt-0.5">{nextAchievement.title}</div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-primary shrink-0 mt-1" />
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>
            </div>

            {/* Sidebar info / Social share */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                {/* Social Share Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Share This Article
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShareTwitter}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Twitter className="h-4 w-4 text-sky-500" />
                      Twitter / X
                    </button>
                    <button
                      onClick={handleShareFacebook}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </button>
                    <button
                      onClick={handleShareLinkedin}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Link2 className="h-4 w-4 text-gray-500" />
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* About AgroGuard Card */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="font-bold text-primary mb-3">About AgroGuard</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    AgroGuard is a precision agriculture and climate intelligence platform dedicated to strengthening agricultural resilience and improving food security across Africa.
                  </p>
                  <Link href="/signup" className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors cursor-pointer">
                    Join Our Network
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
              <li><Link href="/#features" className="hover:text-primary transition-colors">IoT Devices</Link></li>
              <li><Link href="/#features" className="hover:text-primary transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sidebar-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sidebar-foreground/70">
              <li><Link href="/#team" className="hover:text-primary transition-colors">About Us</Link></li>
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
