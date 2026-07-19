import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { groupService } from "../../services/group.service";
import type { Group } from "../../services/group.service";
import { sessionService } from "../../services/session.service";
import { resourceService } from "../../services/resource.service";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSessionModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupResources, setGroupResources] = useState<any[]>([]);

  const [groupId, setGroupId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      groupService.getGroups().then(setGroups).catch(console.error);
    } else {
      // reset state when closed
      setGroupId("");
      setTitle("");
      setDescription("");
      setAgenda("");
      setDate("");
      setTime("");
      setDuration(60);
      setSelectedResources([]);
      setGroupResources([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (groupId) {
      resourceService.getResources(Number(groupId))
      .then(resources => {
        setGroupResources(resources);
      })
      .catch(err => {
        console.error(err);
        setGroupResources([]);
      });
      setSelectedResources([]);
    } else {
      setGroupResources([]);
    }
  }, [groupId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !date || !time) return;
    
    setLoading(true);
    try {
      // Create local ISO string
      const scheduledAt = new Date(`${date}T${time}`).toISOString();

      await sessionService.createSession({
        group_id: Number(groupId),
        title,
        description,
        agenda: agenda ? [{ title: agenda, duration_minutes: duration, description: "", activity_type: "learning" }] : [],
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        resource_ids: selectedResources,
      });
      
      toast.success("Session scheduled successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule session");
    } finally {
      setLoading(false);
    }
  };

  const toggleResource = (id: number) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl animate-[sfFadeIn_0.2s_ease-out] my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold">Schedule Study Session</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Group */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Study Group</label>
            <select
              required
              value={groupId}
              onChange={e => setGroupId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-4 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-sm bg-white"
            >
              <option value="">Select a group...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Topic / Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems Revision"
              className="w-full px-4 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Date & Time & Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-[13px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-[13px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Duration</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-[13px] bg-white"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Agenda</label>
            <textarea
              value={agenda}
              onChange={e => setAgenda(e.target.value)}
              placeholder="e.g. CPU Scheduling, Deadlocks"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border-soft focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          {/* Resources */}
          {groupId !== "" && (
            <div>
              <label className="block text-sm font-semibold mb-1.5">Attach Resources</label>
              {groupResources.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-background rounded-lg border border-border-soft text-center">
                  No resources in this group yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-border-soft rounded-lg p-2">
                  {groupResources.map(r => (
                    <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-background rounded-md cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(r.id)}
                        onChange={() => toggleResource(r.id)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="text-[13px] font-medium truncate flex-1" title={r.original_filename}>{r.original_filename}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !date || !time || !groupId}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-xl flex items-center justify-center min-w-[100px] transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
