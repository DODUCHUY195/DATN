
// import { useEffect, useMemo, useState } from "react";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Controller, useForm } from "react-hook-form";
// import { ImagePlus, Pencil, Plus, Trash2, Video } from "lucide-react";
// import toast from "react-hot-toast";
// import PageHeader from "../../components/common/PageHeader";
// import ErrorState from "../../components/common/ErrorState";
// import { CardSkeleton } from "../../components/common/Skeleton";
// import Modal from "../../components/ui/Modal";
// import ConfirmDialog from "../../components/ui/ConfirmDialog";
// import DataTable from "../../components/table/DataTable";
// import PermissionGate from "../../components/admin/PermissionGate";
// import { useTableState } from "../../hooks/useTableState";
// import { useAdminMovies, useAdminMutations } from "../../hooks/useAdmin";
// import { PERMISSIONS } from "../../constants/permissions";
// import { movieSchema } from "../../utils/schemas";
// import CustomSelect from "../../components/ui/CustomSelect";
// import { BASE_URL_API } from "../../constants/env";

// const defaultValues = {
//   title: "",
//   description: "",
//   trailerUrl: "",
//   posterUrl: "",
//   durationMinutes: 120,
//   releaseDate: "",
//   status: "NOW_SHOWING",
// };

// const resolveMediaUrl = (path) => {
//   if (!path) return "";
//   if (/^https?:\/\//i.test(path)) return path;
//   return `${BASE_URL_API ?? "http://localhost:3000"}${path}`;
// };

// export default function AdminMoviesPage() {
//   const moviesQuery = useAdminMovies();
//   const m = useAdminMutations();
//   const [open, setOpen] = useState(false);
//   const [editingMovie, setEditingMovie] = useState(null);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

//   const [posterPreview, setPosterPreview] = useState("");
//   const [trailerPreview, setTrailerPreview] = useState("");
//   const [posterFile, setPosterFile] = useState(null);
//   const [trailerFile, setTrailerFile] = useState(null);
//   const [trailerLabel, setTrailerLabel] = useState("");

//   const form = useForm({
//     defaultValues,
//     resolver: zodResolver(movieSchema),
//   });

//   const movies = moviesQuery.data || [];
//   const table = useTableState(movies, {
//     pageSize: 6,
//     defaultSort: { key: "title", direction: "asc" },
//     searchFn: (movie, keyword) =>
//       [movie.title, movie.description, movie.status]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(keyword)),
//   });

//   const submitLabel = useMemo(
//     () => (editingMovie ? "Cập nhật phim" : "Tạo phim"),
//     [editingMovie],
//   );

//   useEffect(() => {
//     return () => {
//       if (posterPreview?.startsWith("blob:")) {
//         URL.revokeObjectURL(posterPreview);
//       }
//       if (trailerPreview?.startsWith("blob:")) {
//         URL.revokeObjectURL(trailerPreview);
//       }
//     };
//   }, [posterPreview, trailerPreview]);

//   const resetModalState = () => {
//     if (posterPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(posterPreview);
//     }
//     if (trailerPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(trailerPreview);
//     }

//     setPosterPreview("");
//     setTrailerPreview("");
//     setPosterFile(null);
//     setTrailerFile(null);
//     setTrailerLabel("");
//     setEditingMovie(null);
//     form.reset(defaultValues);
//   };

//   const handleCloseModal = () => {
//     setOpen(false);
//     resetModalState();
//   };

//   const onOpenCreate = () => {
//     resetModalState();
//     setOpen(true);
//   };

//   const onOpenEdit = (movie) => {
//     if (posterPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(posterPreview);
//     }
//     if (trailerPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(trailerPreview);
//     }

//     setEditingMovie(movie);
//     setPosterFile(null);
//     setTrailerFile(null);
//     setPosterPreview(resolveMediaUrl(movie.posterUrl || ""));
//     setTrailerPreview(resolveMediaUrl(movie.trailerUrl || ""));
//     setTrailerLabel(movie.trailerUrl || "");

