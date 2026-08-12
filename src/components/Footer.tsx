import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useBrandSettings } from "@/hooks/useSiteSettings";
import brandLogo from "@/assets/brand/logo.png";

const SOCIAL_PATHS: Record<string, string> = {
  instagram: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.21 8.8 2.2 12 2.2zm0 5.3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 7.4a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8zm5.85-7.65a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0z",
  facebook: "M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.25 0-1.64.77-1.64 1.57V12h2.78l-.44 2.9h-2.34v6.98A10 10 0 0 0 22 12z",
  linkedin: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z",
  youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
  twitter: "M22 5.92a8.2 8.2 0 0 1-2.36.65 4.12 4.12 0 0 0 1.8-2.27 8.22 8.22 0 0 1-2.6.99 4.1 4.1 0 0 0-7 3.74A11.65 11.65 0 0 1 3.4 4.9a4.1 4.1 0 0 0 1.27 5.47 4.1 4.1 0 0 1-1.85-.51v.05a4.1 4.1 0 0 0 3.29 4.02 4.1 4.1 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 18.42 11.62 11.62 0 0 0 8.29 20c7.55 0 11.68-6.26 11.68-11.68v-.53A8.34 8.34 0 0 0 22 5.92z",
};

function sortActive<T extends { is_active: boolean; display_order: number }>(items: T[] | undefined) {
  return (items ?? []).filter((i) => i.is_active).sort((a, b) => a.display_order - b.display_order);
}

function SmartLink({ href, className, children }: { href: string | undefined; className?: string; children: React.ReactNode }) {
  const raw = (href && href.trim()) || "/";
  const isInternal = raw.startsWith("/") && !raw.startsWith("//");
  if (isInternal) {
    return (
      <Link to={raw as any} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={raw} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function Footer() {
  const { brand } = useBrandSettings();

  if (brand.footer.is_active === false) return null;

  const quick = sortActive(brand.footer.quick_links);
  const propertyLinks = sortActive(brand.footer.property_links);
  const phones = sortActive(brand.footer.phones);
  const emails = sortActive(brand.footer.emails);

  const year = new Date().getFullYear();
  const logoSrc = brandLogo;

  const socials = Object.entries(brand.social)
    .filter(([, href]) => href)
    .map(([key, href]) => ({ key, href: href as string, path: SOCIAL_PATHS[key] }))
    .filter((s) => s.path);

  const copyrightRaw = brand.footer.copyright || "";
  const copyright = copyrightRaw
    ? copyrightRaw.replace(/©.*?\d{4}/, `© ${year}`)
    : `© ${year} ${brand.name}`;

  return (
    <footer suppressHydrationWarning className="bg-[#0B2447] px-6 pb-28 md:pb-8 pt-16 md:pt-20 text-ivory">
      <div className="mx-auto grid w-full gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            {logoSrc && (
              <div className="inline-flex rounded-md bg-white p-2 shadow-sm">
                <img src={logoSrc} alt={brand.name} className="h-16 w-auto object-contain" />
              </div>
            )}
          </div>


          {brand.footer.tagline && (
            <p className="mt-4 max-w-xs text-sm italic leading-relaxed text-sand/85">
              {brand.footer.tagline}
            </p>
          )}
          {brand.footer.description && (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sand/70">
              {brand.footer.description}
            </p>
          )}
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.key}
                  className="grid h-9 w-9 place-items-center rounded-full border border-sand/30 text-sand transition-colors hover:border-gold hover:text-gold"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links & Properties side-by-side on mobile view */}
        {(quick.length > 0 || propertyLinks.length > 0) && (
          <div className="grid grid-cols-2 gap-6 md:col-span-2 md:grid-cols-2">
            {quick.length > 0 && (
              <div>
                <h4 className="text-[15px] font-semibold text-ivory">Quick Links</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-sand/75">
                  {quick.map((i) => (
                    <li key={i.label}>
                      <SmartLink href={i.href} className="transition-colors hover:text-gold">{i.label}</SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {propertyLinks.length > 0 && (
              <div>
                <h4 className="text-[15px] font-semibold text-ivory">Properties</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-sand/75">
                  {propertyLinks.map((p) => (
                    <li key={p.label}>
                      <SmartLink href={p.href} className="transition-colors hover:text-gold">{p.label}</SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {(brand.address || phones.length > 0 || emails.length > 0) && (
          <div>
            <h4 className="text-[15px] font-semibold text-ivory">Get In Touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-sand/75">
              {brand.address && (
                <li className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-gold" /> {brand.address}</li>
              )}
              {phones.map((p, i) => (
                <li key={`p-${i}`} className="flex gap-2">
                  <Phone size={14} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    {p.label && <span className="text-sand/55">{p.label}: </span>}
                    <a href={`tel:${p.value.replace(/\s/g, "")}`} className="hover:text-gold">{p.value}</a>
                  </span>
                </li>
              ))}
              {emails.map((e, i) => (
                <li key={`e-${i}`} className="flex gap-2">
                  <Mail size={14} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    {e.label && <span className="text-sand/55">{e.label}: </span>}
                    <a href={`mailto:${e.value}`} className="hover:text-gold">{e.value}</a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mx-auto mt-14 w-full border-t border-gold/30 pt-6 text-center text-[13px] text-sand/70">
        <div>{copyright}&nbsp;</div>
        <div className="mt-1">
          <a
            href="https://wa.me/919945379333"
            target="_blank"
            rel="noreferrer"
            className="tracking-wider text-sand/70 transition-colors hover:text-gold"
          >
            DEVELOPED BY ROI INFOTECH
          </a>
        </div>
      </div>
    </footer>
  );
}
