// import { useEffect, useMemo, useRef } from "react";
// import { useParams } from "react-router-dom";
// import { Controller, useForm } from "react-hook-form";
// import { CardSkeleton } from "../../components/common/Skeleton";
// import toast from "react-hot-toast";
// import ErrorState from "../../components/common/ErrorState";
// import SeatMap from "../../components/booking/SeatMap";
// import SnackSelector from "../../components/booking/SnackSelector";
// import { useSeatMap, useShowtimes } from "../../hooks/useShowtimes";
// import { useSnacks } from "../../hooks/useSnacks";
// import { useConfirmPayment, useHoldBooking } from "../../hooks/useBookings";
// import { useBookingStore } from "../../stores/bookingStore";
// import { useCountdown } from "../../hooks/useCountdown";
// import { formatCurrency, formatDateTime } from "../../utils/format";
// import { getApiErrorMessage } from "../../hooks/useApiError";
// import CustomSelect from "../../components/ui/CustomSelect";
// import { BASE_URL_API } from "../../constants/env";

// const formatReleaseDate = (value) => {
//   if (!value) return "Đang cập nhật";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return new Intl.DateTimeFormat("vi-VN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   }).format(date);
// };

// const normalizeMovieMeta = (movie) => {
//   if (!movie) return [];

//   const rawGenres =
//     movie.genres || movie.genre || movie.category || movie.categories;
//   const genres = Array.isArray(rawGenres) ? rawGenres.join(", ") : rawGenres;

//   const durationValue =
//     movie.durationMinutes || movie.duration || movie.runningTime;

//   return [
//     {
//       label: "Thời lượng",
//       value: durationValue ? `${durationValue} phút` : null,
//     },
//     {
//       label: "Thể loại",
//       value: genres || null,
//     },
//     {
//       label: "Độ tuổi",
//       value: movie.ageRating || movie.rating || movie.censorRating || null,
//     },
//     {
//       label: "Ngôn ngữ",
//       value: movie.language || movie.audioLanguage || null,
//     },
//     {
//       label: "Phụ đề",
//       value: movie.subtitle || movie.subtitleLanguage || null,
//     },
//     {
//       label: "Khởi chiếu",
//       value: movie.releaseDate ? formatReleaseDate(movie.releaseDate) : null,
//     },
//   ].filter((item) => item.value);
// };

// export default function BookingFlowPage() {
//   const { showtimeId } = useParams();
//   const previousShowtimeIdRef = useRef(showtimeId);

//   const seatQuery = useSeatMap(showtimeId);
//   const showtimesQuery = useShowtimes({});
//   const snacksQuery = useSnacks();
//   const holdMutation = useHoldBooking();
//   const paymentMutation = useConfirmPayment();
//   const { control, handleSubmit } = useForm({
//     defaultValues: { method: "DEMO" },
//   });

//   const {
//     selectedSeats,
//     selectedSnacks,
//     toggleSeat,
//     updateSnackQuantity,
//     heldBooking,
//     setHeldBooking,
//     setSelectedShowtime,
//     resetBooking,
//   } = useBookingStore();

//   const showtime = useMemo(
//     () =>
//       (showtimesQuery.data || []).find(
//         (item) => String(item.id) === String(showtimeId),
//       ),
//     [showtimesQuery.data, showtimeId],
//   );

//   const movie = showtime?.Movie;
//   const movieMeta = useMemo(() => normalizeMovieMeta(movie), [movie]);

//   const countdown = useCountdown(heldBooking?.expiresAt);
//   const seatTotal = (showtime?.basePrice || 0) * selectedSeats.length;
//   const snackTotal = selectedSnacks.reduce(
//     (sum, item) => sum + item.price * item.quantity,
//     0,
//   );
//   const total = heldBooking?.totalAmount || seatTotal + snackTotal;

//   useEffect(() => {
//     const previousShowtimeId = previousShowtimeIdRef.current;