//     form.reset({
//       ...defaultValues,
//       ...movie,
//       releaseDate: movie.releaseDate?.slice(0, 10) || "",
//       posterUrl: movie.posterUrl || "",
//       trailerUrl: movie.trailerUrl || "",
//     });

//     setOpen(true);
//   };

//   const onPosterFileChange = (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (posterPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(posterPreview);
//     }

//     const url = URL.createObjectURL(file);
//     setPosterFile(file);
//     setPosterPreview(url);

//     form.setValue("posterUrl", file.name, {
//       shouldDirty: true,
//       shouldValidate: false,
//     });
//   };

//   const onTrailerFileChange = (event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (trailerPreview?.startsWith("blob:")) {
//       URL.revokeObjectURL(trailerPreview);
//     }

//     const url = URL.createObjectURL(file);
//     setTrailerFile(file);
//     setTrailerPreview(url);
//     setTrailerLabel(file.name);

//     form.setValue("trailerUrl", file.name, {
//       shouldDirty: true,
//       shouldValidate: false,
//     });
//   };

//   const onSubmit = form.handleSubmit(async (values) => {
//     if (!editingMovie && !posterFile) {
//       toast.error("Vui lòng chọn file poster");
//       return;
//     }

//     if (!editingMovie && !trailerFile) {
//       toast.error("Vui lòng chọn file trailer");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("title", values.title);
//     formData.append("description", values.description || "");
//     formData.append("durationMinutes", String(values.durationMinutes));
//     formData.append("releaseDate", values.releaseDate);
//     formData.append("status", values.status);

//     if (posterFile) {
//       formData.append("poster", posterFile);
//     }

//     if (trailerFile) {
//       formData.append("trailer", trailerFile);
//     }

//     try {
//       if (editingMovie) {
//         await m.updateMovie.mutateAsync({
//           id: editingMovie.id,
//           payload: formData,
//         });
//         toast.success("Cập nhật phim thành công");
//       } else {
//         await m.createMovie.mutateAsync(formData);
//         toast.success("Tạo phim thành công");
//       }

//       setOpen(false);
//       resetModalState();
//     } catch {
//       toast.error("Không thể lưu phim");
//     }
//   });

//   const confirmDelete = async () => {
//     try {
//       if (bulkDeleteMode) {
//         await Promise.all(
//           table.selectedIds.map((id) => m.deleteMovie.mutateAsync(id)),
//         );
//         toast.success(`Đã xóa ${table.selectedIds.length} phim`);
//         table.setSelectedIds([]);
//         setBulkDeleteMode(false);
//       } else if (deleteTarget?.id) {
//         await m.deleteMovie.mutateAsync(deleteTarget.id);
//         toast.success("Đã xóa phim");
//       }
//       setDeleteTarget(null);
//     } catch {
//       toast.error("Không thể xóa phim");
//     }
//   };

//   const columns = [
//     {
//       key: "movie",
//       label: "Phim",
//       sortable: true,
//       render: (movie) => (
//         <div className="flex items-center gap-4">
//           <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-red-950">
//             {movie.posterUrl ? (
//               <img
//                 src={resolveMediaUrl(movie.posterUrl)}
//                 alt={movie.title}
//                 className="h-full w-full object-cover"
//               />
//             ) : null}
//           </div>
//           <div>
//             <p className="font-semibold text-slate-950 dark:text-white">
//               {movie.title}
//             </p>
//             <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
//               {movie.description}
//             </p>
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "status",
//       label: "Trạng thái",
//       sortable: true,
//       render: (movie) => (
//         <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
//           {[
//             { value: "NOW_SHOWING", label: "Đang chiếu" },
//             { value: "COMING_SOON", label: "Sắp ra mắt" },
//           ].find((option) => option.value === movie.status)?.label ||
//             movie.status}
//         </span>
//       ),
//     },
//     {
//       key: "durationMinutes",
//       label: "Thời lượng",
//       sortable: true,
//       render: (movie) => `${movie.durationMinutes} phút`,
//     },
//     {
//       key: "releaseDate",
//       label: "Phát hành",
//       sortable: true,
//       render: (movie) => movie.releaseDate?.slice(0, 10) || "--",
//     },
//     {
//       key: "actions",
//       label: "Thao tác",
//       render: (movie) => (
//         <div className="flex gap-2">
//           <button
//             type="button"
//             className="btn-secondary"
//             onClick={() => onOpenEdit(movie)}
//           >
//             <Pencil size={16} className="mr-2" /> Sửa
//           </button>
//           <button
//             type="button"
//             className="btn-danger"
//             onClick={() => {
//               setBulkDeleteMode(false);
//               setDeleteTarget(movie);
//             }}
//           >
//             <Trash2 size={16} className="mr-2" /> Xóa
//           </button>
//         </div>
//       ),
//     },
//   ];

