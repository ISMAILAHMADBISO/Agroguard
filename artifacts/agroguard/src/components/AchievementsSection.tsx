import { Link } from "wouter";
import { achievements } from "@/data/achievements";
import { ArrowRight } from "lucide-react";

export default function AchievementsSection() {
  return (
    <section className="py-24 bg-muted/20 border-y border-border">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Journey & Achievements
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Milestones that showcase AgroGuard's commitment to climate innovation, agricultural resilience, entrepreneurship, and sustainable development across Africa.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {achievements.map((achievement) => (
            <Link key={achievement.slug} href={`/achievements/${achievement.slug}`}>
              <div className="group flex flex-col h-full bg-white rounded-2xl border border-border shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
                {/* Featured Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={achievement.image}
                    alt={achievement.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs">
                      {achievement.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-col flex-1 p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {achievement.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {achievement.excerpt}
                  </p>

                  {/* Read More Link */}
                  <div className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm group-hover:text-emerald-700 transition-colors duration-200 mt-auto">
                    Read More
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
