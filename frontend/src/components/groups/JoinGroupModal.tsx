import { useState } from "react";
import { useTerms } from "../../hooks/useTerms";
import { toast } from "sonner";
import { groupService } from "../../services/group.service";
import { Button, Input, Modal } from "../ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinGroupModal({ isOpen, onClose, onSuccess }: Props) {
  const terms = useTerms();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await groupService.joinGroup(inviteCode.trim().toUpperCase());
      toast.success("Successfully joined the group!");
      setInviteCode("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title={`Join a ${terms.groupLower}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="join-group-form" loading={loading} disabled={!inviteCode.trim()}>Join group</Button>
        </>
      }
    >
      <form id="join-group-form" onSubmit={handleSubmit}>
        <Input
          label="Invite code"
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="e.g. A7K9QP"
          className="font-mono uppercase tracking-widest"
          hint={`Ask the ${terms.groupLower} ${terms.organizer.toLowerCase()} for the code shown on their page.`}
        />
      </form>
    </Modal>
  );
}
