import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-hero lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="rounded-3xl bg-white/70 p-8 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
            CinemaX
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            Đặt vé điện ảnh hiện đại, nhanh và đẹp.
          </h1>
          <p className="mt-4 text-slate-600">
            Cinemax – Nền tảng đặt vé điện ảnh hiện đại, nhanh chóng và trực
            quan. Dễ dàng chọn phim, suất chiếu và ghế ngồi chỉ trong vài bước,
            với trải nghiệm mượt mà và tối ưu hiệu suất. 🚀
          </p>
        </div>
        <div className="text-sm text-slate-600">
          TailwindCSS · React Query · Axios · Zustand · React Hook Form
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