//     if (
//       previousShowtimeId &&
//       String(previousShowtimeId) !== String(showtimeId)
//     ) {
//       resetBooking();
//     }

//     previousShowtimeIdRef.current = showtimeId;
//   }, [showtimeId, resetBooking]);

//   useEffect(() => {
//     if (showtime) {
//       setSelectedShowtime(showtime);
//     }
//   }, [showtime, setSelectedShowtime]);

//   useEffect(() => {
//     return () => {
//       resetBooking();
//     };
//   }, [resetBooking]);

//   if (seatQuery.isLoading || snacksQuery.isLoading) {
//     return (
//       <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
//         <CardSkeleton className="h-[640px]" />
//         <CardSkeleton className="h-[520px]" />
//       </div>
//     );
//   }

//   if (seatQuery.isError) {
//     return (
//       <ErrorState
//         message="Không tải được sơ đồ ghế"
//         onRetry={seatQuery.refetch}
//       />
//     );
//   }

//   const handleHoldSeats = async () => {
//     const response = await holdMutation.mutateAsync({
//       showtimeId: Number(showtimeId),
//       seatIds: selectedSeats.map((seat) => seat.id),
//       snacks: selectedSnacks.map(({ snackId, quantity }) => ({
//         snackId,
//         quantity,
//       })),
//     });

//     setHeldBooking(response.data);
//   };

//   const handlePayment = async ({ method }) => {
//     await paymentMutation.mutateAsync({
//       id: heldBooking.id,
//       payload: { method },
//     });

//     resetBooking();
//     toast.success("Thanh toán thành công. Vé đã được xác nhận.");
//   };

//   const posterUrl =
//     movie?.posterUrl ||
//     movie?.poster ||
//     movie?.thumbnail ||
//     movie?.image ||
//     movie?.coverImage;

//   return (
//     <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
//       <div className="space-y-6">
//         <div className="card-premium p-6">
//           <h1 className="text-2xl font-bold text-slate-900">
//             Chọn ghế & combo
//           </h1>

//           {showtime && (
//             <div className="mt-5 flex flex-col gap-5 md:flex-row">
//               <div className="h-[220px] w-full overflow-hidden rounded-3xl bg-slate-100 md:w-[160px] md:min-w-[160px]">
//                 {posterUrl ? (
//                   <img
//                     // src={posterUrl}
//                     src={`${BASE_URL_API ?? "http://localhost:3000"}${posterUrl}`}
//                     alt={movie?.title || "Poster phim"}
//                     className="h-full w-full object-cover"
//                   />
//                 ) : (
//                   <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
//                     Chưa có poster phim
//                   </div>
//                 )}
//               </div>

//               <div className="flex-1">
//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                   <div>
//                     <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
//                       Thông tin phim
//                     </p>
//                     <h2 className="mt-1 text-2xl font-bold text-slate-900">
//                       {movie?.title || "Đang cập nhật tên phim"}
//                     </h2>

//                     {movie?.originalTitle &&
//                       movie.originalTitle !== movie.title && (
//                         <p className="mt-1 text-sm text-slate-500">
//                           {movie.originalTitle}
//                         </p>
//                       )}
//                   </div>

//                   <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-right text-sm text-emerald-700">
//                     <div className="font-semibold">Suất chiếu</div>
//                     <div>{formatDateTime(showtime.startTime)}</div>
//                   </div>
//                 </div>

//                 {movie?.description && (
//                   <p className="mt-4 text-sm leading-6 text-slate-600">
//                     {movie.description}
//                   </p>
//                 )}

