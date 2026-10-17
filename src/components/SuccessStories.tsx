import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Home,
  Key,
  Tag,
  Building2,
  MapPin,
  Phone,
  MessageCircle,
} from "lucide-react";
import { successStories as fallbackStories, type SuccessStory, type StoryType } from "@/data/successStories";
import { useSuccessStories } from "@/hooks/useSiteSettings";
import type { SuccessStoryRow } from "@/lib/site-cms";
import { slugifyStory } from "@/lib/site-cms";
import { FALLBACK_PROPERTY_IMAGE, resolveLocalImage } from "@/data/siteImages";

function mapDbStory(r: SuccessStoryRow): SuccessStory {
  const images = ((r.images && r.images.length > 0)
    ? r.images
    : (r.image_url ? [r.image_url] : []))
    .filter((u: any): u is string => typeof u === "string" && u.trim().length > 0);
  const type: StoryType = (["Rent", "Buy", "Sell", "Property Management"] as StoryType[]).includes(r.story_type as StoryType)
    ? (r.story_type as StoryType)
    : "Buy";
  return {
    id: r.id,
    slug: r.slug || slugifyStory(r.title),
    title: r.title,
    category: r.category || "Success Story",
    clientName: r.client || "",
    clientLabel: r.client_label || undefined,
    badgeText: r.badge_text || undefined,
    storyType: type,
    location: r.location || "",
    description: r.summary || "",
    fullStory: r.body || r.summary || "",
    images,
    ctaText: r.cta_text || r.button_text || "View Story",
    buttonText: r.button_text || undefined,
    contactLink: r.contact_button_link || undefined,
    whatsappLink: r.whatsapp_link || (r.whatsapp_number ? `https://wa.me/${r.whatsapp_number.replace(/\D/g, "")}` : undefined),
    services: Array.isArray(r.services_provided)
      ? r.services_provided.filter((s) => s?.active !== false && s?.name).map((s) => s.name)
      : [],
  };
}

const typeIcon: Record<StoryType, React.ComponentType<{ className?: string }>> = {
  Rent: Key,
  Buy: Home,
  Sell: Tag,
  "Property Management": Building2,
};

function StoryImageCollage({ images, title }: { images: string[]; title: string }) {
  const safeImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean).map((src) => resolveLocalImage(src, FALLBACK_PROPERTY_IMAGE))
    : [FALLBACK_PROPERTY_IMAGE];
  const [main, s1, s2] = [safeImages[0], safeImages[1] ?? safeImages[0], safeImages[2] ?? safeImages[1] ?? safeImages[0]];
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-2 h-64 sm:h-72">
      <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl ring-1 ring-amber-300/40">
        <img
          src={main}
          alt={`${title} - main`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-110"
        />
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-amber-300/40">
        <img
          src={s1}
          alt={`${title} - 2`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-110"
        />
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-amber-300/40">
        <img
          src={s2}
          alt={`${title} - 3`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-110"
        />
      </div>
    </div>
  );
}

function StoryBadge({ type, label }: { type: StoryType; label?: string }) {
  const Icon = typeIcon[type];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a1f44] text-amber-300 px-3 py-1 text-xs font-semibold tracking-wide shadow-lg ring-1 ring-amber-300/40">
      <Icon className="w-3.5 h-3.5" />
      {label || type}
    </span>
  );
}

function SuccessStoryCard({ story, index }: { story: SuccessStory; index: number }) {
  const slug = story.slug || story.id;
  return (
    <motion.article
      initial={{ y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col rounded-3xl bg-white p-4 sm:p-5 shadow-[0_10px_40px_-12px_rgba(10,31,68,0.18)] ring-1 ring-slate-100 hover:shadow-[0_20px_60px_-15px_rgba(10,31,68,0.35)] transition-shadow duration-500"
    >
      <div className="relative">
        <StoryImageCollage images={story.images} title={story.title} />
        <div className="absolute top-3 left-3">
          <StoryBadge type={story.storyType} label={story.badgeText} />
        </div>
      </div>

      <div className="mt-5 flex-1 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.18em] text-amber-600 font-semibold">
          {story.category}
        </p>
        <h3 className="mt-2 text-xl font-serif text-[#0a1f44] leading-snug">{story.title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {story.clientName}{story.clientLabel ? ` · ${story.clientLabel}` : ""}
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3">{story.description}</p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <span className="truncate">{story.location}</span>
        </div>

        <Link
          to="/success-stories/$slug"
          params={{ slug }}
          className="mt-5 inline-flex items-center justify-between gap-2 rounded-full bg-[#0a1f44] text-white px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-[#0a1f44]/90 hover:gap-3 group/btn"
        >
          <span>{story.ctaText}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-transparent group-hover:ring-amber-300/60 transition" />
    </motion.article>
  );
}

export function SuccessStories() {
  const { items } = useSuccessStories(true);
  const stories: SuccessStory[] = items.length > 0 ? items.map(mapDbStory) : fallbackStories;

  return (
    <section className="relative bg-white py-8 sm:py-12">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

      <div className="w-full mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/50 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-amber-700 font-semibold">
            Real Client Journeys
          </span>
          <h2 className="mt-5 text-4xl sm:text-5xl font-serif text-[#0a1f44] leading-tight">
            Success <span className="italic text-amber-600">Stories</span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-4 h-[2px] w-24 origin-left bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300"
          />
          <p className="mt-5 text-slate-600 leading-relaxed">
            Real property journeys where Touchstone Properties helped clients buy, sell,
            and rent the right property with confidence.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <SuccessStoryCard key={story.id} story={story} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 sm:mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1f44] via-[#0a1f44] to-[#142b5c] px-6 sm:px-12 py-12 text-center"
        >
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
          <h3 className="relative text-2xl sm:text-3xl font-serif text-white">
            Want Your Property Success Story Next?
          </h3>
          <p className="relative mt-3 text-slate-300 max-w-xl mx-auto text-sm">
            Let our team guide your next move — with the same care, transparency and
            results we deliver to every client.
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact-us"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#0a1f44] px-6 py-3 text-sm font-semibold hover:bg-amber-50 transition shadow-lg"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </Link>
            <a
              href="https://wa.me/919902925519"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 text-[#0a1f44] px-6 py-3 text-sm font-semibold hover:bg-amber-400 transition shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default SuccessStories;
