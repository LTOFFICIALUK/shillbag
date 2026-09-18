type BagMarkProps = {
  className?: string;
  inverted?: boolean;
};

export const BagMark = ({ className = "h-10 w-10", inverted = false }: BagMarkProps) => {
  const fill = inverted ? "#d4fc50" : "#111111";
  const mark = inverted ? "#111111" : "#d4fc50";

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="shillbag"
    >
      <rect width="64" height="64" rx="18" fill={fill} />
      <path
        d="M21 24h22l-2 20.2q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0q-1.7 2.4-3.4 0L21 24Z"
        fill="none"
        stroke={mark}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M27.2 24c0-5.4 9.6-5.4 9.6 0"
        fill="none"
        stroke={mark}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
