import React, { useState, useEffect } from 'react';
import { Clock, RotateCw, Check, X, Sparkles, Edit2, Save } from 'lucide-react';

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
  onCreateSession: (editedProposal?: AIProposal, scheduledAt?: string) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<AIProposal>(proposal);
  
  // Default to tomorrow
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  // Sync state when new proposal is received
  useEffect(() => {
    setEditedProposal(proposal);
    setIsEditing(false);
  }, [proposal]);

  if (!isOpen) return null;

  const handleAgendaChange = (idx: number, field: keyof AgendaItem, value: any) => {
    const newAgenda = [...editedProposal.agenda];
    newAgenda[idx] = { ...newAgenda[idx], [field]: value };
    
    // Recalculate total duration
    const newDuration = newAgenda.reduce((acc, item) => acc + (Number(item.duration_minutes) || 0), 0);
    
    setEditedProposal({ ...editedProposal, agenda: newAgenda, duration_minutes: newDuration });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[sfFade_0.2s_ease]">
      <div className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-[700px] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-soft flex justify-between items-center bg-primary-soft/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-[18px] font-bold text-foreground">
              AI Study Plan Proposal
            </h2>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full border transition-colors flex items-center gap-1.5 ${isEditing ? 'bg-primary text-white border-primary' : 'bg-surface border-border-soft text-muted-foreground hover:text-foreground hover:bg-background'}`}
            >
              {isEditing ? <><Save className="w-3 h-3" /> Save Changes</> : <><Edit2 className="w-3 h-3" /> Edit Plan</>}
            </button>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div className="space-y-1">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Session Title</div>
            {isEditing ? (
              <input 
                type="text" 
                value={editedProposal.title}
                onChange={(e) => setEditedProposal({ ...editedProposal, title: e.target.value })}
                className="w-full text-[18px] font-bold text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <div className="text-[18px] font-bold text-foreground">{editedProposal.title}</div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Description</div>
            {isEditing ? (
              <textarea 
                value={editedProposal.description}
                onChange={(e) => setEditedProposal({ ...editedProposal, description: e.target.value })}
                className="w-full text-[14px] text-foreground bg-background border border-border rounded-lg px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            ) : (
              <div className="text-[14px] text-foreground leading-relaxed">{editedProposal.description}</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Scheduled Time</div>
            {isEditing ? (
              <input 
                type="datetime-local" 
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full sm:w-auto text-[14px] text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <div className="text-[14px] font-medium text-foreground">{new Date(scheduledAt).toLocaleString()}</div>
            )}
          </div>

          {editedProposal.objectives && editedProposal.objectives.length > 0 && (
            <div className="space-y-1">
              <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Objectives</div>
              <ul className="list-disc pl-5 text-[14px] text-foreground space-y-1">
                {editedProposal.objectives.map((obj, i) => (
                  <li key={i}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={obj}
                        onChange={(e) => {
                          const newObjs = [...(editedProposal.objectives || [])];
                          newObjs[i] = e.target.value;
                          setEditedProposal({ ...editedProposal, objectives: newObjs });
                        }}
                        className="w-full bg-background border border-border-soft rounded px-2 py-1 focus:outline-none focus:border-primary/50 text-[14px]"
                      />
                    ) : (
                      obj
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Agenda</div>
            <div className="flex flex-col gap-3">
              {Array.isArray(editedProposal.agenda) ? editedProposal.agenda.map((item, idx) => (
                <div key={idx} className="bg-background rounded-xl p-4 border border-border-soft flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={item.title}
                        onChange={(e) => handleAgendaChange(idx, 'title', e.target.value)}
                        className="flex-1 font-bold text-[14px] text-foreground bg-surface border border-border-soft rounded px-2 py-1 focus:outline-none focus:border-primary/50"
                        placeholder="Agenda title"
                      />
                    ) : (
                      <span className="font-bold text-[14px] text-foreground">{item.title}</span>
                    )}
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <input 
                          type="number" 
                          value={item.duration_minutes}
                          onChange={(e) => handleAgendaChange(idx, 'duration_minutes', parseInt(e.target.value) || 0)}
                          className="w-16 text-[12px] font-semibold text-foreground bg-surface border border-border-soft px-2 py-1 rounded text-center focus:outline-none focus:border-primary/50"
                          min="1"
                        />
                        <span className="text-[12px] text-muted-foreground">min</span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-semibold text-muted-foreground bg-surface border border-border-soft px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                        {item.duration_minutes} min
                      </span>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <textarea 
                      value={item.description || ''}
                      onChange={(e) => handleAgendaChange(idx, 'description', e.target.value)}
                      className="w-full text-[13px] text-foreground bg-surface border border-border-soft rounded px-2 py-1 min-h-[50px] focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="Description (optional)"
                    />
                  ) : item.description ? (
                    <span className="text-[13px] text-muted-foreground">{item.description}</span>
                  ) : null}
                  
                  {!isEditing && (
                    <span className="text-[11px] font-semibold uppercase text-primary tracking-wider mt-1 w-fit bg-primary-soft/30 px-2 py-0.5 rounded">
                      {item.activity_type}
                    </span>
                  )}
                </div>
              )) : (
                <div className="bg-background rounded-xl p-4 border border-border-soft">
                  <pre className="text-[14px] text-foreground font-sans whitespace-pre-wrap">
                    {typeof editedProposal.agenda === 'string' ? editedProposal.agenda : JSON.stringify(editedProposal.agenda, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground bg-primary-soft/20 py-2 px-3 rounded-lg w-fit border border-primary-soft mt-2">
            <Clock className="w-4 h-4 text-primary" />
            Estimated Duration: {editedProposal.duration_minutes} minutes
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
              onClick={() => onCreateSession(editedProposal, scheduledAt)}
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
