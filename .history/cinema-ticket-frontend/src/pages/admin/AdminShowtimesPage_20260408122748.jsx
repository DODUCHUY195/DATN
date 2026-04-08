// import { useState } from "react";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Controller, useForm } from "react-hook-form";
// import { CalendarPlus2, Trash2 } from "lucide-react";
// import toast from "react-hot-toast";
// import PageHeader from "../../components/common/PageHeader";
// import ErrorState from "../../components/common/ErrorState";
// import { CardSkeleton } from "../../components/common/Skeleton";
// import Modal from "../../components/ui/Modal";
// import ConfirmDialog from "../../components/ui/ConfirmDialog";
// import DataTable from "../../components/table/DataTable";
// import PermissionGate from "../../components/admin/PermissionGate";
// import { useTableState } from "../../hooks/useTableState";
// import {
//   useAdminMovies,
//   useAdminMutations,
//   useAdminRooms,
//   useAdminShowtimes,
// } from "../../hooks/useAdmin";
// import { formatCurrency, formatDateTime } from "../../utils/format";
// import { PERMISSIONS } from "../../constants/permissions";
// import { showtimeSchema } from "../../utils/schemas";
// import CustomSelect from "../../components/ui/CustomSelect";

// const defaultValues = {
//   movieId: "",
//   roomId: "",
//   startTime: "",
//   endTime: "",
//   basePrice: 90000,
//   status: "ACTIVE",
// };

// export default function AdminShowtimesPage() {
//   const showtimesQuery = useAdminShowtimes();
//   const moviesQuery = useAdminMovies();
//   const roomsQuery = useAdminRooms();
//   const m = useAdminMutations();
//   const [open, setOpen] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
//   const form = useForm({
//     defaultValues,
//     resolver: zodResolver(showtimeSchema),
//   });

//   const showtimes = showtimesQuery.data || [];
//   const table = useTableState(showtimes, {
//     pageSize: 8,
//     defaultSort: { key: "startTime", direction: "desc" },
//     searchFn: (showtime, keyword) =>
//       [
//         showtime.Movie?.title,
//         showtime.Room?.name,
//         showtime.Room?.Cinema?.name,
//         showtime.status,
//       ]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(keyword)),
//   });

//   const onSubmit = form.handleSubmit(async (values) => {
//     try {
//       await m.createShowtime.mutateAsync(values);
//       toast.success("Tạo suất chiếu thành công");
//       form.reset(defaultValues);
//       setOpen(false);
//     } catch {
//       toast.error("Không thể tạo suất chiếu");
//     }
//   });

//   const confirmDelete = async () => {
//     try {
//       if (bulkDeleteMode) {
//         await Promise.all(
//           table.selectedIds.map((id) => m.deleteShowtime.mutateAsync(id)),
//         );
//         toast.success(`Đã xóa ${table.selectedIds.length} suất chiếu`);
//         table.setSelectedIds([]);
//         setBulkDeleteMode(false);
//       } else if (deleteTarget?.id) {
//         await m.deleteShowtime.mutateAsync(deleteTarget.id);
//         toast.success("Đã xóa suất chiếu");
//       }
//       setDeleteTarget(null);
//     } catch {
//       toast.error("Không thể xóa suất chiếu");
//     }
//   };