//                 {!!movieMeta.length && (
//                   <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
//                     {movieMeta.map((item) => (
//                       <div
//                         key={item.label}
//                         className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
//                       >
//                         <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
//                           {item.label}
//                         </div>
//                         <div className="mt-1 text-sm font-medium text-slate-700">
//                           {item.value}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
//                   <span className="rounded-full bg-slate-100 px-3 py-1.5">
//                     🎬 {showtime.Room?.Cinema?.name || "Đang cập nhật rạp"}
//                   </span>
//                   <span className="rounded-full bg-slate-100 px-3 py-1.5">
//                     🪑 {showtime.Room?.name || "Đang cập nhật phòng chiếu"}
//                   </span>
//                   <span className="rounded-full bg-slate-100 px-3 py-1.5">
//                     🎟️ {formatCurrency(showtime.basePrice || 0)} / ghế
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="card-premium p-6">
//           <SeatMap
//             seats={seatQuery.data || []}
//             selectedSeats={selectedSeats}
//             onToggle={toggleSeat}
//           />
//         </div>

//         <div className="card-premium p-6">
//           <h2 className="mb-4 text-xl font-bold">Chọn bỏng / nước</h2>
//           <SnackSelector
//             snacks={snacksQuery.data || []}
//             selectedSnacks={selectedSnacks}
//             onChange={updateSnackQuantity}
//           />
//         </div>
//       </div>

//       <div className="space-y-6">
//         <div className="card-premium sticky top-24 p-6">
//           <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>

//           {showtime && (
//             <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
//               <div className="text-base font-semibold text-slate-900">
//                 {movie?.title || "Thông tin phim"}
//               </div>
//               <div className="mt-1 space-y-1">
//                 <p>{showtime.Room?.Cinema?.name || "Đang cập nhật rạp"}</p>
//                 <p>{showtime.Room?.name || "Đang cập nhật phòng chiếu"}</p>
//                 <p>{formatDateTime(showtime.startTime)}</p>
//               </div>
//             </div>
//           )}

//           <div className="mt-5 space-y-3 text-sm text-slate-600">
//             <div className="flex justify-between gap-4">
//               <span>Ghế đã chọn</span>
//               <span className="text-right">
//                 {selectedSeats
//                   .map((seat) => `${seat.rowLabel}${seat.seatNumber}`)
//                   .join(", ") || "Chưa chọn"}
//               </span>
//             </div>

//             <div className="flex justify-between">
//               <span>Số ghế</span>
//               <span>{selectedSeats.length}</span>
//             </div>

//             <div className="flex justify-between">
//               <span>Tiền ghế</span>
//               <span>{formatCurrency(seatTotal)}</span>
//             </div>

//             <div className="flex justify-between">
//               <span>Tiền snack</span>
//               <span>{formatCurrency(snackTotal)}</span>
//             </div>

//             <div className="border-t border-dashed border-slate-200 pt-3 text-base font-semibold text-slate-900">
//               <div className="flex justify-between">
//                 <span>Tổng cộng</span>
//                 <span>{formatCurrency(total)}</span>
//               </div>
//             </div>
//           </div>

//           {!heldBooking ? (
//             <>
//               {holdMutation.isError && (
//                 <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
//                   {getApiErrorMessage(holdMutation.error)}
//                 </p>
//               )}

//               <button
//                 type="button"
//                 className="btn-primary mt-5 w-full"
//                 disabled={!selectedSeats.length || holdMutation.isPending}
//                 onClick={handleHoldSeats}
//               >
//                 {holdMutation.isPending
//                   ? "Đang giữ ghế..."
//                   : "Giữ ghế tạm thời"}
//               </button>
//             </>
//           ) : (
//             <form
//               className="mt-5 space-y-4"
//               onSubmit={handleSubmit(handlePayment)}
//             >
//               <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
//                 Ghế được giữ đến: <strong>{countdown.formatted}</strong>
//               </div>

//               <div>
//                 <Controller
//                   control={control}
//                   name="method"
//                   render={({ field }) => (
//                     <CustomSelect
//                       label="Phương thức thanh toán"
//                       value={field.value}
//                       onChange={field.onChange}
//                       options={[
//                         {
//                           value: "DEMO",
//                           label: "DEMO",
//                           emoji: "🧪",
//                           meta: "Thanh toán mô phỏng",
//                         },
//                         {
//                           value: "CARD",
//                           label: "CARD",
//                           emoji: "💳",
//                           meta: "Thẻ ngân hàng",
//                         },
//                         {
//                           value: "CASH",
//                           label: "CASH",
//                           emoji: "💵",
//                           meta: "Tiền mặt tại quầy",
//                         },
//                       ]}
//                     />
//                   )}
//                 />
//               </div>

