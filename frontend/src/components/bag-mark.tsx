type BagMarkProps = {
  className?: string;
  inverted?: boolean;
};

export const BagMark = ({ className = "h-10 w-10", inverted = false }: BagMarkProps) => {
  const paper = inverted ? "#12110e" : "#f3ead6";
  const ink = inverted ? "#f3ead6" : "#12110e";
  const paid = "#157a4a";

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="SHILLBAG"
    >
      <rect width="64" height="64" rx="10" fill={paper} />
      <path
        d="M21 23.5h22L41 45.2q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0q-1.7 2.6-3.4 0L21 23.5Z"
        fill="none"
        stroke={ink}
        strokeWidth="2.15"
        strokeLinejoin="round"
      />
      <path
        d="M27.2 23.5c0-5.6 9.6-5.6 9.6 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <path
        d="M27.5 31.5h9.5M27.5 35.5h6.5"
        fill="none"
        stroke={ink}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.32"
      />
      <circle cx="46.2" cy="46.4" r="10.4" fill={paper} stroke={paid} strokeWidth="2.05" />
      <path
        d="m42 46.6 3.05 3.1 6.35-7.15"
        fill="none"
        stroke={paid}
        strokeWidth="2.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
