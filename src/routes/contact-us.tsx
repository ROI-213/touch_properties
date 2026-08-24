import { siteImages } from "@/data/siteImages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Mail, MapPin, Clock, MessageCircle, Check, ChevronRight, Headphones, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { addEnquiry } from "@/lib/enquiries";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title: "Contact Touch Stone Properties | Buy, Sell & Rent Property Assistance" },
      { name: "description", content: "Contact Touch Stone Properties for expert assistance in buying, selling, and renting verified residential and commercial properties." },
      { property: "og:title", content: "Contact Touch Stone Properties" },
      { property: "og:description", content: "Expert assistance for buying, selling and renting verified properties in Bangalore." },
      { property: "og:url", content: "/contact-us" },
    ],
    links: [{ rel: "canonical", href: "/contact-us" }],
  }),
  component: ContactUsPage,
});

const WA = "https://wa.me/919902925519?text=" + encodeURIComponent("Hi Touch Stone Properties, I am interested in buying, selling, or renting a property. Please contact me.");
const CALL = "tel:+919902925519";
const EMAIL = "mailto:info@touchstoneproperties.in";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email"),
  requirementType: z.enum(["Buy", "Sell", "Rent", "General Enquiry"]),
  location: z.string().trim().min(2, "Please enter a location").max(120),
  budget: z.string().trim().min(1, "Please enter your budget").max(80),
  message: z.string().trim().min(10, "Please share a few details").max(1000),
});
type FormValues = z.infer<typeof schema>;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", requirementType: "Buy", location: "", budget: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setErrorMsg("");
    try {
      const result = await addEnquiry({ ...values, source: "Contact Us" });
      if (!result) throw new Error("save failed");
      setSubmitted(true);
      form.reset();
    } catch {
      setErrorMsg("Something went wrong. Please try again or contact us on WhatsApp.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-charcoal">
      <Navbar />

      {/* HERO */}
      <section className="relative flex items-center justify-center overflow-hidden h-[45vh] md:h-[60vh] min-h-[380px]">
        <motion.div
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${siteImages.hero.skyline})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/60 to-charcoal/90" />
        <div className="relative z-10 max-w-3xl px-6 text-center text-ivory">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[3px] text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Expert Real Estate Assistance
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
            className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Contact Touch Stone Properties
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-ivory/85">
            Get expert assistance for buying, selling, and renting properties.
          </motion.p>
          <nav aria-label="Breadcrumb" className="mt-6 flex justify-center text-xs text-ivory/70">
            <Link to="/" className="hover:text-gold">Home</Link>
            <ChevronRight size={14} className="mx-2 text-gold" />
            <span className="text-gold">Contact Us</span>
          </nav>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section id="contact-details" className="px-6 py-16 md:py-20">
        <div className="mx-auto w-full">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Get in Touch With Our Property Experts</h2>
            <p className="mt-4 text-charcoal/65">Reach out to us for buying, selling, renting, property visits, legal support, or general real estate guidance.</p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Phone, title: "Phone Number", content: "+91 99029 25519", href: CALL },
              { icon: Mail, title: "Email", content: "info@touchstoneproperties.in", href: EMAIL },
              { icon: MapPin, title: "Office Address", content: "Bangalore, Karnataka, India", href: "#office-location" },
              { icon: Clock, title: "Working Hours", content: "Mon – Sat: 9:30 AM – 7:00 PM" },
              { icon: MessageCircle, title: "WhatsApp", content: "Chat with our expert instantly", href: WA, accent: "emerald" as const },
            ].map((c, i) => {
              const Inner = (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="group relative h-full rounded-2xl border border-charcoal/5 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elevated hover:border-gold/40"
                >
                  <div className={`mb-5 grid h-14 w-14 place-items-center rounded-full ${c.accent === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-gold/10 text-gold"}`}>
                    <c.icon size={22} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{c.content}</p>
                  <span className="absolute inset-x-6 bottom-0 h-[2px] origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
                </motion.div>
              );
              return c.href ? (
                <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block h-full">
                  {Inner}
                </a>
              ) : (
                <div key={c.title}>{Inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="send-enquiry" className="bg-ivory px-6 py-16 md:py-20">
        <div className="mx-auto grid w-full gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div {...fadeUp}>
            <span className="text-xs uppercase tracking-[3px] text-gold">Enquiry</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold">Tell Us Your Property Requirement</h2>
            <p className="mt-4 text-charcoal/65 max-w-md">
              Share your requirement with us and our team will get back to you with verified property options and expert guidance.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Verified property suggestions",
                "Buy, sell, and rental support",
                "Site visit coordination",
                "Legal and loan assistance",
                "Quick response from our team",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-gold/15 text-gold">
                    <Check size={14} />
                  </span>
                  <span className="text-charcoal/80">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...fadeUp}
            className="rounded-3xl border border-white/40 bg-white/70 p-7 shadow-elevated backdrop-blur-xl md:p-9"
          >
            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center">
                <svg width="72" height="72" viewBox="0 0 72 72" className="text-gold">
                  <circle cx="36" cy="36" r="33" fill="none" stroke="currentColor" strokeWidth="2" />
                  <motion.path d="M22 37 L33 47 L51 27" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
                </svg>
                <h3 className="mt-6 font-display text-2xl">Enquiry Submitted</h3>
                <p className="mt-3 max-w-sm text-charcoal/65">
                  Thank you for contacting Touch Stone Properties. Our property expert will get in touch with you shortly.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-6 rounded-full border border-gold px-6 py-2 text-sm text-gold hover:bg-gold hover:text-white transition">
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Field label="Name" error={form.formState.errors.name?.message}>
                  <input {...form.register("name")} placeholder="Enter your full name" className={inputCls} aria-label="Name" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" error={form.formState.errors.phone?.message}>
                    <input type="tel" {...form.register("phone")} placeholder="10-digit mobile number" className={inputCls} aria-label="Phone" />
                  </Field>
                  <Field label="Email" error={form.formState.errors.email?.message}>
                    <input type="email" {...form.register("email")} placeholder="you@example.com" className={inputCls} aria-label="Email" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Requirement" error={form.formState.errors.requirementType?.message}>
                    <select {...form.register("requirementType")} className={inputCls} aria-label="Requirement type">
                      <option>Buy</option><option>Sell</option><option>Rent</option><option>General Enquiry</option>
                    </select>
                  </Field>
                  <Field label="Preferred Location" error={form.formState.errors.location?.message}>
                    <input {...form.register("location")} placeholder="e.g. Whitefield, Sarjapur" className={inputCls} aria-label="Location" />
                  </Field>
                </div>
                <Field label="Budget" error={form.formState.errors.budget?.message}>
                  <input {...form.register("budget")} placeholder="₹50L - ₹1Cr / ₹30,000 per month" className={inputCls} aria-label="Budget" />
                </Field>
                <Field label="Message" error={form.formState.errors.message?.message}>
                  <textarea {...form.register("message")} rows={4} placeholder="Tell us about your property requirement" className={`${inputCls} resize-none`} aria-label="Message" />
                </Field>

                {errorMsg && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-white shadow-gold transition-all hover:bg-gold-light hover:shadow-[0_0_28px_rgba(184,150,46,0.45)] disabled:opacity-60"
                >
                  {form.formState.isSubmitting ? "Submitting..." : (<>Submit Enquiry <Send size={16} className="transition-transform group-hover:translate-x-0.5" /></>)}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* MAP */}
      <section id="office-location" className="px-6 py-16 md:py-20">
        <div className="mx-auto w-full">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Visit Our Office</h2>
            <p className="mt-4 text-charcoal/65">Find Touch Stone Properties and connect with our team for personalized property consultation.</p>
          </motion.div>

          <motion.div {...fadeUp} className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-3xl shadow-elevated lg:col-span-2">
              <iframe
                title="Office location map"
                src="https://www.google.com/maps?q=Bangalore,Karnataka,India&output=embed"
                className="h-[300px] w-full border-0 md:h-[450px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="rounded-3xl border border-charcoal/5 bg-white p-7 shadow-card">
              <h3 className="font-display text-xl font-semibold">Touch Stone Properties</h3>
              <div className="mt-5 space-y-4 text-sm">
                <Info icon={MapPin} label="Address" value="Bangalore, Karnataka, India" />
                <Info icon={Phone} label="Phone" value="+91 99029 25519" />
                <Info icon={Mail} label="Email" value="info@touchstoneproperties.in" />
                <Info icon={Clock} label="Hours" value="Mon – Sat: 9:30 AM – 7:00 PM" />
              </div>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Bangalore,Karnataka,India"
                target="_blank" rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-medium text-white hover:bg-stone transition"
              >
                Get Directions <ChevronRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK CTA STRIP */}
      <section id="whatsapp" className="px-6 pb-20">
        <div className="mx-auto w-full">
          <motion.div {...fadeUp}
            className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-charcoal to-stone p-8 text-center text-ivory md:flex-row md:p-10 md:text-left"
          >
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-semibold">Need Immediate Property Assistance?</h3>
              <p className="mt-2 text-ivory/70">Connect with our real estate expert instantly through call or WhatsApp.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <a href={CALL} className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-medium text-white shadow-gold hover:bg-gold-light transition">
                <Phone size={16} /> Call Now
              </a>
              <a href={WA} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-transparent px-6 py-3 font-medium text-gold hover:bg-gold hover:text-white transition">
                <MessageCircle size={16} /> WhatsApp Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="speak-expert" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${siteImages.hero.welcome})` }} />
        <div className="absolute inset-0 bg-charcoal/85" />
        <motion.div {...fadeUp} className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center text-ivory">
          <Headphones className="mx-auto mb-5 text-gold" size={36} />
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Speak With Our Property Expert Today.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-ivory/80">
            Whether you are planning to buy, sell, or rent, Touch Stone Properties is ready to guide you with verified listings and trusted support.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/buy-properties/$type" params={{ type: "apartments" }} className="w-full rounded-full bg-gold px-7 py-3.5 font-medium text-white shadow-gold hover:bg-gold-light transition sm:w-auto">
              Explore Properties
            </Link>
            <a href={WA} target="_blank" rel="noreferrer" className="w-full rounded-full bg-emerald-600 px-7 py-3.5 font-medium text-white hover:bg-emerald-500 transition sm:w-auto">
              WhatsApp Now
            </a>
            <a href="#send-enquiry" className="w-full rounded-full border border-ivory/40 px-7 py-3.5 font-medium text-ivory hover:bg-white/10 transition sm:w-auto">
              Submit Requirement
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal placeholder-charcoal/40 outline-none transition-all focus:border-gold focus:ring-2 focus:ring-gold/30";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-charcoal/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-charcoal/50">{label}</div>
        <div className="text-charcoal/85 break-words">{value}</div>
      </div>
    </div>
  );
}
