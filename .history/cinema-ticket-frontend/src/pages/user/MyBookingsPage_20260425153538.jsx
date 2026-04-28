import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import {
  useCancelBooking,
  useConfirmPayment,
  useMyBookings,
} from "../../hooks/useBookings";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function translateBookingStatus(status) {
  switch (status) {
    case "CONFIRMED":
      return "Đã xác nhận";
    case "HOLD":
      return "Đang giữ chỗ";
    case "CANCELED":
      return "Đã hủy vé";
    case "EXPIRED":
      return "Đã hết hạn";
    case "PENDING":
      return "Đang xử lý";
    default:
      return status || "--";
  }
}

function translatePaymentStatus(paymentStatus) {
  switch (paymentStatus) {
    case "PAID":
      return "Đã thanh toán";
    case "PENDING":
      return "Chờ thanh toán";
    case "FAILED":
      return "Thanh toán thất bại";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return paymentStatus || "--";
  }
}

function getDisplayStatus(status, paymentStatus) {
  if (status === "CANCELED" && paymentStatus === "REFUNDED") {
    return {
      label: "Đã hủy & đã hoàn tiền",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }

  if (status === "CONFIRMED" && paymentStatus === "PAID") {
    return {
      label: "Đã thanh toán",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (status === "HOLD" && paymentStatus === "PENDING") {
    return {
      label: "Chờ thanh toán",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  if (status === "CANCELED") {
    return {
      label: "Đã hủy vé",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }

  if (status === "EXPIRED") {
    return {
      label: "Booking đã hết hạn",
      className: "bg-slate-100 text-slate-700 ring-slate-200",
    };
  }

  return {
    label: `${translateBookingStatus(status)} · ${translatePaymentStatus(
      paymentStatus,
    )}`,
    className: "bg-slate-50 text-slate-700 ring-slate-200",
  };
}

function StatusBadge({ status, paymentStatus }) {
  const displayStatus = getDisplayStatus(status, paymentStatus);

  return (
    <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${displayStatus.className}`}
      >
        {displayStatus.label}
      </span>
    </div>
  );
}

export default function MyBookingsPage() {
  const bookingsQuery = useMyBookings();
  const cancelMutation = useCancelBooking();
  const confirmPaymentMutation = useConfirmPayment();

  const handlePayNow = async (booking) => {
    try {
      await confirmPaymentMutation.mutateAsync({
        id: booking.id,
        payload: {},
      });

      toast.success("Thanh toán thành công");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể thanh toán booking này",
      );
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast.success("Hủy vé thành công");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể hủy vé");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Vé của tôi" />

      {bookingsQuery.isLoading ? (
        <LoadingSpinner />
      ) : bookingsQuery.isError ? (
        <ErrorState
          message="Không tải được danh sách booking"
          onRetry={bookingsQuery.refetch}
        />
      ) : !bookingsQuery.data?.length ? (
        <EmptyState
          title="Chưa có booking"
          description="Bạn chưa có vé nào được đặt."
        />
      ) : (
        <div className="grid gap-5">
          {bookingsQuery.data.map((booking) => {
            const showtime = booking.Showtime;
            const movie = showtime?.Movie;
            const room = showtime?.Room;
            const cinema = room?.Cinema;

            const seats =
              booking.SeatReservations?.map(
                (item) =>
                  item.Seat?.seatNumber || item.Seat?.name || item.seatId,
              ).join(", ") || "--";

            const snacks =
              booking.BookingSnacks?.map(
                (item) =>
                  `${item.Snack?.name || "Snack"} x${item.quantity || 1}`,
              ).join(", ") || "--";

            const isWaitingPayment =
              booking.status === "HOLD" && booking.paymentStatus === "PENDING";

            const canCancel =
              booking.status !== "CANCELED" && booking.status !== "EXPIRED";

            const isPayingCurrentBooking =
              confirmPaymentMutation.isPending &&
              confirmPaymentMutation.variables?.id === booking.id;

            const isCancelingCurrentBooking =
              cancelMutation.isPending &&
              cancelMutation.variables === booking.id;

            return (
              <div className="card overflow-hidden p-0" key={booking.id}>
                <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
                  <div className="relative min-h-[220px] bg-slate-100 dark:bg-slate-900">
                    {movie?.posterUrl ? (
                      <img
                        src={`${BASE_URL_API ?? "http://localhost:3000"}${
                          movie.posterUrl
                        }`}
                        alt={movie?.title || "movie-poster"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-400">
                        Không có poster
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="line-clamp-2 text-lg font-semibold text-white">
                        {movie?.title || "Chưa có tên phim"}
                      </p>
                      {movie?.durationMinutes ? (
                        <p className="mt-1 text-xs text-white/80">
                          {movie.durationMinutes} phút
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Mã booking: {booking.code}
                        </h3>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Phim
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {movie?.title || "--"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {movie?.description || "Không có mô tả"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Suất chiếu
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {showtime?.startTime
                                ? formatDateTime(showtime.startTime)
                                : "--"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {cinema?.name || "--"} · {room?.name || "--"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Ghế / Vé
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Ghế: {seats}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Mã vé: {booking.Ticket?.ticketCode || "--"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Snack / Combo
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {snacks}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-[240px] lg:text-right">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Tổng thanh toán
                        </div>

                        <div className="mt-2 text-2xl font-bold text-brand-600">
                          {formatCurrency(booking.totalAmount)}
                        </div>

                        <StatusBadge
                          status={booking.status}
                          paymentStatus={booking.paymentStatus}
                        />

                        <div className="mt-4 flex flex-col gap-2 lg:items-end">
                          <Link
                            to={`/my-bookings/${booking.id}`}
                            className="btn-secondary w-full text-center lg:w-auto"
                          >
                            Xem chi tiết / QR
                          </Link>

                          {isWaitingPayment && (
                            <button
                              className="btn-primary w-full lg:w-auto"
                              onClick={() => handlePayNow(booking)}
                              disabled={
                                confirmPaymentMutation.isPending ||
                                cancelMutation.isPending
                              }
                            >
                              {isPayingCurrentBooking
                                ? "Đang thanh toán..."
                                : "Thanh toán ngay"}
                            </button>
                          )}

                          {canCancel && (
                            <button
                              className="btn-secondary w-full lg:w-auto"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={
                                cancelMutation.isPending ||
                                confirmPaymentMutation.isPending
                              }
                            >
                              {isCancelingCurrentBooking
                                ? "Đang hủy vé..."
                                : "Hủy vé"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
