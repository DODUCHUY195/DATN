import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { CardSkeleton } from "../../components/common/Skeleton";
import DataTable from "../../components/table/DataTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PermissionGate from "../../components/admin/PermissionGate";
import { useTableState } from "../../hooks/useTableState";
import { useAdminBookings, useAdminMutations } from "../../hooks/useAdmin";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { PERMISSIONS } from "../../constants/permissions";

export default function AdminBookingsPage() {
  const bookingsQuery = useAdminBookings();
  const m = useAdminMutations();
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [bulkMode, setBulkMode] = useState(null);
  const bookings = bookingsQuery.data || [];
  const table = useTableState(bookings, {
    pageSize: 8,
    defaultSort: { key: "id", direction: "desc" },
    searchFn: (booking, keyword) =>
      [
        booking.User?.fullName,
        booking.User?.email,
        booking.Showtime?.Movie?.title,
        String(booking.id),
        booking.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword)),
  });

  const doConfirm = async () => {
    try {
      if (bulkMode === "confirm") {
        await Promise.all(
          table.selectedIds.map((id) => m.confirmBooking.mutateAsync(id)),
        );
        toast.success(`Đã xác nhận ${table.selectedIds.length} vé`);
        table.setSelectedIds([]);
      } else {
        await m.confirmBooking.mutateAsync(confirmTarget.id);
        toast.success("Đã xác nhận vé");
      }
      setConfirmTarget(null);
      setBulkMode(null);
    } catch {
      toast.error("Không thể cập nhật booking");
    }
  };

  const doCancel = async () => {
    try {
      if (bulkMode === "cancel") {
        await Promise.all(
          table.selectedIds.map((id) => m.cancelBooking.mutateAsync(id)),
        );
        toast.success(`Đã hủy ${table.selectedIds.length} vé`);
        table.setSelectedIds([]);
      } else {
        await m.cancelBooking.mutateAsync(cancelTarget.id);
        toast.success("Đã hủy vé");
      }
      setCancelTarget(null);
      setBulkMode(null);
    } catch {
      toast.error("Không thể cập nhật booking");
    }
  };

  const columns = [
    {
      key: "id",
      label: "Mã vé",
      sortable: true,
      render: (booking) => (
        <span className="font-semibold text-slate-950 dark:text-white">
          #{booking.id}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Khách hàng",
      sortable: true,
      render: (booking) => (
        <div>
          <p>{booking.User?.fullName || "Khách hàng"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {booking.User?.email || "--"}
          </p>
        </div>
      ),
    },
    {
      key: "movie",
      label: "Phim",
      sortable: true,
      render: (booking) => (
        <div>
          <p>{booking.Showtime?.Movie?.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDateTime(
              booking.createdAt || booking.bookingTime || booking.updatedAt,
            )}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Thanh toán",
      sortable: true,
      render: (booking) => formatCurrency(booking.totalAmount || 0),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (booking) => (
        <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          {booking.status || "PENDING"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (booking) => (
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            onClick={() => setConfirmTarget(booking)}
          >
            Xác nhận
          </button>
          <button
            className="btn-danger"
            onClick={() => setCancelTarget(booking)}
          >
            Hủy vé
          </button>
        </div>
      ),
    },
  ];

  if (bookingsQuery.isLoading)
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} className="h-40" />
        ))}
      </div>
    );
  if (bookingsQuery.isError)
    return (
      <ErrorState
        message="Không tải được booking"
        onRetry={bookingsQuery.refetch}
      />
    );

  return (
    <PermissionGate permissions={[PERMISSIONS.BOOKINGS_VIEW]}>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý booking"
          // description="Theo dõi toàn bộ booking, có search/filter/sort và xử lý hàng loạt theo chuẩn admin portal."
        />
        <DataTable
          title="Danh sách booking"
          description="Tìm theo mã vé, khách hàng, phim và trạng thái."
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Tìm booking..."
          columns={columns}
          rows={table.paginatedRows}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          emptyText="Không tìm thấy booking"
          selectedIds={table.selectedIds}
          onToggleRow={table.toggleRow}
          onTogglePageSelection={table.togglePageSelection}
          allCurrentPageSelected={table.allCurrentPageSelected}
          sort={table.sort}
          onToggleSort={(key) =>
            table.setSort((current) => ({
              key,
              direction:
                current?.key === key && current.direction === "asc"
                  ? "desc"
                  : "asc",
            }))
          }
          filters={[
            {
              key: "status",
              value: table.status,
              onChange: table.setStatus,
              options: [
                { value: "ALL", label: "Tất cả trạng thái", emoji: "🎟️" },
                {
                  value: "PENDING",
                  label: "PENDING",
                  emoji: "⏳",
                  meta: "Đang chờ xử lý",
                },
                {
                  value: "CONFIRMED",
                  label: "CONFIRMED",
                  emoji: "✅",
                  meta: "Đã xác nhận vé",
                },
                {
                  value: "CANCELED",
                  label: "CANCELED",
                  emoji: "❌",
                  meta: "Đã hủy",
                },
              ],
            },
          ]}
          bulkActions={[
            {
              key: "confirm",
              label: "Xác nhận đã chọn",
              onClick: () => {
                setBulkMode("confirm");
                setConfirmTarget({});
              },
            },
            {
              key: "cancel",
              label: "Hủy đã chọn",
              tone: "danger",
              onClick: () => {
                setBulkMode("cancel");
                setCancelTarget({});
              },
            },
          ]}
        />
        <ConfirmDialog
          open={!!confirmTarget}
          onClose={() => {
            setConfirmTarget(null);
            setBulkMode(null);
          }}
          onConfirm={doConfirm}
          title={bulkMode === "confirm" ? "Xác nhận nhiều vé" : "Xác nhận vé"}
          description={
            bulkMode === "confirm"
              ? `Có ${table.selectedIds.length} booking sẽ được chuyển sang trạng thái xác nhận.`
              : `Booking #${confirmTarget?.id || ""} sẽ được chuyển sang trạng thái xác nhận.`
          }
          confirmText={
            bulkMode === "confirm" ? "Xác nhận tất cả" : "Xác nhận vé"
          }
          tone="primary"
        />
        <ConfirmDialog
          open={!!cancelTarget}
          onClose={() => {
            setCancelTarget(null);
            setBulkMode(null);
          }}
          onConfirm={doCancel}
          title={bulkMode === "cancel" ? "Hủy nhiều vé" : "Hủy vé"}
          description={
            bulkMode === "cancel"
              ? `Có ${table.selectedIds.length} booking sẽ bị hủy.`
              : `Booking #${cancelTarget?.id || ""} sẽ bị hủy.`
          }
          confirmText={bulkMode === "cancel" ? "Hủy tất cả" : "Hủy vé"}
        />
      </div>
    </PermissionGate>
  );
}
