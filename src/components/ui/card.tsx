import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: boolean;
  children: ReactNode;
}

export function Card({ interactive, padding = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`${interactive ? "card-interactive" : "card"} ${padding ? "" : "!p-0"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-sm font-semibold text-on-surface mb-4 ${className}`}>{children}</h2>;
}
