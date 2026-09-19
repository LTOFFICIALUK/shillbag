type TokenMarkProps = {
  symbol: string;
  imageUrl?: string | null;
  className?: string;
};

export const TokenMark = ({
  symbol,
  imageUrl,
  className = "h-8 w-8",
}: TokenMarkProps) => {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={`$${symbol}`}
        className={`${className} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold ${className}`}
      aria-label={`$${symbol}`}
    >
      ${symbol.slice(0, 2)}
    </span>
  );
};
