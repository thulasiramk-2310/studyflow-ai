import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

const CONTROL =
  "w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground " +
  "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

function Wrap({ id, label, hint, children }: { id: string; label?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type Extra = { label?: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Extra>(function Input({ label, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return <Wrap id={fid} label={label} hint={hint}><input ref={ref} id={fid} className={cn(CONTROL, "h-10", className)} {...rest} /></Wrap>;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Extra>(function Select({ label, hint, className, id, children, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return <Wrap id={fid} label={label} hint={hint}><select ref={ref} id={fid} className={cn(CONTROL, "h-10", className)} {...rest}>{children}</select></Wrap>;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Extra>(function Textarea({ label, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return <Wrap id={fid} label={label} hint={hint}><textarea ref={ref} id={fid} className={cn(CONTROL, "min-h-[88px] py-2", className)} {...rest} /></Wrap>;
});
