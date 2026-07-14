import React from 'react';
import { Clock, RotateCw, Check, X, Sparkles } from 'lucide-react';

interface AIProposal {
  title: string;
  description: string;
  agenda: string;
  duration_minutes: number;
}

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AIProposal;
  onRegenerate: () => void;
  onCreateSession: () => void;
  isRegenerating: boolean;
  isCreating: boolean;
}

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onRegenerate,
  onCreateSession,
  isRegenerating,
  isCreating
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[sfFade_0.2s_ease]">
      <div className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-soft flex justify-between items-center bg-primary-soft/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-[18px] font-bold text-foreground">AI Study Plan Proposal</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="space-y-1">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Session Title</div>
            <div className="text-[18px] font-bold text-foreground">{proposal.title}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Description</div>
            <div className="text-[14px] text-foreground leading-relaxed">{proposal.description}</div>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Agenda</div>
            <div className="bg-background rounded-xl p-4 border border-border-soft">
              <pre className="text-[14px] text-foreground font-sans whitespace-pre-wrap">
                {proposal.agenda}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground bg-primary-soft/20 py-2 px-3 rounded-lg w-fit border border-primary-soft">
            <Clock className="w-4 h-4 text-primary" />
            Estimated Duration: {proposal.duration_minutes} minutes
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-soft flex justify-between items-center bg-background">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating || isCreating}
            className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating..." : "Regenerate Plan"}
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isRegenerating || isCreating}
              className="px-4 py-2 text-[14px] font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onCreateSession}
              disabled={isRegenerating || isCreating}
              className="flex items-center gap-2 px-5 py-2 text-[14px] font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Session
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