//   if (moviesQuery.isLoading) {
//     return (
//       <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
//         {Array.from({ length: 6 }).map((_, i) => (
//           <CardSkeleton key={i} />
//         ))}
//       </div>
//     );
//   }

//   if (moviesQuery.isError) {
//     return (
//       <ErrorState
//         message="Không tải được danh sách phim"
//         onRetry={moviesQuery.refetch}
//       />
//     );
//   }

//   return (
//     <PermissionGate permissions={[PERMISSIONS.MOVIES_VIEW]}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Quản lý phim"
//           action={
//             <button
//               type="button"
//               className="btn-primary"
//               onClick={onOpenCreate}
//             >
//               <Plus size={16} className="mr-2" /> Thêm phim
//             </button>
//           }
//         />

//         <DataTable
//           title="Danh sách phim"
//           searchValue={table.search}
//           onSearchChange={table.setSearch}
//           searchPlaceholder="Tìm theo tên phim, mô tả, trạng thái..."
//           columns={columns}
//           rows={table.paginatedRows}
//           page={table.page}
//           totalPages={table.totalPages}
//           onPageChange={table.setPage}
//           emptyText="Không tìm thấy phim phù hợp"
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
//                 { value: "ALL", label: "Tất cả trạng thái", emoji: "🎞️" },
//                 {
//                   value: "NOW_SHOWING",
//                   label: "Đang chiếu",
//                   emoji: "🍿",
//                   meta: "Đang mở bán vé",
//                 },
//                 {
//                   value: "COMING_SOON",
//                   label: "Sắp ra mắt",
//                   emoji: "✨",
//                   meta: "Sắp khởi chiếu",
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
//           onClose={handleCloseModal}
//           width="max-w-5xl"
//           title={editingMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}
//           // subtitle="Preview poster và trailer trực tiếp trong form"
//           footer={
//             <div className="flex justify-end gap-3">
//               <button
//                 type="button"
//                 className="btn-secondary"
//                 onClick={handleCloseModal}
//               >
//                 Đóng
//               </button>
//               <button type="button" className="btn-primary" onClick={onSubmit}>
//                 {submitLabel}
//               </button>
//             </div>
//           }
//         >
//           <form className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
//             <div className="space-y-4">
//               <div className="overflow-hidden rounded-[28px] border border-dashed border-amber-300/70 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-4 text-white dark:border-amber-700/50">
//                 <div className="aspect-[3/4] overflow-hidden rounded-[24px] bg-white/5">
//                   {posterPreview ? (
//                     <img
//                       src={posterPreview}
//                       alt="Poster preview"
//                       className="h-full w-full object-cover"
//                     />
//                   ) : (
//                     <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
//                       <div>
//                         <ImagePlus className="mx-auto mb-3" />
//                         <p>Poster preview</p>
//                         <p className="mt-2 text-xs">Chưa có ảnh poster</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <label className="mt-4 block cursor-pointer rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-medium hover:bg-white/15">
//                   Chọn file poster
//                   <input
//                     type="file"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={onPosterFileChange}
//                   />
//                 </label>

