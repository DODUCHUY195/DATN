import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

function SortButton({ column, sort, onToggleSort }) {
  if (!column.sortable) return <span>{column.label}</span>;
  const active = sort?.key === column.key;
  return (
    <button type="button" className={`inline-flex items-center gap-2 ${active ? 'text-slate-900 dark:text-white' : ''}`} onClick={() => onToggleSort?.(column.key)}>
      <span>{column.label}</span>
      {active ? (sort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUp size={14} className="opacity-30" />}
    </button>
  );
}

export default function DataTable({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  columns = [],
  rows = [],
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyText = 'Không có dữ liệu',
  filters = [],
  bulkActions = [],
  selectedIds = [],
  onToggleRow,
  onTogglePageSelection,
  allCurrentPageSelected = false,
  sort,
  onToggleSort,
}) {
  const hasSelection = selectedIds.length > 0;
  return (
    <section className="card-premium overflow-hidden">
      <div className="border-b border-slate-200/70 p-5 dark:border-slate-800/80 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className='shrink-0'>
            {title ? <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 xl:max-w-3xl xl:flex-row xl:justify-end">
            <div className="relative w-full xl:max-w-sm">
              {/* <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> */}
              <input className="input pl-11" value={searchValue} onChange={(e) => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder} />
            </div>
            {filters.map((filter) => (
              <div className='shrink-0'><CustomSelect
                key={filter.key}
                className="w-full xl:max-w-[220px]"
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
                placeholder={filter.placeholder || 'Chọn bộ lọc'}
                label={filter.label || ''}
                searchable={filter.searchable}
                multiple={filter.multiple}
                clearable={filter.clearable ?? true}
              /></div>
              
            ))}
          </div>
        </div>
      </div>

      {hasSelection ? (
        <div className="flex flex-col gap-3 border-b border-amber-200/60 bg-amber-50/80 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Đã chọn {selectedIds.length} dòng để thao tác hàng loạt.</p>
          <div className="flex flex-wrap gap-2">
            {bulkActions.map((action) => (
              <button key={action.key} className={action.tone === 'danger' ? 'btn-danger' : 'btn-secondary'} onClick={action.onClick}>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/70">
            <tr>
              {onToggleRow ? (
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  <input type="checkbox" checked={allCurrentPageSelected} onChange={onTogglePageSelection} className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 ${column.className || ''}`}>
                  <SortButton column={column} sort={sort} onToggleSort={onToggleSort} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.length ? rows.map((row, index) => (
              <tr key={row.id || index} className="bg-white/60 transition hover:bg-amber-50/60 dark:bg-slate-950/40 dark:hover:bg-slate-900/80">
                {onToggleRow ? (
                  <td className="px-5 py-4 align-top">
                    <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onToggleRow(row.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-4 align-top text-sm text-slate-700 dark:text-slate-300 ${column.cellClassName || ''}`}>
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + (onToggleRow ? 1 : 0)} className="px-5 py-14 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200/70 p-5 dark:border-slate-800/80 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Trang {page} / {Math.max(totalPages, 1)}</p>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => onPageChange?.(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft size={16} className="mr-1" /> Trước
          </button>
          <button className="btn-secondary" onClick={() => onPageChange?.(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
            Sau <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
