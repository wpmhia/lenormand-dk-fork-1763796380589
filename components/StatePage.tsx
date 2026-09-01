import type { ReactNode } from "react";

interface StatePageProps {
  icon?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  detail?: ReactNode;
}

export function StatePage({ icon, title, description, children, detail }: StatePageProps) {
  return (
    <div className="state-page">
      <div className="state-card">
        {icon && <div className="state-icon">{icon}</div>}
        <div className="space-y-2">
          <h1 className="font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          {detail}
        </div>
        <div className="flex flex-col justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}
