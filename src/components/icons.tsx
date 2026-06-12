import type { ReactNode } from "react";

// Minimal inline SVG icon set (Tabler-style outlines) so the viewer doesn't
// need an icon font dependency.

function Icon({ size = 14, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FileTextIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M9 9h1" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </Icon>
  );
}

export function PresentationIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 4h18" />
      <path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" />
      <path d="M12 16v4" />
      <path d="M9 20h6" />
      <path d="M8 12l3-3 2 2 3-3" />
    </Icon>
  );
}

export function FileDescriptionIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M9 17h6" />
      <path d="M9 13h6" />
    </Icon>
  );
}

export function BookIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <path d="M3 6v13" />
      <path d="M12 6v13" />
      <path d="M21 6v13" />
    </Icon>
  );
}

export function PlusIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function GitBranchIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="7" cy="18" r="2" />
      <circle cx="7" cy="6" r="2" />
      <circle cx="17" cy="6" r="2" />
      <path d="M7 8v8" />
      <path d="M9 18h6a2 2 0 0 0 2-2V8" />
    </Icon>
  );
}

export function SendIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M10 14L21 3" />
      <path d="M21 3l-6.5 18a.55.55 0 0 1-1 0l-3.5-7l-7-3.5a.55.55 0 0 1 0-1L21 3" />
    </Icon>
  );
}

export function TrashIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </Icon>
  );
}

export function EyeIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="2" />
      <path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7" />
    </Icon>
  );
}
