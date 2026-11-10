interface Props {
  label: string;
  name: string;
}

export function InfoCard({ label, name }: Props) {
  return (
    <div className="info-card" role="status" aria-live="polite">
      <div className="info-card__label">{label}</div>
      <div className="info-card__name">{name}</div>
    </div>
  );
}
