import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { PropertyForm } from "@/components/admin/PropertyForm";
import {
  getProperty, updateProperty, deleteProperty,
  getPropertyImages, addPropertyImage, deletePropertyImage,
  listPropertyAmenityIds, setPropertyAmenities,
} from "@/lib/admin-properties";
import { listAssignments, saveAssignments } from "@/lib/property-assignments";

export const Route = createFileRoute("/admin/properties/$id")({
  component: EditProperty,
});

function EditProperty() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const propQ = useQuery({ queryKey: ["admin-property", id], queryFn: () => getProperty(id) });
  const imgsQ = useQuery({ queryKey: ["admin-property-images", id], queryFn: () => getPropertyImages(id) });
  const amenQ = useQuery({ queryKey: ["admin-property-amenities", id], queryFn: () => listPropertyAmenityIds(id) });
  const assignQ = useQuery({ queryKey: ["admin-property-assignments", id], queryFn: () => listAssignments(id) });

  const m = useMutation({
    mutationFn: async ({ values, images, amenityIds, assignments }: any) => {
      const existing = imgsQ.data ?? [];
      const keepUrls = new Set(images.filter((i: any) => i.id).map((i: any) => i.id));
      const toDelete = existing.filter((e: any) => !keepUrls.has(e.id));
      const toAdd = images.filter((i: any) => !i.id);

      await Promise.all([
        updateProperty(id, values),
        ...toDelete.map((e: any) => deletePropertyImage(e.id)),
        ...toAdd.map((img: any) =>
          addPropertyImage(id, img.url, img.image_type, img.caption || ""),
        ),
        setPropertyAmenities(id, amenityIds),
        saveAssignments(id, assignments ?? []),
      ]);
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-property", id] });
      qc.invalidateQueries({ queryKey: ["admin-property-images", id] });
      qc.invalidateQueries({ queryKey: ["admin-property-amenities", id] });
      qc.invalidateQueries({ queryKey: ["admin-property-assignments", id] });
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["public-properties"] });
      qc.invalidateQueries({ queryKey: ["recent-property-notifications"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const del = useMutation({
    mutationFn: () => deleteProperty(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["recent-property-notifications"] });
      navigate({ to: "/admin/properties" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (propQ.isLoading || imgsQ.isLoading || amenQ.isLoading || assignQ.isLoading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (!propQ.data) return <div className="text-sm text-red-600">Property not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link to="/admin/properties" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft size={14} /> Back to properties
        </Link>
        <button
          onClick={() => { if (confirm("Delete this property?")) del.mutate(); }}
          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold text-[#0a1f44]">{propQ.data.project_name}</h1>
      <p className="mt-1 font-mono text-xs text-slate-400">{propQ.data.slug}</p>
      <div className="mt-6">
        <PropertyForm
          initial={propQ.data}
          initialImages={(imgsQ.data ?? []).map((i: any) => ({ id: i.id, url: i.url, image_type: i.image_type, caption: i.caption }))}
          initialAmenityIds={amenQ.data ?? []}
          initialAssignments={assignQ.data ?? []}
          onSubmit={async (values, images, amenityIds, assignments) => { await m.mutateAsync({ values, images, amenityIds, assignments }); }}
          submitting={m.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
