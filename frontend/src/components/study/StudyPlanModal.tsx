import React from 'react';
import { Clock, RotateCw, Check, X, Sparkles } from 'lucide-react';

import type { AgendaItem, StudySessionType } from '../../services/session.service';

interface AIProposal {
  title: string;
  description: string;
  agenda: AgendaItem[];
  duration_minutes: number;
  objectives?: string[];
  expected_outcome?: string;
  session_type?: StudySessionType;
  confidence?: number;
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

          {proposal.objectives && proposal.objectives.length > 0 && (
            <div className="space-y-1">
              <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Objectives</div>
              <ul className="list-disc pl-5 text-[14px] text-foreground">
                {proposal.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Agenda</div>
            <div className="flex flex-col gap-3">
              {Array.isArray(proposal.agenda) ? proposal.agenda.map((item, idx) => (
                <div key={idx} className="bg-background rounded-xl p-4 border border-border-soft flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[14px] text-foreground">{item.title}</span>
                    <span className="text-[12px] font-semibold text-muted-foreground bg-surface border border-border-soft px-2 py-0.5 rounded-md whitespace-nowrap">
                      {item.duration_minutes} min
                    </span>
                  </div>
                  {item.description && (
                    <span className="text-[13px] text-muted-foreground">{item.description}</span>
                  )}
                  <span className="text-[11px] font-semibold uppercase text-primary tracking-wider mt-1 w-fit bg-primary-soft/30 px-2 py-0.5 rounded">
                    {item.activity_type}
                  </span>
                </div>
              )) : (
                <div className="bg-background rounded-xl p-4 border border-border-soft">
                  <pre className="text-[14px] text-foreground font-sans whitespace-pre-wrap">
                    {typeof proposal.agenda === 'string' ? proposal.agenda : JSON.stringify(proposal.agenda, null, 2)}
                  </pre>
                </div>
              )}
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
