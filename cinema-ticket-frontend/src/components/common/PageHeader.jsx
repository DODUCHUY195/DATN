export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-500 md:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}
