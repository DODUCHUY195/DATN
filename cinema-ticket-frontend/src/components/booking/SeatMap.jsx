import { cn } from '../../utils/cn';

export default function SeatMap({ seats = [], selectedSeats = [], onToggle }) {
  const grouped = seats.reduce((acc, seat) => {
    acc[seat.rowLabel] = [...(acc[seat.rowLabel] || []), seat];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="rounded-full bg-slate-900/90 px-6 py-3 text-center text-sm font-medium text-white">Màn hình</div>
      <div className="space-y-3">
        {Object.entries(grouped).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-2 overflow-auto">
            <span className="w-6 text-sm font-semibold text-slate-500">{row}</span>
            <div className="flex gap-2">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeats.some((item) => item.id === seat.id);
                const disabled = seat.status !== 'AVAILABLE';
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(seat)}
                    className={cn(
                      'flex h-10 min-w-10 items-center justify-center rounded-xl text-xs font-semibold transition',
                      seat.type === 'COUPLE' ? 'px-3' : 'w-10',
                      disabled && 'bg-slate-200 text-slate-400',
                      !disabled && !isSelected && 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                      isSelected && 'bg-brand-600 text-white',
                    )}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-emerald-100" /> Trống</div>
        <div className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-brand-600" /> Đang chọn</div>
        <div className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-slate-200" /> Đã giữ / đã đặt</div>
      </div>
    </div>
  );
}
