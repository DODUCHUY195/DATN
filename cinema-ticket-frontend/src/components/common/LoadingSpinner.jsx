export default function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="card flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
