import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import { useBookingDetail } from "../../hooks/useBookings";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { BASE_URL_API } from "../../constants/env";

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
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${displayStatus.className}`}
    >
      {displayStatus.label}
    </span>
  );
}

function buildImageUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${BASE_URL_API ?? "http://localhost:3000"}${url}`;
}

function InfoCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || "--"}
      </p>

      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bookingQuery = useBookingDetail(id);
  const booking = bookingQuery.data;

  const showtime = booking?.Showtime;
  const movie = showtime?.Movie;
  const room = showtime?.Room;
  const cinema = room?.Cinema;
  const ticket = booking?.Ticket;

  const seats =
    booking?.SeatReservations?.map(
      (item) => item.Seat?.seatNumber || item.Seat?.name || item.seatId,
    ).join(", ") || "--";

  const snacks =
    booking?.BookingSnacks?.map(
      (item) => `${item.Snack?.name || "Snack"} x${item.quantity || 1}`,
    ).join(", ") || "--";

  const ticketCode = ticket?.ticketCode || booking?.code || "";

  //   const qrValue = useMemo(() => {
  //     if (!booking) return "";

  //     const origin = typeof window !== "undefined" ? window.location.origin : "";

  //     return JSON.stringify({
  //       type: "MOVIE_TICKET",
  //       bookingId: booking.id,
  //       bookingCode: booking.code,
  //       ticketCode: ticket?.ticketCode || null,
  //       checkUrl: `${origin}/my-bookings/${booking.id}`,
  //     });
  //   }, [booking, ticket?.ticketCode]);

  const qrValue = useMemo(() => {
    if (!booking?.id) return "";

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return `${origin}/my-bookings/${booking.id}`;
  }, [booking?.id]);

  const handleCopyTicketCode = async () => {
    if (!ticketCode) return;

    try {
      await navigator.clipboard.writeText(ticketCode);
      toast.success("Đã copy mã vé");
    } catch {
      toast.error("Không thể copy mã vé");
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Chi tiết vé" />

      {bookingQuery.isLoading ? (
        <LoadingSpinner />
      ) : bookingQuery.isError ? (
        <ErrorState
          message="Không tải được chi tiết vé"
          onRetry={bookingQuery.refetch}
        />
      ) : !booking ? (
        <EmptyState
          title="Không tìm thấy vé"
          description="Vé này không tồn tại hoặc bạn không có quyền xem."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </button>

            <Link to="/my-bookings" className="btn-secondary">
              Vé của tôi
            </Link>

            <button
              type="button"
              className="btn-primary"
              onClick={handlePrintTicket}
            >
              In vé
            </button>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[300px_1fr_320px]">
              <div className="relative min-h-[360px] bg-slate-100 dark:bg-slate-900">
                {movie?.posterUrl ? (
                  <img
                    src={buildImageUrl(movie.posterUrl)}
                    alt={movie?.title || "movie-poster"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-400">
                    Không có poster
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                  <p className="line-clamp-2 text-xl font-bold text-white">
                    {movie?.title || "Chưa có tên phim"}
                  </p>

                  {movie?.durationMinutes ? (
                    <p className="mt-1 text-sm text-white/80">
                      {movie.durationMinutes} phút
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="p-5 lg:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Mã booking
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {booking.code || "--"}
                    </h2>
                  </div>

                  <StatusBadge
                    status={booking.status}
                    paymentStatus={booking.paymentStatus}
                  />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Phim"
                    value={movie?.title}
                    description={movie?.description || "Không có mô tả"}
                  />

                  <InfoCard
                    label="Suất chiếu"
                    value={
                      showtime?.startTime
                        ? formatDateTime(showtime.startTime)
                        : "--"
                    }
                    description={`${cinema?.name || "--"} · ${room?.name || "--"}`}
                  />

                  <InfoCard
                    label="Ghế"
                    value={seats}
                    description="Danh sách ghế đã đặt"
                  />

                  <InfoCard
                    label="Mã vé"
                    value={ticket?.ticketCode || "--"}
                    description="Dùng mã này để đối chiếu khi check vé"
                  />

                  <InfoCard
                    label="Snack / Combo"
                    value={snacks}
                    description="Đồ ăn, nước uống đi kèm booking"
                  />

                  <InfoCard
                    label="Tổng thanh toán"
                    value={formatCurrency(booking.totalAmount)}
                    description={translatePaymentStatus(booking.paymentStatus)}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Ghi chú kiểm vé
                  </p>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Nhân viên có thể quét mã QR hoặc đối chiếu trực tiếp mã vé:{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ticketCode || "--"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900 lg:border-l lg:border-t-0">
                <div className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    QR check vé
                  </p>

                  <div className="mt-5 flex justify-center rounded-2xl bg-white p-4">
                    {qrValue ? (
                      <QRCodeSVG
                        value={qrValue}
                        size={220}
                        level="H"
                        includeMargin
                      />
                    ) : (
                      <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
                        Chưa có QR
                      </div>
                    )}
                  </div>

                  <p className="mt-4 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ticketCode || "--"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Quét QR để lấy thông tin booking / mã vé.
                  </p>

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      type="button"
                      className="btn-secondary w-full"
                      onClick={handleCopyTicketCode}
                      disabled={!ticketCode}
                    >
                      Copy mã vé
                    </button>

                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={handlePrintTicket}
                    >
                      In / lưu vé
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
