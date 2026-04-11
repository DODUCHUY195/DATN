
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  CalendarPlus2,
  Eye,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { CardSkeleton } from "../../components/common/Skeleton";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/table/DataTable";
import PermissionGate from "../../components/admin/PermissionGate";
import { useTableState } from "../../hooks/useTableState";
import {
  useAdminMovies,
  useAdminMutations,
  useAdminRooms,
  useAdminShowtimes,
} from "../../hooks/useAdmin";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { PERMISSIONS } from "../../constants/permissions";
import { showtimeSchema } from "../../utils/schemas";
import CustomSelect from "../../components/ui/CustomSelect";

const CLEANUP_MINUTES = 30;
const SLOT_STEP_MINUTES = 5;

const defaultValues = {
  movieId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  basePrice: 90000,
  status: "ACTIVE",
};

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function toIsoString(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function addMinutes(value, minutes) {
  const date = new Date(value);
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatTimeOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function diffMinutes(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function isSameLocalDate(dateValue, targetDate) {
  if (!dateValue || !targetDate) return false;
  return toDateInputValue(dateValue) === targetDate;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      last.items = [...(last.items || []), ...(current.items || [])];
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function buildAvailability({
  showtimes,
  roomId,
  selectedDate,
  movieDurationMinutes,
  editingShowtimeId,
}) {
  if (!roomId || !selectedDate) {
    return {
      roomSchedule: [],
      freeWindows: [],
      slotGroups: [],
    };
  }

  const roomSchedule = [...(showtimes || [])]
    .filter((showtime) => String(showtime.roomId) === String(roomId))
    .filter((showtime) => isSameLocalDate(showtime.startTime, selectedDate))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  if (!movieDurationMinutes || Number(movieDurationMinutes) <= 0) {
    return {
      roomSchedule,
      freeWindows: [],
      slotGroups: [],
    };
  }

  const busySource = roomSchedule.filter(
    (showtime) => showtime.id !== editingShowtimeId,
  );

  const rawBusyIntervals = busySource
    .map((showtime) => {
      const start = new Date(showtime.startTime);
      const movieEnd = new Date(showtime.endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(movieEnd.getTime())) {
        return null;
      }

      return {
        start,
        end: addMinutes(movieEnd, CLEANUP_MINUTES),
        items: [showtime],
      };
    })
    .filter(Boolean);

  const dayStart = new Date(`${selectedDate}T00:00:00`);
  const nextDayStart = new Date(`${selectedDate}T00:00:00`);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const normalizedBusy = rawBusyIntervals
    .map((interval) => ({
      ...interval,
      start: new Date(Math.max(interval.start.getTime(), dayStart.getTime())),
      end: new Date(Math.min(interval.end.getTime(), nextDayStart.getTime())),
    }))
    .filter((interval) => interval.start < interval.end);

  const mergedBusy = mergeIntervals(normalizedBusy);

  const freeWindows = [];
  let cursor = new Date(dayStart);

  mergedBusy.forEach((busy) => {
    if (cursor < busy.start) {
      freeWindows.push({
        start: new Date(cursor),
        end: new Date(busy.start),
      });
    }

    if (busy.end > cursor) {
      cursor = new Date(busy.end);
    }
  });

  if (cursor < nextDayStart) {
    freeWindows.push({
      start: new Date(cursor),
      end: new Date(nextDayStart),
    });
  }

  const totalNeededMinutes = Number(movieDurationMinutes) + CLEANUP_MINUTES;

  const slotGroups = freeWindows
    .map((window, index) => {
      const latestAllowedStart = addMinutes(window.end, -totalNeededMinutes);

      if (latestAllowedStart < window.start) return null;

      const options = [];
      const seen = new Set();

      const pushOption = (date) => {
        const time = date.getTime();
        if (!seen.has(time)) {
          seen.add(time);
          options.push(new Date(time));
        }
      };

      pushOption(window.start);

      let current = addMinutes(window.start, SLOT_STEP_MINUTES);
      while (current < latestAllowedStart) {
        pushOption(current);
        current = addMinutes(current, SLOT_STEP_MINUTES);
      }

      pushOption(latestAllowedStart);

      return {
        id: `${window.start.getTime()}-${window.end.getTime()}-${index}`,
        start: window.start,
        end: window.end,
        latestAllowedStart,
        options,
      };
    })
    .filter(Boolean);

  return {
    roomSchedule,
    freeWindows,
    slotGroups,
  };
}

function validateManualTimeRange({
  startTime,
  endTime,
  selectedDate,
  movieDurationMinutes,
  freeWindows,
}) {
  if (!startTime || !endTime) {
    return {
      valid: false,
      message: "Vui lòng nhập đầy đủ giờ bắt đầu và giờ kết thúc.",
    };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      valid: false,
      message: "Thời gian nhập không hợp lệ.",
    };
  }

  if (start >= end) {
    return {
      valid: false,
      message: "Giờ kết thúc phải lớn hơn giờ bắt đầu.",
    };
  }

  if (selectedDate) {
    if (
      toDateInputValue(start) !== selectedDate ||
      toDateInputValue(end) !== selectedDate
    ) {
      return {
        valid: false,
        message:
          "Giờ bắt đầu và kết thúc phải nằm trong đúng ngày chiếu đã chọn.",
      };
    }
  }

  const actualDuration = diffMinutes(start, end);
  const expectedDuration = Number(movieDurationMinutes || 0);

  if (expectedDuration > 0 && actualDuration !== expectedDuration) {
    return {
      valid: false,
      message: `Khung giờ phim phải đúng ${expectedDuration} phút theo thời lượng phim.`,
    };
  }

  const occupiedEnd = addMinutes(end, CLEANUP_MINUTES);

  const matchedWindow = (freeWindows || []).find(
    (window) => start >= window.start && occupiedEnd <= window.end,
  );

  if (!matchedWindow) {
    return {
      valid: false,
      message: `Khung giờ đã nhập không nằm trọn trong khoảng trống hợp lệ sau khi tính thêm ${CLEANUP_MINUTES} phút dọn vệ sinh / bàn giao.`,
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export default function AdminShowtimesPage() {
  const showtimesQuery = useAdminShowtimes();
  const moviesQuery = useAdminMovies();
  const roomsQuery = useAdminRooms();
  const m = useAdminMutations();

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() =>
    toDateInputValue(new Date()),
  );

  const form = useForm({
    defaultValues,
    resolver: zodResolver(showtimeSchema),
  });

  const showtimes = showtimesQuery.data || [];
  const movies = moviesQuery.data || [];
  const rooms = roomsQuery.data || [];

  const watchedMovieId = form.watch("movieId");
  const watchedRoomId = form.watch("roomId");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");

  const selectedMovie = useMemo(
    () => movies.find((movie) => String(movie.id) === String(watchedMovieId)),
    [movies, watchedMovieId],
  );

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(watchedRoomId)),
    [rooms, watchedRoomId],
  );

  const availability = useMemo(
    () =>
      buildAvailability({
        showtimes,
        roomId: watchedRoomId,
        selectedDate: scheduleDate,
        movieDurationMinutes: Number(selectedMovie?.durationMinutes || 0),
        editingShowtimeId: editingShowtime?.id,
      }),
    [
      showtimes,
      watchedRoomId,
      scheduleDate,
      selectedMovie?.durationMinutes,
      editingShowtime?.id,
    ],
  );

  const manualTimeValidation = useMemo(() => {
    if (!watchedMovieId || !watchedRoomId || !scheduleDate) {
      return {
        valid: false,
        message: "Vui lòng chọn phim, phòng và ngày chiếu trước.",
      };
    }

    if (!watchedStartTime || !watchedEndTime) {
      return {
        valid: false,
        message: "Vui lòng nhập hoặc chọn khung giờ chiếu.",
      };
    }

    return validateManualTimeRange({
      startTime: watchedStartTime,
      endTime: watchedEndTime,
      selectedDate: scheduleDate,
      movieDurationMinutes: Number(selectedMovie?.durationMinutes || 0),
      freeWindows: availability.freeWindows,
    });
  }, [
    watchedMovieId,
    watchedRoomId,
    scheduleDate,
    watchedStartTime,
    watchedEndTime,
    selectedMovie?.durationMinutes,
    availability.freeWindows,
  ]);

  const conflictingShowtimes = useMemo(() => {
    if (!watchedRoomId || !watchedStartTime || !watchedEndTime) return [];

    const newStart = new Date(watchedStartTime);
    const newEnd = new Date(watchedEndTime);
    const newOccupiedEnd = addMinutes(newEnd, CLEANUP_MINUTES);

    if (
      Number.isNaN(newStart.getTime()) ||
      Number.isNaN(newEnd.getTime()) ||
      newStart >= newEnd
    ) {
      return [];
    }

    return showtimes.filter((showtime) => {
      const existingRoomId = String(showtime.roomId ?? showtime.Room?.id ?? "");
      const existingStart = new Date(showtime.startTime);
      const existingEnd = new Date(showtime.endTime);
      const existingOccupiedEnd = addMinutes(existingEnd, CLEANUP_MINUTES);

      if (editingShowtime?.id && showtime.id === editingShowtime.id) {
        return false;
      }

      if (existingRoomId !== String(watchedRoomId)) {
        return false;
      }

      if (
        Number.isNaN(existingStart.getTime()) ||
        Number.isNaN(existingEnd.getTime())
      ) {
        return false;
      }

      return rangesOverlap(
        newStart,
        newOccupiedEnd,
        existingStart,
        existingOccupiedEnd,
      );
    });
  }, [
    showtimes,
    watchedRoomId,
    watchedStartTime,
    watchedEndTime,
    editingShowtime,
  ]);

  const hasConflict = conflictingShowtimes.length > 0;

  const table = useTableState(showtimes, {
    pageSize: 8,
    defaultSort: { key: "startTime", direction: "desc" },
    searchFn: (showtime, keyword) =>
      [
        showtime.Movie?.title,
        showtime.Room?.name,
        showtime.Room?.Cinema?.name,
        showtime.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword)),
  });

  const isSubmitting = m.createShowtime.isPending || m.updateShowtime.isPending;
  const canGenerateSchedule =
    !!watchedMovieId && !!watchedRoomId && !!scheduleDate;
  const canEditTimeInputs = canGenerateSchedule;
  const hasTimeValues = !!watchedStartTime && !!watchedEndTime;
  const hasManualTimeError = hasTimeValues && !manualTimeValidation.valid;
  const disableSubmit =
    isSubmitting || hasConflict || !hasTimeValues || hasManualTimeError;

  const handleCloseFormModal = () => {
    setOpen(false);
    setEditingShowtime(null);
    setScheduleDate(toDateInputValue(new Date()));
    form.reset(defaultValues);
  };

  const handleOpenCreate = () => {
    setEditingShowtime(null);
    setScheduleDate(toDateInputValue(new Date()));
    form.reset(defaultValues);
    setOpen(true);
  };

  const handleOpenEdit = (showtime) => {
    setEditingShowtime(showtime);
    setScheduleDate(toDateInputValue(showtime.startTime));

    form.reset({
      movieId: String(showtime.movieId ?? showtime.Movie?.id ?? ""),
      roomId: String(showtime.roomId ?? showtime.Room?.id ?? ""),
      startTime: toDateTimeLocalValue(showtime.startTime),
      endTime: toDateTimeLocalValue(showtime.endTime),
      basePrice: showtime.basePrice ?? 90000,
      status: showtime.status || "ACTIVE",
    });

    setOpen(true);
  };

  const handleOpenDetail = (showtime) => {
    setDetailTarget(showtime);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailTarget(null);
  };

  const clearSelectedTime = () => {
    form.setValue("startTime", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("endTime", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleMovieChange = (value, onChange) => {
    onChange(value);
    clearSelectedTime();
  };

  const handleRoomChange = (value, onChange) => {
    onChange(value);
    clearSelectedTime();
  };

  const handleScheduleDateChange = (value) => {
    setScheduleDate(value);
    clearSelectedTime();
  };

  const handlePickStartSlot = (startDate) => {
    const durationMinutes = Number(selectedMovie?.durationMinutes || 0);

    if (!durationMinutes) {
      toast.error("Không tìm thấy thời lượng phim để tạo suất chiếu");
      return;
    }

    const endDate = addMinutes(startDate, durationMinutes);

    form.setValue("startTime", toDateTimeLocalValue(startDate), {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("endTime", toDateTimeLocalValue(endDate), {
      shouldDirty: true,
      shouldValidate: true,
    });

    toast.success(
      `Đã chọn khung giờ ${formatTimeOnly(startDate)} - ${formatTimeOnly(
        endDate,
      )}`,
    );
  };

  const handleAutofillEndTime = () => {
    const currentStartTime = form.getValues("startTime");

    if (!currentStartTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu");
      return;
    }

    const durationMinutes = Number(selectedMovie?.durationMinutes || 0);

    if (!durationMinutes) {
      toast.error("Không tìm thấy thời lượng phim");
      return;
    }

    const startDate = new Date(currentStartTime);

    if (Number.isNaN(startDate.getTime())) {
      toast.error("Giờ bắt đầu không hợp lệ");
      return;
    }

    const endDate = addMinutes(startDate, durationMinutes);

    form.setValue("endTime", toDateTimeLocalValue(endDate), {
      shouldDirty: true,
      shouldValidate: true,
    });

    toast.success("Đã tự tính giờ kết thúc theo thời lượng phim");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.startTime || !values.endTime) {
      toast.error("Vui lòng chọn hoặc nhập khung giờ trước khi lưu");
      return;
    }

    if (!manualTimeValidation.valid) {
      toast.error(manualTimeValidation.message || "Khung giờ không hợp lệ");
      return;
    }

    if (hasConflict) {
      toast.error(
        editingShowtime
          ? "Không thể cập nhật vì suất chiếu đang bị trùng lịch trong cùng phòng"
          : "Không thể tạo vì suất chiếu đang bị trùng lịch trong cùng phòng",
      );
      return;
    }

    const payload = {
      movieId: Number(values.movieId),
      roomId: Number(values.roomId),
      startTime: toIsoString(values.startTime),
      endTime: toIsoString(values.endTime),
      basePrice: Number(values.basePrice),
      status: values.status,
    };

    try {
      if (editingShowtime) {
        await m.updateShowtime.mutateAsync({
          id: editingShowtime.id,
          payload,
        });
        toast.success("Cập nhật suất chiếu thành công");
      } else {
        await m.createShowtime.mutateAsync(payload);
        toast.success("Tạo suất chiếu thành công");
      }

      handleCloseFormModal();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (editingShowtime
            ? "Không thể cập nhật suất chiếu"
            : "Không thể tạo suất chiếu"),
      );
    }
  });

  const confirmDelete = async () => {
    try {
      if (bulkDeleteMode) {
        await Promise.all(
          table.selectedIds.map((id) => m.deleteShowtime.mutateAsync(id)),
        );
        toast.success(`Đã xóa ${table.selectedIds.length} suất chiếu`);
        table.setSelectedIds([]);
        setBulkDeleteMode(false);
      } else if (deleteTarget?.id) {
        await m.deleteShowtime.mutateAsync(deleteTarget.id);
        toast.success("Đã xóa suất chiếu");
      }

      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa suất chiếu");
    }
  };

  const columns = [
    {
      key: "movie",
      label: "Phim",
      sortable: true,
      render: (showtime) => (
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">
            {showtime.Movie?.title || "—"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {showtime.Room?.Cinema?.name || "Chưa có rạp"} ·{" "}
            {showtime.Room?.name || "Chưa có phòng"}
          </p>
        </div>
      ),
    },
    {
      key: "startTime",
      label: "Thời gian",
      sortable: true,
      render: (showtime) => (
        <div>
          <p>{formatDateTime(showtime.startTime)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kết thúc: {formatDateTime(showtime.endTime)}
          </p>
        </div>
      ),
    },
    {
      key: "basePrice",
      label: "Giá vé",
      sortable: true,
      render: (showtime) => formatCurrency(showtime.basePrice || 0),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (showtime) => (
        <span
          className={`badge ${
            showtime.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {showtime.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (showtime) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleOpenDetail(showtime)}
          >
            <Eye size={16} />
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenEdit(showtime)}
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              setBulkDeleteMode(false);
              setDeleteTarget(showtime);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (
    showtimesQuery.isLoading ||
    moviesQuery.isLoading ||
    roomsQuery.isLoading
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  if (showtimesQuery.isError) {
    return (
      <ErrorState
        message="Không tải được suất chiếu"
        onRetry={showtimesQuery.refetch}
      />
    );
  }

  return (
    <PermissionGate permissions={[PERMISSIONS.SHOWTIMES_VIEW]}>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý suất chiếu"
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenCreate}
            >
              <CalendarPlus2 size={16} className="mr-2" />
              Tạo suất chiếu
            </button>
          }
        />

        <DataTable
          title="Danh sách suất chiếu"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Tìm phim, phòng, rạp, trạng thái..."
          columns={columns}
          rows={table.paginatedRows}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          emptyText="Không tìm thấy suất chiếu"
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
                { value: "ALL", label: "Tất cả trạng thái", emoji: "🎛️" },
                {
                  value: "ACTIVE",
                  label: "ACTIVE",
                  emoji: "🟢",
                  meta: "Đang mở bán",
                },
                {
                  value: "INACTIVE",
                  label: "INACTIVE",
                  emoji: "⚪",
                  meta: "Tạm ẩn",
                },
              ],
            },
          ]}
          bulkActions={[
            {
              key: "delete",
              label: "Xóa đã chọn",
              tone: "danger",
              onClick: () => {
                setBulkDeleteMode(true);
                setDeleteTarget({});
              },
            },
          ]}
        />

        <Modal
          open={open}
          onClose={handleCloseFormModal}
          title={editingShowtime ? "Chỉnh sửa suất chiếu" : "Tạo suất chiếu"}
          subtitle={
            editingShowtime
              ? `Đang chỉnh sửa suất chiếu #${editingShowtime.id}`
              : "Có thể bấm nhanh khung giờ gợi ý hoặc nhập tay giờ bắt đầu / kết thúc"
          }
          width="max-w-7xl"
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseFormModal}
                disabled={isSubmitting}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={onSubmit}
                disabled={disableSubmit}
              >
                {isSubmitting
                  ? "Đang lưu..."
                  : hasConflict
                    ? editingShowtime
                      ? "Đang bị trùng lịch sửa"
                      : "Đang bị trùng lịch"
                    : !hasTimeValues
                      ? "Chưa chọn khung giờ"
                      : hasManualTimeError
                        ? "Khung giờ chưa hợp lệ"
                        : editingShowtime
                          ? "Cập nhật suất chiếu"
                          : "Lưu suất chiếu"}
              </button>
            </div>
          }
        >
          <div className="w-full max-w-[1200px]">
            <div className="grid gap-5 xl:grid-cols-[1.05fr_1.55fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Thông tin suất chiếu
                  </h3>

                  <div className="mt-4 grid gap-4">
                    <Controller
                      control={form.control}
                      name="movieId"
                      render={({ field }) => (
                        <CustomSelect
                          label="Phim"
                          value={String(field.value ?? "")}
                          onChange={(value) =>
                            handleMovieChange(value, field.onChange)
                          }
                          placeholder="Chọn phim"
                          searchable
                          options={[
                            { value: "", label: "Chọn phim", emoji: "🎬" },
                            ...movies.map((movie) => ({
                              value: String(movie.id),
                              label: movie.title,
                              emoji: "🎞️",
                              meta: `${movie.status || "Movie"} · ${
                                movie.durationMinutes || 0
                              } phút`,
                            })),
                          ]}
                          error={form.formState.errors.movieId?.message}
                        />
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="roomId"
                      render={({ field }) => (
                        <CustomSelect
                          label="Phòng"
                          value={String(field.value ?? "")}
                          onChange={(value) =>
                            handleRoomChange(value, field.onChange)
                          }
                          placeholder="Chọn phòng"
                          searchable
                          options={[
                            { value: "", label: "Chọn phòng", emoji: "🏛️" },
                            ...rooms.map((room) => ({
                              value: String(room.id),
                              label: `${room.Cinema?.name || "Rạp"} - ${room.name}`,
                              emoji: "🪑",
                              meta: `${room.rowCount || 0} hàng · ${
                                room.colCount || 0
                              } cột`,
                            })),
                          ]}
                          error={form.formState.errors.roomId?.message}
                        />
                      )}
                    />

                    <div>
                      <label className="label">Ngày chiếu</label>
                      <input
                        className="input"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) =>
                          handleScheduleDateChange(e.target.value)
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">Bắt đầu</label>
                        <input
                          className={`input ${
                            !canEditTimeInputs
                              ? "cursor-not-allowed bg-slate-100"
                              : ""
                          }`}
                          type="datetime-local"
                          disabled={!canEditTimeInputs}
                          {...form.register("startTime")}
                        />
                        {form.formState.errors.startTime && (
                          <p className="mt-1 text-sm text-rose-500">
                            {form.formState.errors.startTime.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="label">Kết thúc</label>
                        <input
                          className={`input ${
                            !canEditTimeInputs
                              ? "cursor-not-allowed bg-slate-100"
                              : ""
                          }`}
                          type="datetime-local"
                          disabled={!canEditTimeInputs}
                          {...form.register("endTime")}
                        />
                        {form.formState.errors.endTime && (
                          <p className="mt-1 text-sm text-rose-500">
                            {form.formState.errors.endTime.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleAutofillEndTime}
                        disabled={!canEditTimeInputs || !watchedStartTime}
                      >
                        Tự tính giờ kết thúc theo thời lượng phim
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={clearSelectedTime}
                        disabled={!watchedStartTime && !watchedEndTime}
                      >
                        Xóa khung giờ đang chọn
                      </button>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                      <p className="font-semibold">Quy tắc tạo suất chiếu</p>
                      <ul className="mt-2 space-y-1">
                        <li>
                          - Thời lượng phim:{" "}
                          <strong>
                            {selectedMovie?.durationMinutes || 0} phút
                          </strong>
                        </li>
                        <li>
                          - Dọn vệ sinh / bàn giao sau phim:{" "}
                          <strong>{CLEANUP_MINUTES} phút</strong>
                        </li>
                        <li>
                          - Khi nhập tay, thời gian phim phải nằm trọn trong một
                          khoảng trống hợp lệ.
                        </li>
                      </ul>
                    </div>

                    {hasTimeValues && hasManualTimeError ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                        <p className="font-semibold">
                          Khung giờ đang nhập chưa hợp lệ
                        </p>
                        <p className="mt-1">{manualTimeValidation.message}</p>
                      </div>
                    ) : null}

                    {hasTimeValues && !hasManualTimeError ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <p className="font-semibold">Khung giờ hợp lệ</p>
                        <p className="mt-1">
                          Chiếu: {formatDateTime(watchedStartTime)} -{" "}
                          {formatDateTime(watchedEndTime)}
                        </p>
                        <p className="mt-1">
                          Phòng bận đến:{" "}
                          {formatTimeOnly(
                            addMinutes(watchedEndTime, CLEANUP_MINUTES),
                          )}
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <label className="label">Giá vé cơ bản</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        {...form.register("basePrice")}
                      />
                      {form.formState.errors.basePrice && (
                        <p className="mt-1 text-sm text-rose-500">
                          {form.formState.errors.basePrice.message}
                        </p>
                      )}
                    </div>

                    <Controller
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <CustomSelect
                          label="Trạng thái"
                          value={field.value}
                          onChange={field.onChange}
                          options={[
                            {
                              value: "ACTIVE",
                              label: "ACTIVE",
                              emoji: "🟢",
                              meta: "Đang hoạt động",
                            },
                            {
                              value: "INACTIVE",
                              label: "INACTIVE",
                              emoji: "⚪",
                              meta: "Tạm dừng",
                            },
                          ]}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Lịch chiếu phòng & khung giờ trống
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {selectedMovie?.title
                          ? `${selectedMovie.title} · ${selectedMovie.durationMinutes} phút`
                          : "Chưa chọn phim"}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedRoom
                          ? `${selectedRoom.Cinema?.name || "Rạp"} - ${selectedRoom.name}`
                          : "Chưa chọn phòng"}
                        {" · "}
                        {scheduleDate || "Chưa chọn ngày"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                      <div className="font-semibold">Bộ quy tắc tính lịch</div>
                      <div>
                        Phim: {selectedMovie?.durationMinutes || 0} phút
                      </div>
                      <div>Buffer sau phim: {CLEANUP_MINUTES} phút</div>
                    </div>
                  </div>

                  {!canGenerateSchedule ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      Vui lòng chọn đủ <strong>phim</strong>,{" "}
                      <strong>phòng</strong> và <strong>ngày chiếu</strong> để
                      hệ thống hiển thị lịch chiếu hiện có và các khoảng trống
                      có thể tạo.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            Lịch chiếu đã có trong phòng
                          </h4>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {availability.roomSchedule.length} suất
                          </span>
                        </div>

                        {availability.roomSchedule.length ? (
                          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                            {availability.roomSchedule.map((item) => (
                              <div
                                key={item.id}
                                className={`rounded-2xl border p-4 ${
                                  editingShowtime?.id === item.id
                                    ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      #{item.id} ·{" "}
                                      {item.Movie?.title || "Không rõ tên phim"}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                      Chiếu: {formatTimeOnly(item.startTime)} -{" "}
                                      {formatTimeOnly(item.endTime)}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      Phòng bận đến:{" "}
                                      {formatTimeOnly(
                                        addMinutes(
                                          item.endTime,
                                          CLEANUP_MINUTES,
                                        ),
                                      )}
                                    </p>
                                    {editingShowtime?.id === item.id ? (
                                      <span className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                        Suất đang sửa
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                            Phòng này chưa có suất chiếu nào trong ngày đã chọn.
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            Khoảng trống và giờ gợi ý
                          </h4>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {availability.slotGroups.length} khoảng phù hợp
                          </span>
                        </div>

                        {!!selectedMovie?.durationMinutes ? (
                          availability.slotGroups.length ? (
                            <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                              {availability.slotGroups.map((group, index) => (
                                <div
                                  key={group.id}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40"
                                >
                                  <div className="mb-3">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                      Khoảng trống #{index + 1}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                      Trống phòng: {formatTimeOnly(group.start)}{" "}
                                      - {formatTimeOnly(group.end)}
                                    </p>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                      Có thể bắt đầu phim từ{" "}
                                      {formatTimeOnly(group.start)} đến{" "}
                                      {formatTimeOnly(group.latestAllowedStart)}
                                    </p>
                                  </div>

                                  <div className="mb-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                    Nếu khoảng trống quá dài, sếp có thể nhập
                                    tay ở ô <strong>Bắt đầu / Kết thúc</strong>{" "}
                                    bên trái, miễn là vẫn nằm trọn trong khoảng
                                    này và đúng thời lượng phim.
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {group.options.map((option) => {
                                      const optionEnd = addMinutes(
                                        option,
                                        Number(
                                          selectedMovie.durationMinutes || 0,
                                        ),
                                      );
                                      const isSelected =
                                        watchedStartTime &&
                                        new Date(watchedStartTime).getTime() ===
                                          option.getTime();

                                      return (
                                        <button
                                          key={option.getTime()}
                                          type="button"
                                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                                            isSelected
                                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                          }`}
                                          onClick={() =>
                                            handlePickStartSlot(option)
                                          }
                                        >
                                          <div className="font-semibold">
                                            {formatTimeOnly(option)} -{" "}
                                            {formatTimeOnly(optionEnd)}
                                          </div>
                                          <div className="text-xs opacity-75">
                                            Bàn giao xong:{" "}
                                            {formatTimeOnly(
                                              addMinutes(
                                                optionEnd,
                                                CLEANUP_MINUTES,
                                              ),
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                              Không còn khoảng trống nào đủ cho phim này trong
                              ngày đã chọn, sau khi tính cả {CLEANUP_MINUTES}{" "}
                              phút dọn vệ sinh / bàn giao.
                            </div>
                          )
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            Chưa có thời lượng phim nên chưa thể tính các khoảng
                            trống hợp lệ.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {hasConflict && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    <div className="flex items-start gap-3">
                      <TriangleAlert size={20} className="mt-0.5 shrink-0" />

                      <div className="flex-1">
                        <p className="font-semibold">
                          {editingShowtime
                            ? "Không thể cập nhật vì khung giờ sửa đang bị trùng trong cùng phòng chiếu"
                            : "Không thể tạo vì khung giờ này đang bị trùng trong cùng phòng chiếu"}
                        </p>

                        <p className="mt-1 text-sm opacity-90">
                          Logic trùng lịch đã tính cả thời gian chiếu phim và{" "}
                          {CLEANUP_MINUTES} phút dọn vệ sinh / bàn giao sau suất
                          chiếu.
                        </p>

                        <div className="mt-3 space-y-2">
                          {conflictingShowtimes.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/60"
                            >
                              <p className="font-medium">
                                #{item.id} ·{" "}
                                {item.Movie?.title || "Không rõ tên phim"}
                              </p>
                              <p className="text-sm">
                                {item.Room?.Cinema?.name || "Chưa có rạp"} ·{" "}
                                {item.Room?.name || "Chưa có phòng"}
                              </p>
                              <p className="text-sm">
                                Chiếu: {formatDateTime(item.startTime)} -{" "}
                                {formatDateTime(item.endTime)}
                              </p>
                              <p className="text-sm">
                                Phòng bận đến:{" "}
                                {formatTimeOnly(
                                  addMinutes(item.endTime, CLEANUP_MINUTES),
                                )}
                              </p>
                              <p className="text-sm">
                                Giá vé: {formatCurrency(item.basePrice || 0)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={detailOpen}
          onClose={handleCloseDetail}
          title="Chi tiết suất chiếu"
          subtitle={
            detailTarget ? `Thông tin suất chiếu #${detailTarget.id}` : ""
          }
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseDetail}
              >
                Đóng
              </button>

              {detailTarget ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const current = detailTarget;
                    handleCloseDetail();
                    handleOpenEdit(current);
                  }}
                >
                  <Pencil size={16} className="mr-2" />
                  Chỉnh sửa
                </button>
              ) : null}
            </div>
          }
        >
          {detailTarget ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Mã suất chiếu</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  #{detailTarget.id}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Trạng thái</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.status || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Giá vé cơ bản</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(detailTarget.basePrice || 0)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60 md:col-span-2 xl:col-span-3">
                <p className="text-sm text-slate-500">Phim</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.Movie?.title || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Movie ID</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.movieId ?? detailTarget.Movie?.id ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Rạp</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.Room?.Cinema?.name || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Phòng</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.Room?.name || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Room ID</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detailTarget.roomId ?? detailTarget.Room?.id ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Bắt đầu</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDateTime(detailTarget.startTime)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                <p className="text-sm text-slate-500">Kết thúc</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDateTime(detailTarget.endTime)}
                </p>
              </div>
            </div>
          ) : null}
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => {
            setDeleteTarget(null);
            setBulkDeleteMode(false);
          }}
          onConfirm={confirmDelete}
          title={bulkDeleteMode ? "Xóa nhiều suất chiếu" : "Xóa suất chiếu"}
          description={
            bulkDeleteMode
              ? `Có ${table.selectedIds.length} suất chiếu sẽ bị xóa.`
              : `Suất chiếu #${deleteTarget?.id || ""} sẽ bị xóa khỏi hệ thống.`
          }
          confirmText={bulkDeleteMode ? "Xóa tất cả đã chọn" : "Xóa suất"}
        />
      </div>
    </PermissionGate>
  );
}
