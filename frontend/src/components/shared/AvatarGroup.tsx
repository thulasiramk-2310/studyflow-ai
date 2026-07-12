interface Avatar { init: string; bg?: string; name?: string }

interface AvatarGroupProps {
  avatars: Avatar[];
  max?: number;
  size?: "sm" | "md";
}

export function AvatarGroup({ avatars, max = 4, size = "md" }: AvatarGroupProps) {
  const shown = avatars.slice(0, max);
  const rest  = avatars.length - max;
  const dim   = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-[11px]";

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((av, i) => (
        <div
          key={i}
          title={av.name ?? av.init}
          className={`${dim} rounded-full ${av.bg ?? "bg-primary"} text-white flex items-center justify-center font-bold ring-2 ring-surface shrink-0`}
        >
          {av.init}
        </div>
      ))}
      {rest > 0 && (
        <div className={`${dim} rounded-full bg-border-soft text-muted-foreground flex items-center justify-center font-bold ring-2 ring-surface shrink-0`}>
          +{rest}
        </div>
      )}
    </div>
  );
}
