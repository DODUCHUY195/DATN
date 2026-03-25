import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../hooks/useApiError';
import { registerSchema } from '../../utils/schemas';

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) });
  const registerMutation = useRegister();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    await registerMutation.mutateAsync(values);
    navigate('/login');
  };

  return (
    <div className="card p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-slate-500">Đăng ký nhanh để đặt vé, giữ ghế và xem lịch sử giao dịch.</p>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="label">Họ tên</label>
          <input className="input" {...register('fullName')} />
          {errors.fullName && <p className="mt-1 text-sm text-rose-500">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Số điện thoại</label>
          <input className="input" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-sm text-rose-500">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label">Mật khẩu</label>
          <input type="password" className="input" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password.message}</p>}
        </div>
        {registerMutation.isError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">{getApiErrorMessage(registerMutation.error)}</p>}
        <button disabled={registerMutation.isPending} className="btn-primary w-full">{registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}</button>
      </form>
      <p className="mt-4 text-sm text-slate-500">Đã có tài khoản? <Link className="font-semibold text-brand-600" to="/login">Đăng nhập</Link></p>
    </div>
  );
}
