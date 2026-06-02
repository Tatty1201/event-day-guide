import React from "react";

const PATHS: Record<string, React.ReactNode> = {
  reception: <><path d="M3 19v-1a5 5 0 0 1 10 0v1" /><circle cx="8" cy="8" r="3" /><path d="M14 19h7M14 15h7M17 11h4" /></>,
  flag:      <><path d="M5 21V4" /><path d="M5 4h11l-2 3 2 3H5" /></>,
  toilet:    <><path d="M12 3v18" /><circle cx="7" cy="6" r="2" /><path d="M5 21v-6H4l1.5-5a1.5 1.5 0 0 1 3 0L10 15H9v6" /><circle cx="17" cy="6" r="2" /><path d="M15 21v-5l-1.2 1M19 21v-5l1.2 1M15 16l2-5h0l2 5" /></>,
  cross:     <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></>,
  food:      <><path d="M5 3v8a2 2 0 0 0 4 0V3M7 3v18" /><path d="M17 3c-1.5 0-2.5 2-2.5 5s1 3.5 2.5 3.5S19.5 11 19.5 8 18.5 3 17 3zM17 11.5V21" /></>,
  seat:      <><path d="M5 11V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5M5 11h14v3H5z" /><path d="M6 14v6M18 14v6" /><path d="M13 11V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" /></>,
  stage:     <><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
  booth:     <><path d="M4 10l8-6 8 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /></>,
  search:    <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>,
  bell:      <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  layers:    <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  locate:    <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2H9z" /><path d="M9 11h6M9 15h4" /></>,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown:  <path d="M6 9l6 6 6-6" />,
  close:     <path d="M6 6l12 12M18 6L6 18" />,
  back:      <path d="M15 6l-6 6 6 6" />,
  pin:       <><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  warning:   <><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  info:      <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  clock:     <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus:      <path d="M12 5v14M5 12h14" />,
  minus:     <path d="M5 12h14" />,
  check:     <path d="M5 12l5 5L20 7" />,
  external:  <><path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" /></>,
  map:       <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></>,
};

type IconProps = {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function Icon({ name, size = 22, stroke = 2, className, style }: IconProps) {
  const body = PATHS[name];
  if (!body) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" className={className} style={style} aria-hidden="true"
    >
      {body}
    </svg>
  );
}
