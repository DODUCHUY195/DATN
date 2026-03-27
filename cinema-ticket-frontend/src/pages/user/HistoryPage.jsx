import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { useMyHistory } from '../../hooks/useBookings';

export default function HistoryPage() {
  const historyQuery = useMyHistory();

  return (
    <div className="space-y-6">
      <PageHeader title="Lịch sử đặt vé" description="Dạng hiển thị gọn cho user review giao dịch cũ." />
      {historyQuery.isLoading ? <LoadingSpinner /> : historyQuery.isError ? <ErrorState message="Không tải được lịch sử" onRetry={historyQuery.refetch} /> : !historyQuery.data?.length ? <EmptyState title="Chưa có lịch sử" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600"><tr><th className="px-5 py-4">Phim</th><th className="px-5 py-4">Phòng</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Vé</th></tr></thead>
              <tbody>
                {historyQuery.data.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">{item.Showtime?.Movie?.title}</td>
                    <td className="px-5 py-4">{item.Showtime?.Room?.name}</td>
                    <td className="px-5 py-4">{item.status} / {item.paymentStatus}</td>
                    <td className="px-5 py-4">{item.Ticket?.ticketCode || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
