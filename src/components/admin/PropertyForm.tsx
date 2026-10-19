import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Trash2,
  Plus,
  X,
  Upload,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  FileText,
  Settings2,
} from "lucide-react";
import {
  listBuilders,
  listLocations,
  listAmenities,
  upsertBuilder,
  upsertLocation,
  type PropertyRow,
} from "@/lib/admin-properties";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentsEditor } from "@/components/admin/AssignmentsEditor";
import type { AssignmentDraft } from "@/lib/property-assignments";
import { resolveLocalImage, FALLBACK_PROPERTY_IMAGE } from "@/data/siteImages";

export type PropertyFormValues = Partial<PropertyRow> & {
  project_name: string;
  property_type: PropertyRow["property_type"];
  listing_type: PropertyRow["listing_type"];
};

type ImageItem = {
  id?: string;
  url: string;
  image_type: "gallery" | "floor_plan" | "hero";
  caption?: string;
};

interface Props {
  initial?: Partial<PropertyRow>;
  initialImages?: ImageItem[];
  initialAmenityIds?: string[];
  initialAssignments?: AssignmentDraft[];
  onSubmit: (
    values: PropertyFormValues,
    images: ImageItem[],
    amenityIds: string[],
    assignments: AssignmentDraft[],
    addAnother?: boolean,
  ) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  showSaveAndNew?: boolean;
}

const PROPERTY_TYPES = [
  { value: "Apartment", label: "Apartment", emoji: "🏢" },
  { value: "Villa", label: "Villa", emoji: "🏡" },
  { value: "Plot", label: "Plot", emoji: "🌳" },
  { value: "Commercial", label: "Commercial", emoji: "🏪" },
  { value: "Residential", label: "Residential", emoji: "🏘️" },
] as const;

const LISTING_TYPES = ["Buy", "Rent", "Sell"] as const;