//   const columns = [
//     {
//       key: "movie",
//       label: "Phim",
//       sortable: true,
//       render: (showtime) => (
//         <div>
//           <p className="font-semibold text-slate-950 dark:text-white">
//             {showtime.Movie?.title}
//           </p>
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             {showtime.Room?.Cinema?.name} · {showtime.Room?.name}
//           </p>
//         </div>
//       ),
//     },
//     {
//       key: "startTime",
//       label: "Thời gian",
//       sortable: true,
//       render: (showtime) => (
//         <div>
//           <p>{formatDateTime(showtime.startTime)}</p>
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             Kết thúc: {formatDateTime(showtime.endTime)}
//           </p>
//         </div>
//       ),
//     },
//     {
//       key: "basePrice",
//       label: "Giá vé",
//       sortable: true,
//       render: (showtime) => formatCurrency(showtime.basePrice || 0),
//     },
//     {
//       key: "status",
//       label: "Trạng thái",
//       sortable: true,
//       render: (showtime) => (
//         <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
//           {showtime.status}
//         </span>
//       ),
//     },
//     {
//       key: "actions",
//       label: "Thao tác",
//       render: (showtime) => (
//         <button
//           className="btn-danger"
//           onClick={() => {
//             setBulkDeleteMode(false);
//             setDeleteTarget(showtime);
//           }}
//         >
//           <Trash2 size={16} className="mr-2" />
//           Xóa
//         </button>
//       ),
//     },
//   ];

//   if (showtimesQuery.isLoading || moviesQuery.isLoading || roomsQuery.isLoading)
//     return (
//       <div className="grid gap-4 md:grid-cols-2">
//         {Array.from({ length: 6 }).map((_, i) => (
//           <CardSkeleton key={i} className="h-36" />
//         ))}
//       </div>
//     );
//   if (showtimesQuery.isError)
//     return (
//       <ErrorState
//         message="Không tải được suất chiếu"
//         onRetry={showtimesQuery.refetch}
//       />
//     );

