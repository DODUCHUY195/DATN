export default function ChartCard({ title, description, children, className = '' }) {
  return (
    <div className={`card-premium p-6 ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}
