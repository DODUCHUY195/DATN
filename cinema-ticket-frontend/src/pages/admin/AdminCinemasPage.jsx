import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Plus, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import ErrorState from '../../components/common/ErrorState';
import { CardSkeleton } from '../../components/common/Skeleton';
import Modal from '../../components/ui/Modal';
import { useAdminCinemas, useAdminMutations, useAdminRooms } from '../../hooks/useAdmin';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AdminCinemasPage() {
  const cinemasQuery = useAdminCinemas();
  const roomsQuery = useAdminRooms();
  const m = useAdminMutations();
  const [openCinema, setOpenCinema] = useState(false);
  const [openRoom, setOpenRoom] = useState(false);
  const cinemaForm = useForm({ defaultValues: { name: '', address: '' } });
  const roomForm = useForm({ defaultValues: { cinemaId: '', name: '', rowCount: 8, colCount: 12 } });

  const createCinema = cinemaForm.handleSubmit(async (values) => {
    try {
      await m.createCinema.mutateAsync(values);
      toast.success('Đã tạo rạp mới');
      setOpenCinema(false);
      cinemaForm.reset();
    } catch {
      toast.error('Không thể tạo rạp');
    }
  });

  const createRoom = roomForm.handleSubmit(async (values) => {
    try {
      await m.createRoom.mutateAsync({ ...values, cinemaId: Number(values.cinemaId), rowCount: Number(values.rowCount), colCount: Number(values.colCount) });
      toast.success('Đã tạo phòng chiếu');
      setOpenRoom(false);
      roomForm.reset({ cinemaId: '', name: '', rowCount: 8, colCount: 12 });
    } catch {
      toast.error('Không thể tạo phòng');
    }
  });

  if (cinemasQuery.isLoading || roomsQuery.isLoading) return <div className="grid gap-6 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-64" />)}</div>;
  if (cinemasQuery.isError || roomsQuery.isError) return <ErrorState message="Không tải được dữ liệu rạp/phòng" onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rạp & phòng chiếu"
        // description="Cấu hình hệ thống multi-cinema, room layout và năng lực phục vụ."
        action={<div className="flex gap-3"><button className="btn-secondary" onClick={() => setOpenRoom(true)}><Settings2 size={16} className="mr-2" /> Thêm phòng</button><button className="btn-primary" onClick={() => setOpenCinema(true)}><Plus size={16} className="mr-2" /> Thêm rạp</button></div>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {cinemasQuery.data?.map((cinema) => (
          <div key={cinema.id} className="card-premium p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{cinema.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cinema.address}</p>
              </div>
              <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">{cinema.Rooms?.length || 0} phòng</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(cinema.Rooms || []).map((room) => (
                <div key={room.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="font-semibold text-slate-950 dark:text-white">{room.name}</p>
                  <p className=''>Số hàng: {room.rowCount} x Số ghế mỗi hàng: {room.colCount}</p>
                  {/* <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sức chứa seat layout cấu hình từ admin</p> */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={openCinema} onClose={() => setOpenCinema(false)} title="Thêm rạp mới" footer={<div className="flex justify-end gap-3"><button className="btn-secondary" onClick={() => setOpenCinema(false)}>Đóng</button><button className="btn-primary" onClick={createCinema}>Lưu rạp</button></div>}>
        <div className="space-y-4"><div><label className="label">Tên rạp</label><input className="input" {...cinemaForm.register('name')} /></div><div><label className="label">Địa chỉ</label><input className="input" {...cinemaForm.register('address')} /></div></div>
      </Modal>
      <Modal open={openRoom} onClose={() => setOpenRoom(false)} title="Thêm phòng chiếu" footer={<div className="flex justify-end gap-3"><button className="btn-secondary" onClick={() => setOpenRoom(false)}>Đóng</button><button className="btn-primary" onClick={createRoom}>Lưu phòng</button></div>}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Controller
              control={roomForm.control}
              name="cinemaId"
              render={({ field }) => (
                <CustomSelect
                  label="Rạp"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn rạp"
                  searchable
                  options={[{ value: '', label: 'Chọn rạp', emoji: '🏢' }, ...(cinemasQuery.data || []).map((cinema) => ({ value: String(cinema.id), label: cinema.name, emoji: '🎦', meta: cinema.address || 'Cinema' }))]}
                />
              )}
            />
          </div>
          <div className="md:col-span-2"><label className="label">Tên phòng</label><input className="input" {...roomForm.register('name')} /></div>
          <div><label className="label">Số hàng</label><input className="input" type="number" {...roomForm.register('rowCount')} /></div>
          <div><label className="label">Số cột</label><input className="input" type="number" {...roomForm.register('colCount')} /></div>
        </div>
      </Modal>
    </div>
  );
}
