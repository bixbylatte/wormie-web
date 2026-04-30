type BrandLockupProps = {
  compact?: boolean;
  subtitle?: string;
  titleAs?: "h1" | "h2" | "p";
};

export function BrandLockup({
  compact = false,
  subtitle = "Trade or lend books with your team",
  titleAs = "h1"
}: BrandLockupProps) {
  const TitleTag = titleAs;

  return (
    <div className={`brand-lockup${compact ? " compact" : ""}`}>
      <img className="brand-illustration" src="/icon-192.png" alt="Wormie mascot reading a book" />
      <div className="brand-copy">
        <p className="eyebrow">{subtitle}</p>
        <TitleTag>Wormie</TitleTag>
      </div>
    </div>
  );
}
