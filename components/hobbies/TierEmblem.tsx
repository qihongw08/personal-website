/**
 * Tier crest — two curved wings flanking a diamond, colored by tier.
 * Uses a square viewBox with the shape visually centered so it sits
 * perfectly in circular or square containers.
 */
export function TierEmblem({
  color,
  size = 18,
}: {
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      {/* left wing */}
      <path
        d="M3 9.5 C6 5.5 10 7.5 12 13.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* right wing */}
      <path
        d="M21 9.5 C18 5.5 14 7.5 12 13.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* center diamond */}
      <path d="M12 8.5 L15.5 13.5 L12 18.5 L8.5 13.5 Z" fill={color} />
    </svg>
  );
}
