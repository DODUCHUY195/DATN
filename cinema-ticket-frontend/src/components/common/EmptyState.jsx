export default function EmptyState({ title = 'Chưa có dữ liệu', description = 'Không tìm thấy nội dung phù hợp.' }) {
  return (
    <div className="card p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
