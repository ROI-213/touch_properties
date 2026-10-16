import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Plus, Edit2, Trash2, Copy, Search, Star, Crown, Flame, Eye, EyeOff, Download, Share2, FilterX,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listProperties, deleteProperty, duplicateProperty, updateProperty,
} from "@/lib/admin-properties";
import { saveHotPropertySettings } from "@/lib/hot-property";
import { AdminPropertySearch } from "@/components/admin/AdminPropertySearch";
import { PropertyBulkActionBar } from "@/components/admin/PropertyBulkActionBar";
import { PropertyShareModal } from "@/components/admin/PropertyShareModal";

export const Route = createFileRoute("/admin/properties/")({
  component: PropertiesList,
});

function PropertiesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: listProperties,
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [listingFilter, setListingFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  
  // Share modal state
  const [shareTarget, setShareTarget] = useState<any[] | null>(null);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Debounced search & multi-field filtering
  const list = useMemo(() => {
    const arr = data ?? [];
    return arr.filter((p: any) => {
      if (typeFilter !== "All" && p.property_type !== typeFilter) return false;
      if (listingFilter !== "All" && p.listing_type !== listingFilter) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const searchFields = [
          p.project_name,
          p.id,
          p.slug,
          p.property_code,
          p.address,
          p.city,
          p.location?.locality,
          p.location?.zone,
          p.builder?.name,
          p.agent_name,
          p.owner_name,
          p.property_type,
          p.listing_type,
          p.project_status,
          p.starting_price != null ? String(p.starting_price) : "",
          Array.isArray(p.bhk_options) ? p.bhk_options.join(" ") : "",
        ].filter(Boolean).map((f) => String(f).toLowerCase());

        return searchFields.some((field) => field.includes(s));
      }
      return true;
    });
  }, [data, search, typeFilter, listingFilter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    qc.invalidateQueries({ queryKey: ["public-properties"] });
    qc.invalidateQueries({ queryKey: ["hot-property-settings"] });
    qc.invalidateQueries({ queryKey: ["recent-property-notifications"] });
  };

  const dup = useMutation({
    mutationFn: duplicateProperty,
    onSuccess: () => { toast.success("Duplicated"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFlag = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => updateProperty(id, patch),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message),
  });

  const setHot = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await saveHotPropertySettings({
        enabled: true,
        status: "active",
        property_id: active ? id : null,
      });
    },
    onSuccess: () => {
      toast.success("Hot Property updated successfully.");
      invalidate();
    },
    onError: () => toast.error("Unable to update Hot Property. Please try again."),
  });

  // Indeterminate & Selection State Logic
  const visibleSelectedCount = list.filter((p: any) => selected.has(p.id)).length;
  const allSelected = list.length > 0 && visibleSelectedCount === list.length;
  const isIndeterminate = visibleSelectedCount > 0 && visibleSelectedCount < list.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map((p: any) => p.id)));
    }
  };

  const toggleOne = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const runBulkDelete = async (ids: string[]) => {
    const t = toast.loading(`Deleting ${ids.length}…`);
    try {
      for (const id of ids) await deleteProperty(id);
      toast.success(`Deleted ${ids.length}`, { id: t });
      setSelected(new Set());
      invalidate();
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
    setConfirmDelete(null);
  };

  const exportCsv = (rows: any[]) => {
    const headers = ["ID", "Project", "Type", "Listing", "Price", "Locality", "Featured", "Active", "Created"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((p) => [
      p.id, p.project_name, p.property_type, p.listing_type,
      p.starting_price ?? "", p.location?.locality || "", p.is_featured, p.is_active, p.created_at,
    ].map(esc).join(",")).join("\n");
    const csv = headers.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedRows = (data ?? []).filter((p: any) => selected.has(p.id));

  const handleOpenBulkShare = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one property to share.");
      return;
    }
    setShareTarget(selectedRows);
  };

  const handleIndividualShare = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareTarget([p]);
  };

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setListingFilter("All");
  };

  return (
    <div className={selected.size > 0 ? "pb-24 md:pb-6" : ""}>
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0a1f44]">Properties Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {isLoading ? "Loading properties..." : `Showing ${list.length} of ${data?.length ?? 0} properties`}
          </p>
        </div>
        <Link
          to="/admin/properties/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#c9a961] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b89651] shadow-xs"
        >
          <Plus size={16} /> New Property
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center">
        <AdminPropertySearch
          value={search}
          onChange={setSearch}
          isSearching={isLoading}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Types</option>
            {["Apartment", "Villa", "Plot", "Commercial", "Residential"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Listings</option>
            {["Buy", "Rent", "Sell"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => exportCsv(list)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            title="Export current view to CSV"
          >
            <Download size={14} /> Export
          </button>

          {(search || typeFilter !== "All" || listingFilter !== "All") && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex h-11 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <FilterX size={14} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar Component */}
      <PropertyBulkActionBar
        selectedCount={selected.size}
        onShare={handleOpenBulkShare}
        onExportCsv={() => exportCsv(selectedRows)}
        onDeleteSelected={() => setConfirmDelete({ ids: [...selected], label: `${selected.size} properties` })}
        onClear={() => setSelected(new Set())}
      />

      {/* Desktop Table View */}
      <div className="hidden md:block mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3.5 w-12 text-center">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible properties"
                  className="h-4 w-4 rounded border-slate-300 accent-[#c9a961] cursor-pointer"
                />
              </th>
              <th className="p-3.5">Property</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Listing</th>
              <th className="p-3.5">Price</th>
              <th className="p-3.5">Flags</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={7} className="p-12 text-center text-slate-400">Searching and loading properties…</td></tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="mx-auto max-w-sm">
                    <p className="text-sm font-semibold text-slate-700">No properties found</p>
                    {search ? (
                      <p className="mt-1 text-xs text-slate-500">
                        No matches for "{search}". Try another title, location, or clear filters.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">No properties exist in this view.</p>
                    )}
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c9a961] hover:underline"
                    >
                      Clear search and filters →
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {list.map((p: any) => {
              const isSelected = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    isSelected ? "bg-[#c9a961]/10 hover:bg-[#c9a961]/15" : "hover:bg-slate-50/70"
                  }`}
                >
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleOne(p.id, e)}
                      aria-label={`Select ${p.project_name}`}
                      className="h-4 w-4 rounded border-slate-300 accent-[#c9a961] cursor-pointer"
                    />
                  </td>
                  <td className="p-3.5 min-w-[200px]">
                    <div className="font-semibold text-[#0a1f44]">{p.project_name}</div>
                    <div className="text-xs text-slate-500">
                      {p.builder?.name || "—"} · {p.location?.locality || p.address || "No location"}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-700 text-xs font-medium">{p.property_type}</td>
                  <td className="p-3.5"><Pill>{p.listing_type}</Pill></td>
                  <td className="p-3.5 font-numeric text-xs font-semibold text-slate-800">
                    {p.starting_price ? `₹ ${Number(p.starting_price).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      <FlagBtn active={p.is_featured} icon={Star} title="Featured" onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleFlag.mutate({ id: p.id, patch: { is_featured: !p.is_featured } }); }} />
                      <FlagBtn active={p.is_top_featured} icon={Crown} title="Top Featured" onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleFlag.mutate({ id: p.id, patch: { is_top_featured: !p.is_top_featured } }); }} />
                      <FlagBtn active={p.is_hot} icon={Flame} title={p.is_hot ? "Currently Hot Property" : "Make as Hot Property"} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setHot.mutate({ id: p.id, active: !p.is_hot }); }} />
                      <FlagBtn active={p.is_active} icon={p.is_active ? Eye : EyeOff} title={p.is_active ? "Active" : "Inactive"} onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleFlag.mutate({ id: p.id, patch: { is_active: !p.is_active } }); }} />
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleIndividualShare(p, e)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#c9a961] transition hover:bg-amber-50"
                        title="Share this property"
                      >
                        <Share2 size={14} />
                      </button>
                      <Link
                        to="/admin/properties/$id"
                        params={{ id: p.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        title="Edit Property"
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); dup.mutate(p.id); }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ ids: [p.id], label: `"${p.project_name}"` }); }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {isLoading && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Searching and loading properties…
          </div>
        )}
        {!isLoading && list.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">No properties found</p>
            <p className="mt-1 text-xs text-slate-500">Try refining your search query or clear filters.</p>
            <button
              onClick={clearAllFilters}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c9a961] hover:underline"
            >
              Clear search and filters →
            </button>
          </div>
        )}
        {!isLoading && list.map((p: any) => {
          const isSelected = selected.has(p.id);
          return (
            <div
              key={p.id}
              onClick={() => toggleOne(p.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-xs flex flex-col gap-3 transition-all cursor-pointer ${
                isSelected ? "border-[#c9a961] ring-2 ring-[#c9a961]/20 bg-[#c9a961]/5" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white shadow-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleOne(p.id, e)}
                      aria-label={`Select ${p.project_name}`}
                      className="h-4 w-4 rounded accent-[#c9a961] cursor-pointer"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-[#0a1f44] truncate">{p.project_name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {p.builder?.name || "—"} · {p.location?.locality || p.address || "No location"}
                    </div>
                  </div>
                </div>
                <Pill>{p.listing_type}</Pill>
              </div>

              <div className="flex items-center justify-between text-xs border-y border-slate-100 py-2">
                <span className="text-slate-500 font-medium">{p.property_type}</span>
                <span className="font-semibold text-slate-800">
                  {p.starting_price ? `₹ ${Number(p.starting_price).toLocaleString("en-IN")}` : "—"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <FlagBtn active={p.is_featured} icon={Star} title="Featured" onClick={() => toggleFlag.mutate({ id: p.id, patch: { is_featured: !p.is_featured } })} />
                  <FlagBtn active={p.is_top_featured} icon={Crown} title="Top Featured" onClick={() => toggleFlag.mutate({ id: p.id, patch: { is_top_featured: !p.is_top_featured } })} />
                  <FlagBtn active={p.is_hot} icon={Flame} title="Hot Property" onClick={() => setHot.mutate({ id: p.id, active: !p.is_hot })} />
                  <FlagBtn active={p.is_active} icon={p.is_active ? Eye : EyeOff} title="Active" onClick={() => toggleFlag.mutate({ id: p.id, patch: { is_active: !p.is_active } })} />
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleIndividualShare(p, e)}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-[#c9a961]"
                    title="Share Property"
                  >
                    <Share2 size={14} />
                  </button>
                  <Link
                    to="/admin/properties/$id"
                    params={{ id: p.id }}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </Link>
                  <button
                    onClick={() => dup.mutate(p.id)}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ ids: [p.id], label: `"${p.project_name}"` })}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal Dialog */}
      {shareTarget && (
        <PropertyShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          selectedProperties={shareTarget}
          onRemoveFromSelection={(idToRm) => {
            setShareTarget((cur) => (cur ? cur.filter((item) => item.id !== idToRm) : null));
          }}
        />
      )}

      {/* Bulk Delete Confirm Alert Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated images and listings will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => confirmDelete && runBulkDelete(confirmDelete.ids)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Pill({ children }: { children: any }) {
  return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">{children}</span>;
}

function FlagBtn({ active, icon: Icon, title, onClick }: any) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      className={`grid h-7 w-7 place-items-center rounded-lg transition ${
        active ? "bg-[#c9a961] text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
    >
      <Icon size={13} />
    </button>
  );
}
