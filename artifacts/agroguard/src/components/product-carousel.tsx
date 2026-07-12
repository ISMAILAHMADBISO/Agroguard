/**
 * ProductCarousel — sliding gallery of real AgroGuard hardware photos shown in
 * the landing page Product section. Distinct from AuthCarousel (login/signup):
 * it has a square frame, manual arrows and a different image set.
 *
 * Photos live in public/assets/product/ so they can be swapped/edited freely.
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface ProductSlide {
  src: string;
  caption: string;
}

const SLIDES: ProductSlide[] = [
  {
    src: `${BASE}assets/product/real-deploy3.jpg`,
    caption: "AgroGuard sensor probe deployed next to the plant roots",
  },
  {
    src: `${BASE}assets/product/real-deploy5.jpg`,
    caption: "Robust sensor probe in contact with farm soil",
  },
  {
    src: `${BASE}assets/product/real-deploy6.jpg`,
    caption: "7-in-1 soil probe measuring moisture, temperature, and nutrients",
  },
  {
    src: `${BASE}assets/product/real-deploy4.jpg`,
    caption: "Compact sensor box installed within leafy green crops",
  },
];

const ROTATE_MS = 4500;

export function ProductCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border shadow-lg bg-sidebar">
      {/* Sliding track */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={slide.src} className="relative h-full w-full shrink-0" aria-hidden={i !== index}>
            <img
              src={slide.src}
              alt={slide.caption}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-5 right-12 text-sm font-medium text-white drop-shadow">
              {slide.caption}
            </p>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous photo"
        onClick={() => go(index - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={() => go(index + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
