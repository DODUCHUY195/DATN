import { useEffect } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useCurrentUser } from "../../hooks/useAuth";
import { usersApi } from "../../api/endpoints";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../hooks/useApiError";

export default function ProfilePage() {
  const { data, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const mutation = useMutation({
    mutationFn: async (payload) => (await usersApi.updateMe(payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Thông tin cá nhân"
        // description="Cập nhật hồ sơ hiện tại bằng react-hook-form và mutation tối ưu."
      />
      <form
        className="card max-w-3xl space-y-5 p-6"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="label">Họ tên</label>
            <input className="input" {...register("fullName")} />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              disabled
              className="input bg-slate-100"
              {...register("email")}
            />
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <input className="input" {...register("phone")} />
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input className="input" {...register("avatarUrl")} />
          </div>
        </div>
        {mutation.isError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            Cập nhật profile thành công.
          </p>
        )}
        <button className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}