//                 <p className="mt-3 break-all text-xs text-white/70 text-red-600">
//                   {posterFile
//                     ? ``
//                     : editingMovie?.posterUrl
//                       ? ``
//                       : "Chưa có poster"}
//                 </p>
//               </div>

//               <div className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
//                 <div className="mb-4 flex items-center gap-3 text-slate-900 dark:text-white">
//                   <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
//                     <Video size={18} />
//                   </div>
//                   <div>
//                     <p className="font-semibold">Trailer preview</p>
//                     <p className="text-xs text-slate-500 dark:text-slate-400">
//                       Xem thử video trailer ngay trong form
//                     </p>
//                   </div>
//                 </div>

//                 <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
//                   {trailerPreview ? (
//                     <video
//                       key={trailerPreview}
//                       className="h-auto max-h-[280px] w-full bg-black"
//                       controls
//                       playsInline
//                       preload="metadata"
//                       src={trailerPreview}
//                     >
//                       Trình duyệt không hỗ trợ phát video.
//                     </video>
//                   ) : (
//                     <div className="flex h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
//                       Chưa có trailer để preview
//                     </div>
//                   )}
//                 </div>

//                 <label className="mt-4 block cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
//                   Chọn file trailer
//                   <input
//                     type="file"
//                     accept="video/mp4,video/*"
//                     className="hidden"
//                     onChange={onTrailerFileChange}
//                   />
//                 </label>

//                 <p className="mt-3 break-all text-xs dark:text-slate-400 text-red-600">
//                   {trailerFile
//                     ? ``
//                     : trailerLabel
//                       ? ``
//                       : "Chưa có trailer"}
//                 </p>
//               </div>
//             </div>

//             <div>
//               <div className="grid gap-4 md:grid-cols-2">
//                 <div className="md:col-span-2">
//                   <label className="label">Tên phim</label>
//                   <input className="input" {...form.register("title")} />
//                   {form.formState.errors.title && (
//                     <p className="mt-1 text-sm text-rose-500">
//                       {form.formState.errors.title.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="label">Mô tả</label>
//                   <textarea
//                     className="input min-h-32"
//                     {...form.register("description")}
//                   />
//                   {form.formState.errors.description && (
//                     <p className="mt-1 text-sm text-rose-500">
//                       {form.formState.errors.description.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="label">Thời lượng</label>
//                   <input
//                     className="input"
//                     type="number"
//                     {...form.register("durationMinutes")}
//                   />
//                   {form.formState.errors.durationMinutes && (
//                     <p className="mt-1 text-sm text-rose-500">
//                       {form.formState.errors.durationMinutes.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="label">Ngày phát hành</label>
//                   <input
//                     className="input"
//                     type="date"
//                     {...form.register("releaseDate")}
//                   />
//                   {form.formState.errors.releaseDate && (
//                     <p className="mt-1 text-sm text-rose-500">
//                       {form.formState.errors.releaseDate.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="md:col-span-2">
//                   <Controller
//                     control={form.control}
//                     name="status"
//                     render={({ field }) => (
//                       <CustomSelect
//                         label="Trạng thái"
//                         value={field.value}
//                         onChange={field.onChange}
//                         options={[
//                           {
//                             value: "NOW_SHOWING",
//                             label: "Đang chiếu",
//                             emoji: "🍿",
//                             meta: "Đang chiếu",
//                           },
//                           {
//                             value: "COMING_SOON",
//                             label: "Sắp ra mắt",
//                             emoji: "🎬",
//                             meta: "Sắp chiếu",
//                           },
//                         ]}
//                       />
//                     )}
//                   />
//                 </div>
//               </div>
//             </div>
//           </form>
//         </Modal>

