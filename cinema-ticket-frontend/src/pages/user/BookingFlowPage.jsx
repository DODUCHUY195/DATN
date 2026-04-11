import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { CardSkeleton } from "../../components/common/Skeleton";
import toast from "react-hot-toast";
import ErrorState from "../../components/common/ErrorState";
import SeatMap from "../../components/booking/SeatMap";
import SnackSelector from "../../components/booking/SnackSelector";
import { useSeatMap, useShowtimes } from "../../hooks/useShowtimes";
import { useSnacks } from "../../hooks/useSnacks";
import { useConfirmPayment, useHoldBooking } from "../../hooks/useBookings";
import { useBookingStore } from "../../stores/bookingStore";
import { useCountdown } from "../../hooks/useCountdown";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { getApiErrorMessage } from "../../hooks/useApiError";
import CustomSelect from "../../components/ui/CustomSelect";
import { BASE_URL_API } from "../../constants/env";

const formatReleaseDate = (value) => {
  if (!value) return "Đang cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeMovieMeta = (movie) => {
  if (!movie) return [];

  const rawGenres =
    movie.genres || movie.genre || movie.category || movie.categories;
  const genres = Array.isArray(rawGenres) ? rawGenres.join(", ") : rawGenres;

  const durationValue =
    movie.durationMinutes || movie.duration || movie.runningTime;

  return [
    {
      label: "Thời lượng",
      value: durationValue ? `${durationValue} phút` : null,
    },
    {
      label: "Thể loại",
      value: genres || null,
    },
    {
      label: "Độ tuổi",
      value: movie.ageRating || movie.rating || movie.censorRating || null,
    },
    {
      label: "Ngôn ngữ",
      value: movie.language || movie.audioLanguage || null,
    },
    {
      label: "Phụ đề",
      value: movie.subtitle || movie.subtitleLanguage || null,
    },
    {
      label: "Khởi chiếu",
      value: movie.releaseDate ? formatReleaseDate(movie.releaseDate) : null,
    },
  ].filter((item) => item.value);
};

/**
 * Validate ghế:
 * - 1 ghế: luôn hợp lệ
 * - từ 2 ghế trở lên:
 *   + phải cùng hàng
 *   + seatNumber phải liền nhau (ví dụ 5,6,7)
 */
