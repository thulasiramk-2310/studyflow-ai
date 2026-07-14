import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X } from "lucide-react";
import { sessionService, type Session, type SessionUpdateParams, type MeetingType } from "../../services/session.service";
import { toast } from "sonner";

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSuccess: () => void;
}

export function EditSessionModal({ isOpen, onClose, session, onSuccess }: EditSessionModalProps) {
  const [meetingType, setMeetingType] = useState<MeetingType>(session.meeting_type || "NONE");
  const [meetingUrl, setMeetingUrl] = useState(session.meeting_url || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params: SessionUpdateParams = {
        meeting_type: meetingType,
        meeting_url: meetingUrl,
      };
      await sessionService.updateSession(session.id, params);
      toast.success("Session updated!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
                  <Dialog.Title as="h3" className="text-[16px] font-bold text-foreground">
                    Edit Session
                  </Dialog.Title>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-foreground">Meeting Type</label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                      className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-[14px] outline-none focus:border-primary transition-colors"
                    >
                      <option value="NONE">None</option>
                      <option value="GOOGLE_MEET">Google Meet</option>
                      <option value="ZOOM">Zoom</option>
                      <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                      <option value="DISCORD">Discord</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {meetingType !== "NONE" && (
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-foreground">Meeting URL</label>
                      <input
                        type="url"
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-[14px] outline-none focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-primary text-white rounded-xl text-[14px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
