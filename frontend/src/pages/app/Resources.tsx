import { useState, useEffect } from "react";
import { Upload, Search, Download, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "../../components/shared";
import { ResourcesSkeleton } from "../../components/skeletons";
import { resourceService } from "../../services/resource.service";
import type { Resource } from "../../services/resource.service";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { DragDropUploader } from "../../components/resources/DragDropUploader";

const TYPE_FILTERS = ["All", "PDF", "PPT", "DOCX", "MD"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

// Type to combine Resource with Group name for display
type EnrichedResource = Resource & { groupName: string; userRole: string };

export function Resources() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [resources, setResources] = useState<EnrichedResource[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const groupsData = await groupService.getGroups();
      setGroups(groupsData);

      let allResources: EnrichedResource[] = [];
      const token = localStorage.getItem("sf_token");
      let currentUserId = -1;
      if (token) {
        try { currentUserId = JSON.parse(atob(token.split('.')[1])).userId; } catch(e) {}
      }

      for (const group of groupsData) {
        try {
          const groupResources = await resourceService.getResources(group.id);
          const enriched = groupResources.map(r => {
            const memberRole = group.members?.find(m => m.user_id === currentUserId)?.role || "MEMBER";
            const canDelete = r.uploaded_by === currentUserId || memberRole === "ORGANIZER" || group.created_by === currentUserId;
            return {
              ...r,
              groupName: group.name,
              userRole: memberRole,
              canDelete
            };
          });
          allResources = [...allResources, ...enriched];
        } catch (e) {
          console.error(`Failed to fetch resources for group ${group.id}`);
        }
      }
      // Sort by created_at desc
      allResources.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setResources(allResources);
    } catch (err) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDelete = async (resourceId: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await resourceService.deleteResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast.success("Resource deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete resource");
    }
  };

  const filtered = resources.filter(r => {
    const typeLabel = resourceService.getFileIconType(r.mime_type, r.filename);
    const matchesType = typeFilter === "All" || typeLabel.includes(typeFilter) || (typeFilter === 'PPT' && typeLabel === 'PPTX');
    
    const fName = r.original_filename || r.filename || "";
    const gName = r.groupName || "";
    const matchesQuery = fName.toLowerCase().includes(query.toLowerCase()) || gName.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  if (loading) return <ResourcesSkeleton />;

  return (
    <div className="px-6 md:px-8 py-7 pb-12 max-w-[960px] mx-auto animate-[sfFade_0.25s_ease]">
      <PageHeader
        title="Resources"
        subtitle={`${resources.length} files across ${groups.length} groups`}
        actions={
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3.5 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        }
      />

      {/* Search + type filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search files…"
            className="flex-1 bg-transparent outline-none text-[13px] text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
          {TYPE_FILTERS.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-[12.5px] font-semibold transition-colors ${typeFilter === t ? "bg-primary text-white" : "text-muted-foreground hover:bg-background"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No resources found"
          description={query || typeFilter !== "All" ? "Try a different search or filter." : "Upload your first file to get started."}
          action={<button onClick={() => setIsUploadOpen(true)} className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5"><Upload className="w-4 h-4" /> Upload File</button>}
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {filtered.map((r) => {
            const typeLabel = resourceService.getFileIconType(r.mime_type, r.filename);
            const isPdf = typeLabel === 'PDF';
            const isDoc = typeLabel === 'DOCX';
            const isPpt = typeLabel === 'PPTX';
            
            const typeBg = isPdf ? 'bg-red-100' : isPpt ? 'bg-orange-100' : isDoc ? 'bg-blue-100' : 'bg-indigo-100';
            const typeColor = isPdf ? 'text-red-600' : isPpt ? 'text-orange-600' : isDoc ? 'text-blue-600' : 'text-indigo-600';
            
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border-soft last:border-0 hover:bg-background transition-colors group">
                <div className={`w-9 h-9 rounded-xl ${typeBg} ${typeColor} flex items-center justify-center text-[10px] font-extrabold shrink-0`}>
                  {typeLabel === 'PPTX' ? 'PPT' : typeLabel === 'DOCX' ? 'DOC' : typeLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{r.original_filename || r.filename || "Unknown file"}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{r.groupName} · {resourceService.formatFileSize(r.size)}</div>
                </div>
                <div className="text-[12px] text-muted-foreground shrink-0 hidden sm:block text-right">
                  <div className="font-medium">{r.uploader_name || `User ${r.uploaded_by}`}</div>
                  <div>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      toast.info("Downloading file...");
                      resourceService.downloadResource(r.id, r.original_filename).catch(err => {
                        toast.error(err.message || "Failed to download file");
                      });
                    }}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-primary-soft hover:text-primary hover:border-primary/20 transition-colors"
                    aria-label="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {/* @ts-ignore - injected above */}
                  {r.canDelete && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isUploadOpen && (
        <DragDropUploader 
          groups={groups}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => {
            setIsUploadOpen(false);
            toast.success("File uploaded successfully");
            fetchAllData();
          }}
        />
      )}
    </div>
  );
}
