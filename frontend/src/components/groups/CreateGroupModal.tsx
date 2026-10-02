import { useState } from "react";
import { toast } from "sonner";
import { groupService } from "../../services/group.service";
import { Button, Input, Modal, Textarea } from "../ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await groupService.createGroup(name, description, goal);
      toast.success("Group created successfully");
      setName(""); setDescription(""); setGoal("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create a study group"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-group-form" loading={loading} disabled={!name.trim()}>Create group</Button>
        </>
      }
    >
      <form id="create-group-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Group name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advanced Calculus Study Group" />
        <Textarea label="Description (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group about?" />
        <Textarea label="Group goal (optional)" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Become interview ready in Machine Learning" hint="The AI planner uses the goal and learning path to propose sessions." />
      </form>
    </Modal>
  );
}