//   return (
//     <PermissionGate permissions={[PERMISSIONS.SHOWTIMES_VIEW]}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Quản lý suất chiếu"
//           // description="Tạo và kiểm soát lịch chiếu, tránh trùng phòng, có validate thời gian và bulk delete."
//           action={
//             <button className="btn-primary" onClick={() => setOpen(true)}>
//               <CalendarPlus2 size={16} className="mr-2" />
//               Tạo suất chiếu
//             </button>
//           }
//         />
//         <DataTable
//           title="Danh sách suất chiếu"
//           // description="Tìm theo phim, phòng, rạp và trạng thái. Có sắp xếp và filter cho môi trường enterprise."
//           searchValue={table.search}
//           onSearchChange={table.setSearch}
//           searchPlaceholder="Tìm phim, phòng, rạp, trạng thái..."
//           columns={columns}
//           rows={table.paginatedRows}
//           page={table.page}
//           totalPages={table.totalPages}
//           onPageChange={table.setPage}
//           emptyText="Không tìm thấy suất chiếu"
//           selectedIds={table.selectedIds}
//           onToggleRow={table.toggleRow}
//           onTogglePageSelection={table.togglePageSelection}
//           allCurrentPageSelected={table.allCurrentPageSelected}
//           sort={table.sort}
//           onToggleSort={(key) =>
//             table.setSort((current) => ({
//               key,
//               direction:
//                 current?.key === key && current.direction === "asc"
//                   ? "desc"
//                   : "asc",
//             }))
//           }
//           filters={[
//             {
//               key: "status",
//               value: table.status,
//               onChange: table.setStatus,
//               options: [
//                 { value: "ALL", label: "Tất cả trạng thái", emoji: "🎛️" },
//                 {
//                   value: "ACTIVE",
//                   label: "ACTIVE",
//                   emoji: "🟢",
//                   meta: "Đang mở bán",
//                 },
//                 {
//                   value: "INACTIVE",
//                   label: "INACTIVE",
//                   emoji: "⚪",
//                   meta: "Tạm ẩn",
//                 },
//               ],
//             },
//           ]}
//           bulkActions={[
//             {
//               key: "delete",
//               label: "Xóa đã chọn",
//               tone: "danger",
//               onClick: () => {
//                 setBulkDeleteMode(true);
//                 setDeleteTarget({});
//               },
//             },
//           ]}
//         />
//         <Modal
//           open={open}
//           onClose={() => setOpen(false)}
//           title="Tạo suất chiếu"
//           subtitle="Ràng buộc phim, phòng và thời gian chiếu"
//           footer={
//             <div className="flex justify-end gap-3">
//               <button className="btn-secondary" onClick={() => setOpen(false)}>
//                 Đóng
//               </button>
//               <button className="btn-primary" onClick={onSubmit}>
//                 Lưu suất chiếu
//               </button>
//             </div>
//           }
//         >
//           <div className="grid gap-4 md:grid-cols-2">
//             <div className="md:col-span-2">
//               <Controller
//                 control={form.control}
//                 name="movieId"
//                 render={({ field }) => (
//                   <CustomSelect
//                     label="Phim"
//                     value={field.value}
//                     onChange={field.onChange}
//                     placeholder="Chọn phim"
//                     searchable
//                     options={[
//                       { value: "", label: "Chọn phim", emoji: "🎬" },
//                       ...(moviesQuery.data || []).map((movie) => ({
//                         value: String(movie.id),
//                         label: movie.title,
//                         emoji: "🎞️",
//                         meta: movie.status || "Movie",
//                       })),
//                     ]}
//                     error={form.formState.errors.movieId?.message}
//                   />
//                 )}
//               />
//             </div>
//             <div className="md:col-span-2">
//               <Controller
//                 control={form.control}
//                 name="roomId"
//                 render={({ field }) => (
//                   <CustomSelect
//                     label="Phòng"
//                     value={field.value}
//                     onChange={field.onChange}
//                     placeholder="Chọn phòng"
//                     searchable
//                     options={[
//                       { value: "", label: "Chọn phòng", emoji: "🏛️" },
//                       ...(roomsQuery.data || []).map((room) => ({
//                         value: String(room.id),
//                         label: `${room.Cinema?.name} - ${room.name}`,
//                         emoji: "🪑",
//                         meta: `${room.type || "STANDARD"} · ${room.totalSeats || 0} ghế`,
//                       })),
//                     ]}
//                     error={form.formState.errors.roomId?.message}
//                   />
//                 )}
//               />
//             </div>
//             <div>
//               <label className="label">Bắt đầu</label>
//               <input
//                 className="input"
//                 type="datetime-local"
//                 {...form.register("startTime")}
//               />
//               {form.formState.errors.startTime && (
//                 <p className="mt-1 text-sm text-rose-500">
//                   {form.formState.errors.startTime.message}
//                 </p>
//               )}
//             </div>
//             <div>
//               <label className="label">Kết thúc</label>
//               <input
//                 className="input"
//                 type="datetime-local"
//                 {...form.register("endTime")}
//               />
//               {form.formState.errors.endTime && (
//                 <p className="mt-1 text-sm text-rose-500">
//                   {form.formState.errors.endTime.message}
//                 </p>
//               )}
//             </div>
//             <div>
//               <label className="label">Giá vé cơ bản</label>
//               <input
//                 className="input"
//                 type="number"
//                 {...form.register("basePrice")}
//               />
//               {form.formState.errors.basePrice && (
//                 <p className="mt-1 text-sm text-rose-500">
//                   {form.formState.errors.basePrice.message}
//                 </p>
//               )}
//             </div>
//             <div>
//               <Controller
//                 control={form.control}
//                 name="status"
//                 render={({ field }) => (
//                   <CustomSelect
//                     label="Trạng thái"
//                     value={field.value}
//                     onChange={field.onChange}
//                     options={[
//                       {
//                         value: "ACTIVE",
//                         label: "ACTIVE",
//                         emoji: "🟢",
//                         meta: "Đang hoạt động",
//                       },
//                       {
//                         value: "INACTIVE",
//                         label: "INACTIVE",
//                         emoji: "⚪",
//                         meta: "Tạm dừng",
//                       },
//                     ]}
//                   />
//                 )}
//               />
//             </div>
//           </div>
//         </Modal>
//         <ConfirmDialog
//           open={!!deleteTarget}
//           onClose={() => {
//             setDeleteTarget(null);
//             setBulkDeleteMode(false);
//           }}
//           onConfirm={confirmDelete}
//           title={bulkDeleteMode ? "Xóa nhiều suất chiếu" : "Xóa suất chiếu"}
//           description={
//             bulkDeleteMode
//               ? `Có ${table.selectedIds.length} suất chiếu sẽ bị xóa.`
//               : `Suất chiếu #${deleteTarget?.id || ""} sẽ bị xóa khỏi hệ thống.`
//           }
//           confirmText={bulkDeleteMode ? "Xóa tất cả đã chọn" : "Xóa suất"}
//         />
//       </div>
//     </PermissionGate>
//   );
// }