const COMMON_BHK_PILLS = ["1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "3.5 BHK", "4 BHK", "4+ BHK"];

const ZONE_OPTIONS = ["East Bangalore", "North Bangalore", "South Bangalore", "West Bangalore", "Central Bangalore"];

type ListItem = { title?: string; subtitle?: string; icon?: string };

function formatINRPreview(n: number | null | undefined): string {
  if (!n || n <= 0) return "";
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} Lakhs`;
  return `₹ ${n.toLocaleString("en-IN")}`;
}

export function PropertyForm({
  initial = {},
  initialImages = [],
  initialAmenityIds = [],
  initialAssignments = [],
  onSubmit,
  submitting,
  submitLabel = "Save Property",
  showSaveAndNew = false,
}: Props) {
  const qc = useQueryClient();

  const [v, setV] = useState<any>({
    project_name: "",
    property_type: "Apartment",
    listing_type: "Buy",
    bhk_options: [],
    is_active: true,
    is_ready_to_move: false,
    ...initial,
  });

  // Smart price helper state (allows typing e.g. 1.5 Cr or 85 Lakhs directly)
  const [priceUnit, setPriceUnit] = useState<"Cr" | "Lakhs" | "Raw">(() => {
    const sp = Number(initial.starting_price) || 0;
    if (sp >= 10000000) return "Cr";
    if (sp >= 100000) return "Lakhs";
    return "Cr";
  });
  const [priceInput, setPriceInput] = useState<string>(() => {
    const sp = Number(initial.starting_price) || 0;
    if (!sp) return "";
    if (sp >= 10000000) return String(Number((sp / 10000000).toFixed(3)));
    if (sp >= 100000) return String(Number((sp / 100000).toFixed(2)));
    return String(sp);
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    const hero = initial.hero_image?.trim();
    if (hero && !initialImages.some((img) => img.url === hero)) {
      return [{ url: hero, image_type: "hero", caption: "" }, ...initialImages];
    }
    return initialImages;
  });
  const [amenityIds, setAmenityIds] = useState<string[]>(initialAmenityIds);
  const [assignments, setAssignments] = useState<AssignmentDraft[]>(initialAssignments);
  const [imgType, setImgType] = useState<ImageItem["image_type"]>("gallery");
  const [uploading, setUploading] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quick-add inline Builder, Owner & Location states
  const [addingBuilder, setAddingBuilder] = useState(false);
  const [newBuilderName, setNewBuilderName] = useState("");
  const [savingBuilder, setSavingBuilder] = useState(false);

  const [addingOwner, setAddingOwner] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);

  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocZone, setNewLocZone] = useState("East Bangalore");
  const [newLocLocality, setNewLocLocality] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  const builders = useQuery({ queryKey: ["admin-builders"], queryFn: listBuilders });
  const locations = useQuery({ queryKey: ["admin-locations"], queryFn: listLocations });
  const amenities = useQuery({ queryKey: ["admin-amenities"], queryFn: listAmenities });
  const staff = useQuery({
    queryKey: ["admin-staff-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users" as any)
        .select("id, name, email, mobile, designation, status")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));
  const details = (v.details ?? {}) as Record<string, any>;
  const setD = (k: string, val: any) =>
    setV((s: any) => ({ ...s, details: { ...(s.details ?? {}), [k]: val } }));

  const getList = (k: string): ListItem[] => (Array.isArray(details[k]) ? details[k] : []);
  const setList = (k: string, next: ListItem[]) => setD(k, next);
  const addItem = (k: string) => setList(k, [...getList(k), { title: "", subtitle: "", icon: "" }]);
  const updItem = (k: string, i: number, patch: Partial<ListItem>) =>
    setList(
      k,
      getList(k).map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );
  const rmItem = (k: string, i: number) =>
    setList(
      k,
      getList(k).filter((_, idx) => idx !== i),
    );

  // Sync smart price input to v.starting_price
  const handlePriceChange = (rawVal: string, unit: "Cr" | "Lakhs" | "Raw") => {
    setPriceInput(rawVal);
    const num = parseFloat(rawVal);
    if (!rawVal.trim() || Number.isNaN(num) || num <= 0) {
      setPriceUnit(unit);
      set("starting_price", null);
      return;
    }
    // If user typed a large full rupee amount (e.g. 22000000), auto-switch to Raw ₹ so it doesn't multiply by Cr
    const effectiveUnit = num >= 100000 && unit !== "Raw" ? "Raw" : unit;
    setPriceUnit(effectiveUnit);
    const multiplier = effectiveUnit === "Cr" ? 10000000 : effectiveUnit === "Lakhs" ? 100000 : 1;
    const rupees = Math.round(num * multiplier);
    set("starting_price", rupees);
  };

  // Toggle BHK pill
  const bhkList: string[] = Array.isArray(v.bhk_options) ? v.bhk_options : [];
  const toggleBhk = (label: string) => {
    const exists = bhkList.includes(label);
    const next = exists ? bhkList.filter((x) => x !== label) : [...bhkList, label];
    set("bhk_options", next);
  };

  // Toggle Amenity
  const toggleAmenity = (id: string) =>
    setAmenityIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Quick Add Builder inline
  const handleQuickAddBuilder = async () => {
    if (!newBuilderName.trim()) return toast.error("Enter builder name");
    setSavingBuilder(true);
    try {
      const created = await upsertBuilder({
        name: newBuilderName.trim(),
        contact_type: "builder",
      } as any);
      await qc.invalidateQueries({ queryKey: ["admin-builders"] });
      set("builder_id", created.id);
      setNewBuilderName("");
      setAddingBuilder(false);
      toast.success(`Added builder "${created.name}"`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add builder");
    } finally {
      setSavingBuilder(false);
    }
  };

  // Quick Add Owner inline
  const handleQuickAddOwner = async () => {
    if (!newOwnerName.trim()) return toast.error("Enter owner's name");
    setSavingOwner(true);
    try {
      const created = await upsertBuilder({
        name: newOwnerName.trim(),
        display_name: newOwnerName.trim(),
        contact_type: "owner",
        primary_phone: newOwnerPhone.trim() || null,
        whatsapp_number: newOwnerPhone.trim() || null,
      } as any);
      await qc.invalidateQueries({ queryKey: ["admin-builders"] });
      set("owner_id", created.id);
      setD("owner_name", created.display_name || created.name);
      setNewOwnerName("");
      setNewOwnerPhone("");
      setAddingOwner(false);
      toast.success(`Added owner "${created.name}"`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add owner");
    } finally {
      setSavingOwner(false);
    }
  };

  // Quick Add Location inline
  const handleQuickAddLocation = async () => {
    if (!newLocLocality.trim()) return toast.error("Enter locality / area name");
    setSavingLocation(true);
    try {
      const created = await upsertLocation({
        zone: newLocZone,
        locality: newLocLocality.trim(),
      });
      await qc.invalidateQueries({ queryKey: ["admin-locations"] });
      set("location_id", created.id);
      if (!v.address) {
        set("address", `${created.locality}, ${created.zone}, Bengaluru`);
      }
      setNewLocLocality("");
      setAddingLocation(false);
      toast.success(`Added location "${created.locality}"`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add location");
    } finally {
      setSavingLocation(false);
    }
  };

  const uploadOne = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `properties/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) throw error;
    const TEN_YEARS_S = 60 * 60 * 24 * 365 * 10;
    const { data, error: signErr } = await supabase.storage
      .from("property-media")
      .createSignedUrl(path, TEN_YEARS_S);
    if (signErr) throw signErr;
    return data.signedUrl;
  };

  // Parallel file upload for speed
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const list = Array.from(files);
    try {
      const results = await Promise.allSettled(list.map((file) => uploadOne(file)));
      const uploaded: ImageItem[] = [];
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          uploaded.push({ url: res.value, image_type: imgType, caption: "" });
        } else {
          toast.error(`${list[idx].name}: ${res.reason?.message || "upload failed"}`);
        }
      });

      if (uploaded.length) {
        setImages((cur) => {
          const next = [...cur, ...uploaded];
          if ((!v.hero_image || !cur.some((img) => img.url === v.hero_image)) && uploaded[0]?.url) {
            set("hero_image", uploaded[0].url);
          }
          return next;
        });
        toast.success(`Uploaded ${uploaded.length} photo${uploaded.length > 1 ? "s" : ""}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (!v.project_name?.trim()) {
      toast.error("Please enter the Project / Property Name");
      return;
    }
    const primaries = assignments.filter((a) => a.is_primary).length;
    if (primaries > 1) {
      toast.error("Only one primary contact is allowed.");
      return;
    }
    for (const a of assignments) {
      if (!a.staff_name?.trim() || !a.phone?.trim()) {
        toast.error("Every assigned staff needs a name and phone number.");
        return;
      }
    }

    const activeCover =
      images.find((img) => img.url === v.hero_image)?.url || images[0]?.url || null;

    const finalValues = {
      ...v,
      hero_image: activeCover,
    };

    await onSubmit(finalValues, images, amenityIds, assignments, addAnother);
  };

  const filteredAmenities = (amenities.data ?? []).filter((a: any) =>
    !amenitySearch.trim()
      ? true
      : a.name?.toLowerCase().includes(amenitySearch.trim().toLowerCase()) ||
        a.category?.toLowerCase().includes(amenitySearch.trim().toLowerCase()),
  );

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 pb-24">
      {/* ==================== STEP 1: ESSENTIAL DETAILS ==================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a1f44] text-[#c9a961]">
            <Building2 size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0a1f44]">1. Property Basics</h2>
            <p className="text-xs text-slate-500">
              Enter the project name, sub title, owner&apos;s name, builder, and status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Project / Property Name *</label>
            <input
              className={`${input} text-base font-medium`}
              placeholder="e.g. FOR SALE | PREMIUM 3 BHK APARTMENT / Prestige Somerville"
              value={v.project_name || ""}
              onChange={(e) => set("project_name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Listing For *</label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 p-1">
              {LISTING_TYPES.map((lt) => {
                const active = v.listing_type === lt;
                return (
                  <button
                    key={lt}
                    type="button"
                    onClick={() => set("listing_type", lt)}
                    className={`rounded-md py-2 text-xs font-bold transition ${
                      active
                        ? "bg-[#0a1f44] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#0a1f44]"
                    }`}
                  >
                    {lt.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub Title / Tagline */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Sub Title / Tagline (Displayed below Property Name)</label>
            <input
              className={input}
              placeholder="e.g. DSR Parkway | Bellandur, Bengaluru — ✨ Spacious Semi-Furnished Home with 2 Covered Car Parks"
              value={details.subtitle ?? details.tagline ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setV((s: any) => ({
                  ...s,
                  details: { ...(s.details ?? {}), subtitle: val, tagline: val },
                }));
              }}
            />
          </div>

          {/* Property Type visual pills */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Property Type *</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((pt) => {
                const active = v.property_type === pt.value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => set("property_type", pt.value)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                      active
                        ? "border-[#c9a961] bg-[#c9a961]/15 text-[#0a1f44] ring-1 ring-[#c9a961]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{pt.emoji}</span>
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Owner's Name (Owner / Seller) with inline + Quick Add */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Owner&apos;s Name (Owner / Seller)
              </label>
              <button
                type="button"
                onClick={() => setAddingOwner((s) => !s)}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#c9a961] hover:underline"
              >
                <Plus size={12} /> {addingOwner ? "Cancel" : "Add New Owner"}
              </button>
            </div>
            {addingOwner ? (
              <div className="space-y-1.5">
                <input
                  className={input}
                  placeholder="Owner's Name *"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                />
                <div className="flex gap-1.5">
                  <input
                    className={input}
                    placeholder="Owner Phone (Optional)"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={savingOwner}
                    onClick={handleQuickAddOwner}
                    className="shrink-0 rounded-lg bg-[#0a1f44] px-3 text-xs font-semibold text-white hover:bg-[#0a1f44]/90"
                  >
                    {savingOwner ? "…" : "Add"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  className={input}
                  value={v.owner_id || ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    set("owner_id", id);
                    const found = (builders.data ?? []).find((b: any) => b.id === id);
                    if (found) {
                      setD("owner_name", found.display_name || found.name);
                    }
                  }}
                >
                  <option value="">— Select Owner / Seller —</option>
                  {(builders.data ?? [])
                    .filter((b: any) =>
                      ["owner", "land_owner", "individual_seller"].includes(b.contact_type),
                    )
                    .map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.display_name || b.name}
                        {b.primary_phone ? ` · ${b.primary_phone}` : ""}
                      </option>
                    ))}
                </select>
                <input
                  className={input}
                  placeholder="Or type Owner's Name directly (e.g. Sreeja Rakesh)"
                  value={details.owner_name || ""}
                  onChange={(e) => setD("owner_name", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Builder with inline + Quick Add */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Builder / Developer
              </label>
              <button
                type="button"
                onClick={() => setAddingBuilder((s) => !s)}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#c9a961] hover:underline"
              >
                <Plus size={12} /> {addingBuilder ? "Cancel" : "Add New"}
              </button>
            </div>
            {addingBuilder ? (
              <div className="flex gap-1.5">
                <input
                  className={input}
                  placeholder="New builder name…"
                  value={newBuilderName}
                  onChange={(e) => setNewBuilderName(e.target.value)}
                />
                <button
                  type="button"
                  disabled={savingBuilder}
                  onClick={handleQuickAddBuilder}
                  className="shrink-0 rounded-lg bg-[#0a1f44] px-3 text-xs font-semibold text-white hover:bg-[#0a1f44]/90"
                >
                  {savingBuilder ? "…" : "Add"}
                </button>
              </div>
            ) : (
              <select
                className={input}
                value={v.builder_id || ""}
                onChange={(e) => set("builder_id", e.target.value || null)}
              >
                <option value="">— Select Builder —</option>
                {(builders.data ?? [])
                  .filter((b: any) => ["builder", "developer"].includes(b.contact_type ?? "builder"))
                  .map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.display_name || b.name}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Possession Status & RERA */}
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Project Status</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
                {[
                  { label: "Ready to Move", ready: true, status: "Ready to Move" },
                  { label: "Under Construction", ready: false, status: "Under Construction" },
                ].map((st) => {
                  const active = Boolean(v.is_ready_to_move) === st.ready;
                  return (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => {
                        set("is_ready_to_move", st.ready);
                        set("project_status", st.status);
                        setD("occupancy_status", st.ready ? "Ready to Occupy" : "Under Construction");
                      }}
                      className={`rounded-md py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-white text-[#0a1f44] shadow-xs"
                          : "text-slate-600 hover:text-[#0a1f44]"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={input}
                placeholder="Possession (e.g. Ready)"
                value={v.possession_date || ""}
                onChange={(e) => set("possession_date", e.target.value)}
              />
              <input
                className={input}
                placeholder="RERA No."
                value={v.rera_number || ""}
                onChange={(e) => set("rera_number", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STEP 2: PRICE, BHK & PROPERTY SPECIFICATIONS ==================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a1f44] text-[#c9a961]">
              <IndianRupee size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0a1f44]">
                2. Price, BHK &amp; Property Specifications
              </h2>
              <p className="text-xs text-slate-500">
                Enter price, area, configurations, floor, facing, furnishing, parking &amp; khata
              </p>
            </div>
          </div>
          {v.starting_price ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              Displays as: {formatINRPreview(v.starting_price)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Smart Price Input */}
          <div>
            <label className={labelCls}>Starting / Expected Price *</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="any"
                className={input}
                placeholder={priceUnit === "Cr" ? "e.g. 2.20" : priceUnit === "Lakhs" ? "e.g. 75" : "e.g. 22000000"}
                value={priceInput}
                onChange={(e) => handlePriceChange(e.target.value, priceUnit)}
              />
              <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["Cr", "Lakhs", "Raw"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handlePriceChange(priceInput, u)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                      priceUnit === u
                        ? "bg-[#c9a961] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {u === "Raw" ? "₹" : u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Carpet / Super Built-up Area */}
          <div>
            <label className={labelCls}>Super Built-up / Carpet Area (Sq.ft)</label>
            <input
              className={input}
              placeholder="e.g. 1528 Sq. Ft."
              value={v.carpet_area || details.super_builtup_area || ""}
              onChange={(e) => {
                const val = e.target.value;
                set("carpet_area", val);
                setD("super_builtup_area", val);
              }}
            />
          </div>

          {/* Price Status / Negotiable */}
          <div>
            <label className={labelCls}>Price Status &amp; Land Parcel</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className={input}
                value={details.price_suffix || ""}
                onChange={(e) => setD("price_suffix", e.target.value)}
              >
                <option value="">Negotiable ✓</option>
                {["Negotiable", "Fixed Price", "All Inclusive", "Starting Price"].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <input
                className={input}
                placeholder="Land (e.g. 10 Acres)"
                value={v.land_parcel || ""}
                onChange={(e) => set("land_parcel", e.target.value)}
              />
            </div>
          </div>

          {/* 1-Click BHK Pills */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Select Configurations (Tap to select multiple)</label>
            <div className="flex flex-wrap items-center gap-2">
              {COMMON_BHK_PILLS.map((bhk) => {
                const active = bhkList.includes(bhk);
                return (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => toggleBhk(bhk)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#0a1f44] bg-[#0a1f44] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {active && <Check size={12} />}
                    {bhk}
                  </button>
                );
              })}
              <input
                className="w-48 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#c9a961]"
                placeholder="Or type custom (comma sep)"
                value={bhkList.join(", ")}
                onChange={(e) =>
                  set(
                    "bhk_options",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          </div>

          {/* Key Property Specifications (Shown on Frontend Detail Page) */}
          <div>
            <label className={labelCls}>Floor Details</label>
            <input
              className={input}
              placeholder="e.g. 7th of 14 Floors"
              value={details.floor_details || ""}
              onChange={(e) => setD("floor_details", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Main Door Facing</label>
            <input
              className={input}
              placeholder="e.g. West / East / North"
              value={details.facing_direction || ""}
              onChange={(e) => setD("facing_direction", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Car Parking</label>
            <input
              className={input}
              placeholder="e.g. 2 Covered Car Parks"
              value={details.covered_parking || ""}
              onChange={(e) => setD("covered_parking", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Bathrooms &amp; Balconies</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={input}
                placeholder="Bathrooms (e.g. 2)"
                value={details.bathrooms || ""}
                onChange={(e) => setD("bathrooms", e.target.value)}
              />
              <input
                className={input}
                placeholder="Balcony (e.g. 1 + Utility)"
                value={details.balconies || ""}
                onChange={(e) => setD("balconies", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Furnishing Status</label>
            <select
              className={input}
              value={details.interior_status || ""}
              onChange={(e) => setD("interior_status", e.target.value)}
            >
              <option value="">— Select Furnishing —</option>
              {["Semi-Furnished", "Fully Furnished", "Unfurnished", "Basic Interiors Completed"].map(
                (o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className={labelCls}>Khata &amp; Maintenance</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={input}
                placeholder="Khata (e.g. E-Khata)"
                value={details.khata_type || ""}
                onChange={(e) => setD("khata_type", e.target.value)}
              />
              <input
                className={input}
                placeholder="Maint. (e.g. ₹6,000/mo)"
                value={details.maintenance_charges || ""}
                onChange={(e) => setD("maintenance_charges", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STEP 3: LOCATION & PHOTOS ==================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a1f44] text-[#c9a961]">
            <MapPin size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0a1f44]">3. Location & Photos</h2>
            <p className="text-xs text-slate-500">
              Pick or add a locality and upload property photos (first photo becomes the cover image)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Location with inline Quick Add */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Zone & Locality
              </label>
              <button
                type="button"
                onClick={() => setAddingLocation((s) => !s)}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#c9a961] hover:underline"
              >
                <Plus size={12} /> {addingLocation ? "Cancel" : "Add New Locality"}
              </button>
            </div>
            {addingLocation ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[140px_1fr_auto]">
                <select
                  className={input}
                  value={newLocZone}
                  onChange={(e) => setNewLocZone(e.target.value)}
                >
                  {ZONE_OPTIONS.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
                <input
                  className={input}
                  placeholder="Locality (e.g. Whitefield)"
                  value={newLocLocality}
                  onChange={(e) => setNewLocLocality(e.target.value)}
                />
                <button
                  type="button"
                  disabled={savingLocation}
                  onClick={handleQuickAddLocation}
                  className="rounded-lg bg-[#0a1f44] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0a1f44]/90"
                >
                  {savingLocation ? "…" : "Add"}
                </button>
              </div>
            ) : (
              <select
                className={input}
                value={v.location_id || ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  set("location_id", id);
                  const found = (locations.data ?? []).find((l: any) => l.id === id);
                  if (found && !v.address) {
                    set("address", `${found.locality}, ${found.zone}, Bengaluru`);
                  }
                }}
              >
                <option value="">— Select Zone / Locality —</option>
                {(locations.data ?? []).map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.zone} · {l.locality}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={labelCls}>Full Address / Location Text</label>
            <input
              className={input}
              placeholder="e.g. Whitefield Main Road, East Bangalore"
              value={v.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </div>

        {/* Fast Photo Upload Dropzone */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className={labelCls}>Property Photos ({images.length} uploaded)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Upload as:</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                value={imgType}
                onChange={(e) => setImgType(e.target.value as any)}
              >
                <option value="gallery">Gallery Photo</option>
                <option value="floor_plan">Floor Plan</option>
                <option value="hero">Hero Banner</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center transition hover:border-[#c9a961] hover:bg-[#c9a961]/5">
            <Upload size={24} className="text-[#c9a961]" />
            <span className="mt-2 text-sm font-semibold text-[#0a1f44]">
              {uploading ? "Uploading photos…" : "Click to select photos (Multiple allowed)"}
            </span>
            <span className="mt-0.5 text-xs text-slate-500">
              JPG, PNG, WEBP — The cover photo is highlighted with a gold star
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                const fs = e.target.files;
                if (fs && fs.length) void handleFileUpload(fs);
                e.target.value = "";
              }}
            />
          </label>

          {/* Uploaded Photo Grid */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {images.map((img, i) => {
                const isCover =
                  v.hero_image === img.url ||
                  (!images.some((x) => x.url === v.hero_image) && i === 0);
                return (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-xl border bg-white transition ${
                      isCover ? "border-2 border-[#c9a961] ring-2 ring-[#c9a961]/20" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={resolveLocalImage(img.url, FALLBACK_PROPERTY_IMAGE)}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                    <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          set("hero_image", img.url);
                          toast.success("Set as cover photo");
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
                          isCover
                            ? "bg-[#c9a961] text-white"
                            : "bg-black/60 text-white hover:bg-[#c9a961]"
                        }`}
                      >
                        <Star size={10} className={isCover ? "fill-white" : ""} />
                        {isCover ? "Cover" : "Set Cover"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = images.filter((_, idx) => idx !== i);
                          setImages(next);
                          if (v.hero_image === img.url) {
                            set("hero_image", next[0]?.url || null);
                          }
                        }}
                        className="grid h-6 w-6 place-items-center rounded-full bg-red-600/90 text-white shadow hover:bg-red-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-600 bg-slate-50">
                      <span className="font-medium capitalize">{img.image_type.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Optional Brochure PDF */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <FileText size={15} className="text-[#c9a961]" />
              <span>Brochure PDF (Optional):</span>
              {v.brochure_url ? (
                <a
                  href={v.brochure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#c9a961] underline"
                >
                  View Uploaded PDF
                </a>
              ) : (
                <span className="text-slate-400">None uploaded</span>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {uploading ? "Uploading…" : "Upload PDF"}
              <input
                type="file"
                accept="application/pdf"
                disabled={uploading}
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setUploading(true);
                  try {
                    const url = await uploadOne(f);
                    set("brochure_url", url);
                    toast.success("Brochure uploaded");
                  } catch (err: any) {
                    toast.error(err.message || "Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ==================== STEP 4: PROPERTY DETAILS, LOCATION ADVANTAGE, IDEAL FOR & AMENITIES ==================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a1f44] text-[#c9a961]">
            <Sparkles size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0a1f44]">
              4. Property Details, Location Advantage, Ideal For &amp; Amenities
            </h2>
            <p className="text-xs text-slate-500">
              Add property details, location advantages, ideal buyer/tenant profile, and homepage placement
            </p>
          </div>
        </div>

        {/* Homepage Placement Flags */}
        <div>
          <label className={labelCls}>Website Visibility &amp; Homepage Sections</label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["is_active", "Active (Live)"],
              ["is_featured", "Featured Property"],
              ["is_top_featured", "Top 10 Property"],
              ["is_hot", "Hot Property"],
              ["is_trending", "Trending"],
              ["is_new_launch", "New Launch"],
            ].map(([k, label]) => {
              const checked = !!v[k];
              return (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    checked
                      ? "border-[#c9a961] bg-[#c9a961]/15 text-[#0a1f44]"
                      : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(k, e.target.checked)}
                    className="h-4 w-4 accent-[#c9a961]"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Description, Property Details, Location Advantage & Ideal For */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className={labelCls}>About This Property (Overview / Description)</label>
            <textarea
              rows={5}
              className={input}
              value={v.overview || ""}
              onChange={(e) => set("overview", e.target.value)}
              placeholder="Write a detailed overview about this property, community living, and project summary…"
            />
          </div>
          <div>
            <label className={labelCls}>🏠 Property Details &amp; Highlights (One per line)</label>
            <textarea
              rows={5}
              className={input}
              value={v.highlights ?? details.property_details ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                set("highlights", val);
                setD("property_details", val);
              }}
              placeholder={
                "Society: DSR Parkway\nConfiguration: 3 BHK\nBathrooms: 2 | Balcony: 1 | Utility Area: 1\nSuper Built-up Area: 1,528 Sq. Ft.\nFloor: 7th of 14 Floors\nMain Door Facing: West\nFurnishing: Semi-Furnished\nCar Parking: 2 Covered Car Parks\nKhata: E-Khata"
              }
            />
          </div>
          <div>
            <label className={labelCls}>📍 Location Advantage (One per line)</label>
            <textarea
              rows={5}
              className={input}
              value={v.location_advantages ?? details.location_advantages ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                set("location_advantages", val);
                setD("location_advantages", val);
              }}
              placeholder={
                "Convenient access to Sarjapur Road and Bellandur.\nConnectivity to Bengaluru’s major IT and business hubs.\nSuitable for professionals working in the Outer Ring Road IT corridor.\nAccess to schools, hospitals, supermarkets, and restaurants."
              }
            />
          </div>
          <div>
            <label className={labelCls}>👨‍👩‍👧‍👦 Ideal For (One per line)</label>
            <textarea
              rows={5}
              className={input}
              value={details.ideal_for || ""}
              onChange={(e) => setD("ideal_for", e.target.value)}
              placeholder={
                "Families seeking a spacious 3 BHK apartment.\nIT professionals working around Bellandur and the Outer Ring Road.\nBuyers looking for a home in an established residential community.\nInvestors exploring residential property in East Bengaluru."
              }
            />
          </div>
        </div>

        {/* Amenities with quick search & Select All / Clear */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className={labelCls}>
              Amenities ({amenityIds.length} selected)
            </label>
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-[#c9a961]"
                placeholder="Search amenities…"
                value={amenitySearch}
                onChange={(e) => setAmenitySearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setAmenityIds((amenities.data ?? []).map((a: any) => a.id))}
                className="text-xs font-semibold text-[#c9a961] hover:underline"
              >
                Select All
              </button>
              {amenityIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAmenityIds([])}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAmenities.map((a: any) => {
              const checked = amenityIds.includes(a.id);
              return (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    checked
                      ? "border-[#c9a961] bg-[#c9a961]/10 font-semibold text-[#0a1f44]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(a.id)}
                    className="h-3.5 w-3.5 accent-[#c9a961]"
                  />
                  <span className="truncate">{a.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Assigned Staff */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Assigned Staff (For Enquiries)</label>
            <select
              className={input}
              value={v.assigned_staff_id || ""}
              onChange={(e) => set("assigned_staff_id", e.target.value || null)}
            >
              <option value="">— Default Company Contact —</option>
              {(staff.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.designation ? ` · ${s.designation}` : ""}
                  {s.mobile ? ` · ${s.mobile}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Google Maps Link (Optional)</label>
            <input
              className={input}
              placeholder="https://maps.google.com/..."
              value={v.map_link || ""}
              onChange={(e) => set("map_link", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ==================== OPTIONAL ADVANCED SETTINGS ACCORDION ==================== */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <Settings2 size={18} className="text-slate-500" />
            <div>
              <div className="text-sm font-bold text-[#0a1f44]">
                Advanced Details (Optional)
              </div>
              <div className="text-xs text-slate-500">
                Extra tower/floor specs, nearby landmarks, poster settings, SEO & additional staff
              </div>
            </div>
          </div>
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showAdvanced && (
          <div className="space-y-6 border-t border-slate-200 p-5 sm:p-6">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#0a1f44]">
                Extra Project Specifications
              </h3>
              <Grid>
                <Field label="Custom URL Slug">
                  <input
                    className={input}
                    value={v.slug || ""}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="auto-generated if blank"
                  />
                </Field>
                <Field label="Price / Sqft (₹)">
                  <input
                    type="number"
                    className={input}
                    value={v.price_per_sqft ?? ""}
                    onChange={(e) =>
                      set("price_per_sqft", e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </Field>
                <Field label="Price Display Text Override">
                  <input
                    className={input}
                    value={details.price_display_text || ""}
                    onChange={(e) => setD("price_display_text", e.target.value)}
                    placeholder="e.g. ₹ 3.50 Crore"
                  />
                </Field>
                <Field label="Towers">
                  <input
                    type="number"
                    className={input}
                    value={v.towers ?? ""}
                    onChange={(e) => set("towers", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label="Floors">
                  <input
                    type="number"
                    className={input}
                    value={v.floors ?? ""}
                    onChange={(e) => set("floors", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label="Total Units">
                  <input
                    type="number"
                    className={input}
                    value={v.total_units ?? ""}
                    onChange={(e) =>
                      set("total_units", e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </Field>
                <Field label="Facing Direction">
                  <input
                    className={input}
                    value={details.facing_direction || ""}
                    onChange={(e) => setD("facing_direction", e.target.value)}
                    placeholder="East / North"
                  />
                </Field>
                <Field label="Display Order">
                  <input
                    type="number"
                    className={input}
                    value={v.display_order ?? 0}
                    onChange={(e) => set("display_order", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="SEO Title">
                  <input
                    className={input}
                    value={v.seo_title || ""}
                    onChange={(e) => set("seo_title", e.target.value)}
                  />
                </Field>
              </Grid>
            </div>

            {/* Nearby Connectivity */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#0a1f44]">
                Nearby Landmarks & Connectivity
              </h3>
              <div className="space-y-4">
                {[
                  {
                    key: "connectivity",
                    title: "Connectivity",
                    ph: { title: "RGA Tech Park", subtitle: "5 mins" },
                  },
                  {
                    key: "nearby_schools",
                    title: "Nearby Schools",
                    ph: { title: "Oakridge International", subtitle: "10 mins" },
                  },
                  {
                    key: "nearby_hospitals",
                    title: "Nearby Hospitals",
                    ph: { title: "Manipal Hospital", subtitle: "12 mins" },
                  },
                ].map((section) => (
                  <div key={section.key} className="rounded-lg border border-slate-200 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#0a1f44]">{section.title}</div>
                      <button
                        type="button"
                        onClick={() => addItem(section.key)}
                        className="inline-flex items-center gap-1 rounded-md bg-[#0a1f44] px-2 py-1 text-xs text-white"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {getList(section.key).map((it, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            className={input}
                            placeholder={section.ph.title}
                            value={it.title || ""}
                            onChange={(e) => updItem(section.key, i, { title: e.target.value })}
                          />
                          <input
                            className={input}
                            placeholder={section.ph.subtitle}
                            value={it.subtitle || ""}
                            onChange={(e) => updItem(section.key, i, { subtitle: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => rmItem(section.key, i)}
                            className="grid h-9 w-9 place-items-center rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Staff Assignments */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0a1f44]">
                Additional Contacts Shown on Property Page
              </h3>
              <AssignmentsEditor value={assignments} onChange={setAssignments} />
            </div>
          </div>
        )}
      </div>

      {/* ==================== STICKY BOTTOM ACTION BAR ==================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur shadow-[0_-4px_20px_rgba(15,23,42,0.06)] lg:left-60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="hidden sm:block text-xs text-slate-500">
            {v.project_name ? (
              <span>
                Ready to save <strong className="text-[#0a1f44]">{v.project_name}</strong>
              </span>
            ) : (
              <span>Fill in Project Name and Price to publish immediately</span>
            )}
          </div>
          <div className="flex w-full sm:w-auto items-center justify-end gap-2.5">
            {showSaveAndNew && (
              <button
                type="button"
                disabled={submitting || uploading}
                onClick={(e) => handleSubmit(e as any, true)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#0a1f44] bg-white px-4 text-xs sm:text-sm font-semibold text-[#0a1f44] hover:bg-slate-50 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save & Add Another"}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex h-10 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg bg-[#c9a961] px-6 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#b89651] disabled:opacity-50"
            >
              <Check size={16} />
              {submitting ? "Saving Property…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

const input =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/15";

const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-1 sm:col-span-2 lg:col-span-3" : ""}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
