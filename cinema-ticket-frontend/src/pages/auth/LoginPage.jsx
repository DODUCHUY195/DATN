import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../hooks/useApiError';
import { loginSchema } from '../../utils/schemas';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (values) => {
    await loginMutation.mutateAsync(values);
    navigate(location.state?.from?.pathname || '/');
  };

  return (
    <div className="card p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Đăng nhập</h1>
      <p className="mt-2 text-sm text-slate-500">Truy cập hệ thống đặt vé và khu vực quản trị.</p>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="label">Email</label>
          <input className="input" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Mật khẩu</label>
          <input type="password" className="input" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password.message}</p>}
        </div>
        {loginMutation.isError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">{getApiErrorMessage(loginMutation.error)}</p>}
        <button disabled={loginMutation.isPending} className="btn-primary w-full">{loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p className="mt-4 text-sm text-slate-500">Chưa có tài khoản? <Link className="font-semibold text-brand-600" to="/register">Đăng ký ngay</Link></p>
    </div>
  );
}
