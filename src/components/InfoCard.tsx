interface Props {
  label: string;
  name: string;
  flagUrl?: string; // hover preview (spec 014)
}

export function InfoCard({ label, name, flagUrl }: Props) {
  return (
    <div className="info-card" role="status" aria-live="polite">
      <div className="info-card__label">
        {flagUrl && <img key={flagUrl} className="info-card__flag" src={flagUrl} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />}
        {label}
      </div>
      {/* key: remount on change so the swap animation (spec 013) replays */}
      <div key={name} className="info-card__name">{name}</div>
    </div>
  );
}