//         <ConfirmDialog
//           open={!!deleteTarget}
//           onClose={() => {
//             setDeleteTarget(null);
//             setBulkDeleteMode(false);
//           }}
//           onConfirm={confirmDelete}
//           title={bulkDeleteMode ? "Xóa nhiều phim" : "Xóa phim khỏi hệ thống"}
//           description={
//             bulkDeleteMode
//               ? `Có ${table.selectedIds.length} phim sẽ bị xóa khỏi hệ thống.`
//               : `Phim ${deleteTarget?.title || ""} sẽ bị xóa khỏi danh sách quản trị.`
//           }
//           confirmText={bulkDeleteMode ? "Xóa tất cả đã chọn" : "Xóa phim"}
//         />
//       </div>
//     </PermissionGate>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ImagePlus, Pencil, Plus, Trash2, Video } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { CardSkeleton } from "../../components/common/Skeleton";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DataTable from "../../components/table/DataTable";
import PermissionGate from "../../components/admin/PermissionGate";
import { useTableState } from "../../hooks/useTableState";
import { useAdminMovies, useAdminMutations } from "../../hooks/useAdmin";
import { PERMISSIONS } from "../../constants/permissions";
import { movieSchema } from "../../utils/schemas";
import CustomSelect from "../../components/ui/CustomSelect";
import { BASE_URL_API } from "../../constants/env";

const defaultValues = {
  title: "",
  description: "",
  trailerUrl: "",
  posterUrl: "",
  durationMinutes: 120,
  releaseDate: "",
  status: "NOW_SHOWING",
  posterFile: undefined,
  trailerFile: undefined,
};

const resolveMediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL_API ?? "http://localhost:3000"}${path}`;
};

export default function AdminMoviesPage() {
  const moviesQuery = useAdminMovies();
  const m = useAdminMutations();

  const [open, setOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  const [posterPreview, setPosterPreview] = useState("");
  const [trailerPreview, setTrailerPreview] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [trailerFile, setTrailerFile] = useState(null);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(movieSchema),
  });

  const movies = moviesQuery.data || [];
  const table = useTableState(movies, {
    pageSize: 6,
    defaultSort: { key: "title", direction: "asc" },
    searchFn: (movie, keyword) =>
      [movie.title, movie.description, movie.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword.toLowerCase())),
  });

  const submitLabel = useMemo(
    () => (editingMovie ? "Cập nhật phim" : "Tạo phim"),
    [editingMovie],
  );

  const revokePreview = (url) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      revokePreview(posterPreview);
      revokePreview(trailerPreview);
    };
  }, [posterPreview, trailerPreview]);

  const resetModalState = () => {
    revokePreview(posterPreview);
    revokePreview(trailerPreview);

    setPosterPreview("");
    setTrailerPreview("");
    setPosterFile(null);
    setTrailerFile(null);
    setEditingMovie(null);
    form.reset(defaultValues);
  };

  const handleCloseModal = () => {
    setOpen(false);
    resetModalState();
  };

  const onOpenCreate = () => {
    resetModalState();
    setOpen(true);
  };

  const onOpenEdit = (movie) => {
    revokePreview(posterPreview);
    revokePreview(trailerPreview);

    setEditingMovie(movie);
    setPosterFile(null);
    setTrailerFile(null);
    setPosterPreview(resolveMediaUrl(movie.posterUrl || ""));
    setTrailerPreview(resolveMediaUrl(movie.trailerUrl || ""));

    form.reset({
      ...defaultValues,
      ...movie,
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      releaseDate: movie.releaseDate?.slice(0, 10) || "",
      posterFile: undefined,
      trailerFile: undefined,
    });

    setOpen(true);
  };

  const onPosterFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    revokePreview(posterPreview);

    const previewUrl = URL.createObjectURL(file);
    setPosterFile(file);
    setPosterPreview(previewUrl);
    form.setValue("posterFile", file, { shouldDirty: true, shouldValidate: false });
  };

  const onTrailerFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    revokePreview(trailerPreview);

    const previewUrl = URL.createObjectURL(file);
    setTrailerFile(file);
    setTrailerPreview(previewUrl);
    form.setValue("trailerFile", file, { shouldDirty: true, shouldValidate: false });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!editingMovie && !posterFile) {
      toast.error("Vui lòng chọn file poster");
      return;
    }

    if (!editingMovie && !trailerFile) {
      toast.error("Vui lòng chọn file trailer");
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description || "");
    formData.append("durationMinutes", String(values.durationMinutes));
    formData.append("releaseDate", values.releaseDate);
    formData.append("status", values.status);

    if (posterFile) {
      formData.append("poster", posterFile);
    }

    if (trailerFile) {
      formData.append("trailer", trailerFile);
    }

    try {
      if (editingMovie) {
        await m.updateMovie.mutateAsync({
          id: editingMovie.id,
          payload: formData,
        });
        toast.success("Cập nhật phim thành công");
      } else {
        await m.createMovie.mutateAsync(formData);
        toast.success("Tạo phim thành công");
      }

      setOpen(false);
      resetModalState();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể lưu phim";
      toast.error(message);
    }
  });

  const confirmDelete = async () => {
    try {
      if (bulkDeleteMode) {
        await Promise.all(
          table.selectedIds.map((id) => m.deleteMovie.mutateAsync(id)),
        );
        toast.success(`Đã xóa ${table.selectedIds.length} phim`);
        table.setSelectedIds([]);
        setBulkDeleteMode(false);
      } else if (deleteTarget?.id) {
        await m.deleteMovie.mutateAsync(deleteTarget.id);
        toast.success("Đã xóa phim");
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa phim");
    }
  };

  const columns = [
    {
      key: "movie",
      label: "Phim",
      sortable: true,
      render: (movie) => (
        <div className="flex items-center gap-4">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-red-950">
            {movie.posterUrl ? (
              <img
                src={resolveMediaUrl(movie.posterUrl)}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-slate-950 dark:text-white">
              {movie.title}
            </p>
            <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {movie.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (movie) => (
        <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          {[
            { value: "NOW_SHOWING", label: "Đang chiếu" },
            { value: "COMING_SOON", label: "Sắp ra mắt" },
          ].find((option) => option.value === movie.status)?.label || movie.status}
        </span>
      ),
    },
    {
      key: "durationMinutes",
      label: "Thời lượng",
      sortable: true,
      render: (movie) => `${movie.durationMinutes} phút`,
    },
    {
      key: "releaseDate",
      label: "Phát hành",
      sortable: true,
      render: (movie) => movie.releaseDate?.slice(0, 10) || "--",
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (movie) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onOpenEdit(movie)}
          >
            <Pencil size={16} className="mr-2" /> Sửa
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              setBulkDeleteMode(false);
              setDeleteTarget(movie);
            }}
          >
            <Trash2 size={16} className="mr-2" /> Xóa
          </button>
        </div>
      ),
    },
  ];

  if (moviesQuery.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (moviesQuery.isError) {
    return (
      <ErrorState
        message="Không tải được danh sách phim"
        onRetry={moviesQuery.refetch}
      />
    );
  }

  return (
    <PermissionGate permissions={[PERMISSIONS.MOVIES_VIEW]}>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý phim"
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenCreate}
            >
              <Plus size={16} className="mr-2" /> Thêm phim
            </button>
          }
        />

        <DataTable
          title="Danh sách phim"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Tìm theo tên phim, mô tả, trạng thái..."
          columns={columns}
          rows={table.paginatedRows}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          emptyText="Không tìm thấy phim phù hợp"
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
                { value: "ALL", label: "Tất cả trạng thái", emoji: "🎞️" },
                {
                  value: "NOW_SHOWING",
                  label: "Đang chiếu",
                  emoji: "🍿",
                  meta: "Đang mở bán vé",
                },
                {
                  value: "COMING_SOON",
                  label: "Sắp ra mắt",
                  emoji: "✨",
                  meta: "Sắp khởi chiếu",
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
          onClose={handleCloseModal}
          width="max-w-5xl"
          title={editingMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseModal}
              >
                Đóng
              </button>
              <button type="button" className="btn-primary" onClick={onSubmit}>
                {submitLabel}
              </button>
            </div>
          }
        >
          <form className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-dashed border-amber-300/70 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-4 text-white dark:border-amber-700/50">
                <div className="aspect-[3/4] overflow-hidden rounded-[24px] bg-white/5">
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                      <div>
                        <ImagePlus className="mx-auto mb-3" />
                        <p>Poster preview</p>
                        <p className="mt-2 text-xs">Chưa có ảnh poster</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="mt-4 block cursor-pointer rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-medium hover:bg-white/15">
                  Chọn file poster
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPosterFileChange}
                  />
                </label>

                <p className="mt-3 break-all text-xs text-white/70">
                  {posterFile
                    ? `Đã chọn: ${posterFile.name}`
                    : editingMovie?.posterUrl
                      ? `Poster hiện tại: ${editingMovie.posterUrl}`
                      : "Chưa có poster"}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center gap-3 text-slate-900 dark:text-white">
                  <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
                    <Video size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">Trailer preview</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Xem thử video trailer ngay trong form
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                  {trailerPreview ? (
                    <video
                      key={trailerPreview}
                      className="h-auto max-h-[280px] w-full bg-black"
                      controls
                      playsInline
                      preload="metadata"
                      src={trailerPreview}
                    >
                      Trình duyệt không hỗ trợ phát video.
                    </video>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      Chưa có trailer để preview
                    </div>
                  )}
                </div>

                <label className="mt-4 block cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                  Chọn file trailer
                  <input
                    type="file"
                    accept="video/mp4,video/*"
                    className="hidden"
                    onChange={onTrailerFileChange}
                  />
                </label>

                <p className="mt-3 break-all text-xs text-slate-500 dark:text-slate-400">
                  {trailerFile
                    ? `Đã chọn: ${trailerFile.name}`
                    : editingMovie?.trailerUrl
                      ? `Trailer hiện tại: ${editingMovie.trailerUrl}`
                      : "Chưa có trailer"}
                </p>
              </div>
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="label">Tên phim</label>
                  <input className="input" {...form.register("title")} />
                  {form.formState.errors.title && (
                    <p className="mt-1 text-sm text-rose-500">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Mô tả</label>
                  <textarea
                    className="input min-h-32"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="mt-1 text-sm text-rose-500">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Thời lượng</label>
                  <input
                    className="input"
                    type="number"
                    {...form.register("durationMinutes")}
                  />
                  {form.formState.errors.durationMinutes && (
                    <p className="mt-1 text-sm text-rose-500">
                      {form.formState.errors.durationMinutes.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Ngày phát hành</label>
                  <input
                    className="input"
                    type="date"
                    {...form.register("releaseDate")}
                  />
                  {form.formState.errors.releaseDate && (
                    <p className="mt-1 text-sm text-rose-500">
                      {form.formState.errors.releaseDate.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
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
                            value: "NOW_SHOWING",
                            label: "Đang chiếu",
                            emoji: "🍿",
                            meta: "Đang chiếu",
                          },
                          {
                            value: "COMING_SOON",
                            label: "Sắp ra mắt",
                            emoji: "🎬",
                            meta: "Sắp chiếu",
                          },
                        ]}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => {
            setDeleteTarget(null);
            setBulkDeleteMode(false);
          }}
          onConfirm={confirmDelete}
          title={bulkDeleteMode ? "Xóa nhiều phim" : "Xóa phim khỏi hệ thống"}
          description={
            bulkDeleteMode
              ? `Có ${table.selectedIds.length} phim sẽ bị xóa khỏi hệ thống.`
              : `Phim ${deleteTarget?.title || ""} sẽ bị xóa khỏi danh sách quản trị.`
          }
          confirmText={bulkDeleteMode ? "Xóa tất cả đã chọn" : "Xóa phim"}
        />
      </div>
    </PermissionGate>
  );
}