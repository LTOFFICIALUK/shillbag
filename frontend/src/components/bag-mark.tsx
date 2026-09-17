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
      <rect width="64" height="64" rx="8" fill={paper} />
      <path
        d="M18 22h28l-2.4 28H20.4L18 22Z"
        fill="none"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M25 22c0-6 14-6 14 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="46" cy="46" r="11" fill={paper} stroke={paid} strokeWidth="2.2" />
      <path
        d="m41.5 46.2 3 3 6.2-7"
        fill="none"
        stroke={paid}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
