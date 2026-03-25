import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Xác nhận thao tác', description = 'Bạn có chắc muốn tiếp tục?', confirmText = 'Xác nhận', cancelText = 'Hủy', tone = 'danger' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title={title}
      subtitle={description}
      footer={
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>{cancelText}</button>
          <button className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText}</button>
        </div>
      }
    >
      <div className="rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white p-5 text-sm text-slate-600 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-slate-950 dark:text-slate-300">
        Hành động này sẽ cập nhật dữ liệu hệ thống. Hãy kiểm tra lại trước khi tiếp tục.
      </div>
    </Modal>
  );
}
