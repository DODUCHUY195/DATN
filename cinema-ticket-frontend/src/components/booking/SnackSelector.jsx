export default function SnackSelector({ snacks = [], selectedSnacks = [], onChange }) {
  const getQuantity = (id) => selectedSnacks.find((item) => item.snackId === id)?.quantity || 0;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {snacks.map((snack) => (
        <div key={snack.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900">{snack.name}</h4>
              <p className="text-sm text-slate-500">{snack.price.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-2" onClick={() => onChange(snack, Math.max(0, getQuantity(snack.id) - 1))}>-</button>
              <span className="w-8 text-center font-semibold">{getQuantity(snack.id)}</span>
              <button className="btn-secondary px-3 py-2" onClick={() => onChange(snack, getQuantity(snack.id) + 1)}>+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
