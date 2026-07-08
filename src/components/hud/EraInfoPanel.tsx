import { useEraAssets } from '../../hooks/useEraAssets';

/** Average menu price for display. */
function avgPrice(menu: { price: number }[]): string {
  if (menu.length === 0) return '—';
  const avg = menu.reduce((sum, m) => sum + m.price, 0) / menu.length;
  return `$${avg.toFixed(2)}`;
}

/**
 * Side panel showing current era details: tagline, ambient track, coffee machine,
 * average menu price, and a short flavour paragraph.
 * Slide-in animation triggers on era change (via key).
 */
export function EraInfoPanel() {
  const era = useEraAssets();

  return (
    <div
      key={era.id}
      className="pointer-events-auto fixed left-4 top-24 z-20 max-w-xs animate-slide-in-right"
    >
      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-1 flex items-baseline gap-2">
          <span
            className="font-display text-3xl font-bold"
            style={{ color: 'var(--era-accent)' }}
          >
            {era.year}
          </span>
          <span className="text-sm font-medium text-white/60">{era.label}</span>
        </div>

        <p className="mb-3 text-sm font-medium" style={{ color: 'var(--era-text)' }}>
          {era.tagline}
        </p>

        <p className="mb-4 text-xs leading-relaxed text-white/50">{era.description}</p>

        <dl className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">Coffee Machine</dt>
            <dd className="text-right text-xs font-medium text-white/80">{era.machineLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">Music Source</dt>
            <dd className="text-right text-xs font-medium text-white/80">{era.musicLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">Counter Tech</dt>
            <dd className="text-right text-xs font-medium text-white/80">{era.counterTechLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">Tableware</dt>
            <dd className="text-right text-xs font-medium text-white/80">{era.tablewareLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[10px] uppercase tracking-wider text-white/40">Avg. Price</dt>
            <dd className="text-right text-xs font-medium text-white/80">{avgPrice(era.menu)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
