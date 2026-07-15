import { useState } from "react";
import { CheckCircle, Circle, Map, Plus, Trash2, GripVertical, Clock, Sparkles } from "lucide-react";
import { groupService, LearningPlanItem } from "../../services/group.service";
import { toast } from "sonner";

interface Props {
  groupId: number;
  items: LearningPlanItem[];
  canManage: boolean;
  onUpdate: () => void;
  progressPercent: number;
  completedCount: number;
}

export function StudyRoadmap({ groupId, items, canManage, onUpdate, progressPercent, completedCount }: Props) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    try {
      setLoading(true);
      await groupService.addLearningPlanItem(groupId, { title: newItemTitle });
      setNewItemTitle("");
      setIsAdding(false);
      onUpdate();
      toast.success("Added to learning path");
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: LearningPlanItem) => {
    if (!canManage) return;
    const newStatus = item.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
    try {
      await groupService.updateLearningPlanItem(groupId, item.id, { status: newStatus });
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await groupService.deleteLearningPlanItem(groupId, itemId);
      onUpdate();
      toast.success("Item deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-border-soft flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Learning Path</h3>
        </div>
        {items.length > 0 && (
          <div className="text-[12px] font-semibold text-muted-foreground">
            {completedCount} of {items.length} completed ({progressPercent}%)
          </div>
        )}
      </div>

      <div className="p-2">
        {items.length === 0 && !isAdding ? (
          <div className="text-center py-6">
            <Map className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground mb-3">No learning path items added yet.</p>
            {canManage && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-[12px] font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Add first item
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {sortedItems.map((item, idx) => (
              <div 
                key={item.id} 
                className={`group flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-gray-50/80 ${item.status === 'COMPLETED' ? 'opacity-70' : ''}`}
              >
                <button 
                  onClick={() => handleToggleStatus(item)}
                  disabled={!canManage}
                  className={`mt-0.5 shrink-0 transition-colors ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {item.status === "COMPLETED" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : item.status === "IN_PROGRESS" ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-primary transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-[13.5px] font-semibold ${item.status === "COMPLETED" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</div>
                  )}
                  {item.is_ai_generated && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded w-fit">
                      <Sparkles className="w-3 h-3" /> AI Suggested
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-grab">
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {isAdding && (
              <form onSubmit={handleAddItem} className="flex gap-2 items-center p-2 mt-1">
                <input
                  type="text"
                  autoFocus
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  placeholder="E.g., Learn Python Basics"
                  className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button 
                  type="submit" 
                  disabled={loading || !newItemTitle.trim()}
                  className="bg-primary text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-muted-foreground hover:text-foreground text-[12px] font-semibold px-2 py-1.5"
                >
                  Cancel
                </button>
              </form>
            )}
            
            {!isAdding && canManage && items.length > 0 && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-primary transition-colors p-2 mt-1 w-fit"
              >
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}