const validateAdjacentSeats = (seats) => {
  if (!Array.isArray(seats) || seats.length <= 1) {
    return {
      valid: true,
      message: "",
    };
  }

  const firstRow = String(seats[0]?.rowLabel ?? "");
  const isSameRow = seats.every(
    (seat) => String(seat?.rowLabel ?? "") === firstRow,
  );

  if (!isSameRow) {
    return {
      valid: false,
      message:
        "Khi chọn từ 2 ghế trở lên, vui lòng chọn các ghế liền kề trong cùng một hàng.",
    };
  }

  const seatNumbers = seats
    .map((seat) => Number(seat?.seatNumber))
    .filter((num) => !Number.isNaN(num))
    .sort((a, b) => a - b);

  for (let i = 1; i < seatNumbers.length; i += 1) {
    if (seatNumbers[i] - seatNumbers[i - 1] !== 1) {
      return {
        valid: false,
        message:
          "Ghế đã chọn phải nằm liền kề nhau. Vui lòng không bỏ trống ghế ở giữa.",
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
};

export default function BookingFlowPage() {
  const { showtimeId } = useParams();
  const previousShowtimeIdRef = useRef(showtimeId);

  const seatQuery = useSeatMap(showtimeId);
  const showtimesQuery = useShowtimes({});
  const snacksQuery = useSnacks();
  const holdMutation = useHoldBooking();
  const paymentMutation = useConfirmPayment();
  const { control, handleSubmit } = useForm({
    defaultValues: { method: "DEMO" },
  });

  const {
    selectedSeats,
    selectedSnacks,
    toggleSeat,
    updateSnackQuantity,
    heldBooking,
    setHeldBooking,
    setSelectedShowtime,
    resetBooking,
  } = useBookingStore();

  const showtime = useMemo(
    () =>
      (showtimesQuery.data || []).find(
        (item) => String(item.id) === String(showtimeId),
      ),
    [showtimesQuery.data, showtimeId],
  );

  const movie = showtime?.Movie;
  const movieMeta = useMemo(() => normalizeMovieMeta(movie), [movie]);

  const countdown = useCountdown(heldBooking?.expiresAt);
  const seatTotal = (showtime?.basePrice || 0) * selectedSeats.length;
  const snackTotal = selectedSnacks.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = heldBooking?.totalAmount || seatTotal + snackTotal;

  useEffect(() => {
    const previousShowtimeId = previousShowtimeIdRef.current;

    if (
      previousShowtimeId &&
      String(previousShowtimeId) !== String(showtimeId)
    ) {
      resetBooking();
    }

    previousShowtimeIdRef.current = showtimeId;
  }, [showtimeId, resetBooking]);

  useEffect(() => {
    if (showtime) {
      setSelectedShowtime(showtime);
    }
  }, [showtime, setSelectedShowtime]);

  useEffect(() => {
    return () => {
      resetBooking();
    };
  }, [resetBooking]);

  const handleToggleSeatWithValidation = (seat) => {
    const isSelected = selectedSeats.some(
      (selectedSeat) => String(selectedSeat.id) === String(seat.id),
    );

    // Nếu đang được chọn rồi thì cho bỏ chọn bình thường
    if (isSelected) {
      toggleSeat(seat);
      return;
    }

    const nextSelectedSeats = [...selectedSeats, seat];
    const validation = validateAdjacentSeats(nextSelectedSeats);

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    toggleSeat(seat);
  };

  if (seatQuery.isLoading || snacksQuery.isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <CardSkeleton className="h-[640px]" />
        <CardSkeleton className="h-[520px]" />
      </div>
    );
  }

  if (seatQuery.isError) {
    return (
      <ErrorState
        message="Không tải được sơ đồ ghế"
        onRetry={seatQuery.refetch}
      />
    );
  }

  const handleHoldSeats = async () => {
    const validation = validateAdjacentSeats(selectedSeats);

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const response = await holdMutation.mutateAsync({
      showtimeId: Number(showtimeId),
      seatIds: selectedSeats.map((seat) => seat.id),
      snacks: selectedSnacks.map(({ snackId, quantity }) => ({
        snackId,
        quantity,
      })),
    });

    setHeldBooking(response.data);
  };

  const handlePayment = async ({ method }) => {
    await paymentMutation.mutateAsync({
      id: heldBooking.id,
      payload: { method },
    });

    resetBooking();
    toast.success("Thanh toán thành công. Vé đã được xác nhận.");
  };

  const posterUrl =
    movie?.posterUrl ||
    movie?.poster ||
    movie?.thumbnail ||
    movie?.image ||
    movie?.coverImage;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
      <div className="space-y-6">
        <div className="card-premium p-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Chọn ghế & combo
          </h1>

          {showtime && (
            <div className="mt-5 flex flex-col gap-5 md:flex-row">
              <div className="h-[220px] w-full overflow-hidden rounded-3xl bg-slate-100 md:w-[160px] md:min-w-[160px]">
                {posterUrl ? (
                  <img
                    src={`${BASE_URL_API ?? "http://localhost:3000"}${posterUrl}`}
                    alt={movie?.title || "Poster phim"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                    Chưa có poster phim
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                      Thông tin phim
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {movie?.title || "Đang cập nhật tên phim"}
                    </h2>

                    {movie?.originalTitle &&
                      movie.originalTitle !== movie.title && (
                        <p className="mt-1 text-sm text-slate-500">
                          {movie.originalTitle}
                        </p>
                      )}
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-right text-sm text-emerald-700">
                    <div className="font-semibold">Suất chiếu</div>
                    <div>{formatDateTime(showtime.startTime)}</div>
                  </div>
                </div>

                {movie?.description && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {movie.description}
                  </p>
                )}

                {!!movieMeta.length && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {movieMeta.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {item.label}
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-700">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    🎬 {showtime.Room?.Cinema?.name || "Đang cập nhật rạp"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    🪑 {showtime.Room?.name || "Đang cập nhật phòng chiếu"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    🎟️ {formatCurrency(showtime.basePrice || 0)} / ghế
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card-premium p-6">
          <SeatMap
            seats={seatQuery.data || []}
            selectedSeats={selectedSeats}
            onToggle={handleToggleSeatWithValidation}
          />
        </div>

        <div className="card-premium p-6">
          <h2 className="mb-4 text-xl font-bold">Chọn bỏng / nước</h2>
          <SnackSelector
            snacks={snacksQuery.data || []}
            selectedSnacks={selectedSnacks}
            onChange={updateSnackQuantity}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="card-premium sticky top-24 p-6">
          <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>

          {showtime && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="text-base font-semibold text-slate-900">
                {movie?.title || "Thông tin phim"}
              </div>
              <div className="mt-1 space-y-1">
                <p>{showtime.Room?.Cinema?.name || "Đang cập nhật rạp"}</p>
                <p>{showtime.Room?.name || "Đang cập nhật phòng chiếu"}</p>
                <p>{formatDateTime(showtime.startTime)}</p>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <span>Ghế đã chọn</span>
              <span className="text-right">
                {selectedSeats
                  .map((seat) => `${seat.rowLabel}${seat.seatNumber}`)
                  .join(", ") || "Chưa chọn"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Số ghế</span>
              <span>{selectedSeats.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Tiền ghế</span>
              <span>{formatCurrency(seatTotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Tiền snack</span>
              <span>{formatCurrency(snackTotal)}</span>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <div className="flex justify-between">
                <span>Tổng cộng</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {!heldBooking ? (
            <>
              {holdMutation.isError && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {getApiErrorMessage(holdMutation.error)}
                </p>
              )}

              <button
                type="button"
                className="btn-primary mt-5 w-full"
                disabled={!selectedSeats.length || holdMutation.isPending}
                onClick={handleHoldSeats}
              >
                {holdMutation.isPending
                  ? "Đang giữ ghế..."
                  : "Giữ ghế tạm thời"}
              </button>
            </>
          ) : (
            <form
              className="mt-5 space-y-4"
              onSubmit={handleSubmit(handlePayment)}
            >
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                Ghế được giữ đến: <strong>{countdown.formatted}</strong>
              </div>

              <div>
                <Controller
                  control={control}
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
              </div>

              {paymentMutation.isError && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {getApiErrorMessage(paymentMutation.error)}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={countdown.isExpired || paymentMutation.isPending}
              >
                {paymentMutation.isPending
                  ? "Đang xác nhận thanh toán..."
                  : "Thanh toán & nhận vé"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