//               {paymentMutation.isError && (
//                 <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
//                   {getApiErrorMessage(paymentMutation.error)}
//                 </p>
//               )}

//               <button
//                 type="submit"
//                 className="btn-primary w-full"
//                 disabled={countdown.isExpired || paymentMutation.isPending}
//               >
//                 {paymentMutation.isPending
//                   ? "Đang xác nhận thanh toán..."
//                   : "Thanh toán & nhận vé"}
//               </button>
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/ui/Modal";
import CustomSelect from "../../components/ui/CustomSelect";
import {
  useCancelBooking,
  useConfirmPayment,
  useMyBookings,
} from "../../hooks/useBookings";
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
      paymentStatus
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

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const paymentForm = useForm({
    defaultValues: {
      method: "DEMO",
    },
  });

  const handleOpenPayment = (booking) => {
    setPaymentTarget(booking);
    paymentForm.reset({
      method: "DEMO",
    });
    setOpenPaymentModal(true);
  };

  const handleClosePayment = () => {
    setOpenPaymentModal(false);
    setPaymentTarget(null);
    paymentForm.reset({
      method: "DEMO",
    });
  };

  const handleConfirmPayment = paymentForm.handleSubmit(async (values) => {
    if (!paymentTarget?.id) {
      toast.error("Không tìm thấy booking để thanh toán");
      return;
    }

    try {
      await confirmPaymentMutation.mutateAsync({
        id: paymentTarget.id,
        payload: {
          method: values.method,
        },
      });

      toast.success("Thanh toán thành công");
      handleClosePayment();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể thanh toán booking này"
      );
    }
  });

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
                  item.Seat?.seatNumber || item.Seat?.name || item.seatId
              ).join(", ") || "--";

            const snacks =
              booking.BookingSnacks?.map(
                (item) =>
                  `${item.Snack?.name || "Snack"} x${item.quantity || 1}`
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
                          {isWaitingPayment && (
                            <button
                              className="btn-primary w-full lg:w-auto"
                              onClick={() => handleOpenPayment(booking)}
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

      <Modal
        open={openPaymentModal}
        onClose={handleClosePayment}
        title="Chọn phương thức thanh toán"
        subtitle={
          paymentTarget
            ? `Booking ${paymentTarget.code} · ${formatCurrency(
                paymentTarget.totalAmount || 0
              )}`
            : "Xác nhận thanh toán booking"
        }
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClosePayment}
              disabled={confirmPaymentMutation.isPending}
            >
              Đóng
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirmPayment}
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending
                ? "Đang thanh toán..."
                : "Xác nhận thanh toán"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Controller
            control={paymentForm.control}
            name="method"
            render={({ field }) => (
              <CustomSelect
                label="Phương thức thanh toán"
                value={field.value}
                onChange={field.onChange}
                options={[
                  {
                    value: "DEMO",
                    label: "DEMO",
                    emoji: "🧪",
                    meta: "Thanh toán mô phỏng",
                  },
                  {
                    value: "CARD",
                    label: "CARD",
                    emoji: "💳",
                    meta: "Thẻ ngân hàng",
                  },
                  {
                    value: "CASH",
                    label: "CASH",
                    emoji: "💵",
                    meta: "Tiền mặt tại quầy",
                  },
                ]}
              />
            )}
          />

          {paymentTarget ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <p>
                <span className="font-semibold">Mã booking:</span>{" "}
                {paymentTarget.code}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Tổng tiền:</span>{" "}
                {formatCurrency(paymentTarget.totalAmount || 0)}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}