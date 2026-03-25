export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-rose-500">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
