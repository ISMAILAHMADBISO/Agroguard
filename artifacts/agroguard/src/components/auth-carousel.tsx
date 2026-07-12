/**
 * AuthCarousel — sliding promotional imagery shown beside the login / signup
 * forms. Auto-advances every few seconds and is hidden on small screens so the
 * form stays mobile-first. Images live in public/assets/auth and are served
 * under the artifact base path.
 */
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

interface Slide {
  src: string;
  title: string;
  caption: string;
}

const SLIDES: Slide[] = [
  {
    src: `${BASE}assets/auth/real-deploy1.jpg`,
    title: "Smart farming, in every hand",
    caption: "Real-time soil and crop insight for smallholder farmers across Nigeria.",
  },
  {
    src: `${BASE}assets/auth/real-deploy2.jpg`,
    title: "AgroGuard in the field",
    caption: "Built for the realities of Nigerian agricultural environments.",
  },
  {
    src: `${BASE}assets/auth/real-deploy4.jpg`,
    title: "Rugged and durable",
    caption: "Sealed hardware node designed to withstand outdoor conditions.",
  },
  {
    src: `${BASE}assets/auth/real-deploy7.jpg`,
    title: "Solar powered monitoring",
    caption: "Automatic data logging powered by sustainable energy.",
  },
  {
    src: `${BASE}assets/auth/real-deploy8.jpg`,
    title: "Precision sensor probes",
    caption: "High accuracy measurement of moisture and temperature at root level.",
  },
  {
    src: `${BASE}assets/auth/real-deploy9.jpg`,
    title: "Eco-friendly operations",
    caption: "Sustainable energy options to keep monitoring active 24/7.",
  },
];

const ROTATE_MS = 5000;

export function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-sidebar">
      {/* Sliding track — all slides sit side by side and translate horizontally */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={slide.src} className="relative h-full w-full shrink-0" aria-hidden={i !== index}>
            <img
              src={slide.src}
              alt={slide.title}
              className="h-full w-full object-cover object-bottom"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sidebar/95 via-sidebar/30 to-transparent" />
          </div>
        ))}
      </div>

      {/* Brand mark */}
      <div className="absolute top-8 left-8 flex items-center gap-2.5 text-white">
        <img src={`${BASE}agroguard-logo.png`} alt="AgroGuard" className="h-10 w-10 object-contain drop-shadow" />
        <span className="text-lg font-bold tracking-tight drop-shadow">AgroGuard Limited</span>
      </div>

      {/* Caption + dots */}
      <div className="absolute bottom-10 left-8 right-8 text-white">
        <h2 className="text-2xl font-bold leading-tight drop-shadow-sm">
          {SLIDES[index].title}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-white/85 drop-shadow-sm">
          {SLIDES[index].caption}
        </p>
        <div className="mt-5 flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-7 bg-white" : "w-3 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