import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarPlus2, Eye, Pencil, Trash2 } from "lucide-react";
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

function toIsoString(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
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

  const form = useForm({
    defaultValues,
    resolver: zodResolver(showtimeSchema),
  });

  const showtimes = showtimesQuery.data || [];

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

  const isSubmitting =
    m.createShowtime.isPending || m.updateShowtime.isPending;

  const handleCloseFormModal = () => {
    setOpen(false);
    setEditingShowtime(null);
    form.reset(defaultValues);
  };

  const handleOpenCreate = () => {
    setEditingShowtime(null);
    form.reset(defaultValues);
    setOpen(true);
  };

  const handleOpenEdit = (showtime) => {
    setEditingShowtime(showtime);
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

  const onSubmit = form.handleSubmit(async (values) => {
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
      toast.error(
        error?.response?.data?.message || "Không thể xóa suất chiếu",
      );
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
            className="btn-secondary !p-2 !rounded-md"
            onClick={() => handleOpenDetail(showtime)}
          >
            <Eye size={16} />
            {/* Chi tiết */}
          </button>

          <button
            type="button"
            className="btn-primary !p-2 !rounded-md"
            onClick={() => handleOpenEdit(showtime)}
          >
            <Pencil size={16} />
            {/* Sửa */}
          </button>

          <button
            type="button"
            className="btn-danger !p-2 !rounded-md"
            onClick={() => {
              setBulkDeleteMode(false);
              setDeleteTarget(showtime);
            }}
          >
            <Trash2 size={16} />
            {/* Xóa */}
          </button>
        </div>
      ),
    },
  ];

  if (showtimesQuery.isLoading || moviesQuery.isLoading || roomsQuery.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-36" />
        ))}
      </div>
    );

  if (showtimesQuery.isError)
    return (
      <ErrorState
        message="Không tải được suất chiếu"
        onRetry={showtimesQuery.refetch}
      />
    );

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
              : "Ràng buộc phim, phòng và thời gian chiếu"
          }
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
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Đang lưu..."
                  : editingShowtime
                    ? "Cập nhật suất chiếu"
                    : "Lưu suất chiếu"}
              </button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Controller
                control={form.control}
                name="movieId"
                render={({ field }) => (
                  <CustomSelect
                    label="Phim"
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    placeholder="Chọn phim"
                    searchable
                    options={[
                      { value: "", label: "Chọn phim", emoji: "🎬" },
                      ...(moviesQuery.data || []).map((movie) => ({
                        value: String(movie.id),
                        label: movie.title,
                        emoji: "🎞️",
                        meta: movie.status || "Movie",
                      })),
                    ]}
                    error={form.formState.errors.movieId?.message}
                  />
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Controller
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <CustomSelect
                    label="Phòng"
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    placeholder="Chọn phòng"
                    searchable
                    options={[
                      { value: "", label: "Chọn phòng", emoji: "🏛️" },
                      ...(roomsQuery.data || []).map((room) => ({
                        value: String(room.id),
                        label: `${room.Cinema?.name || "Rạp"} - ${room.name}`,
                        emoji: "🪑",
                        meta: `${room.type || "STANDARD"} · ${
                          room.totalSeats || 0
                        } ghế`,
                      })),
                    ]}
                    error={form.formState.errors.roomId?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="label">Bắt đầu</label>
              <input
                className="input"
                type="datetime-local"
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
                className="input"
                type="datetime-local"
                {...form.register("endTime")}
              />
              {form.formState.errors.endTime && (
                <p className="mt-1 text-sm text-rose-500">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>

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

            <div>
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