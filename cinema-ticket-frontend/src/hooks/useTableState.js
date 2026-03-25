import { useMemo, useState } from 'react';

function resolveValue(row, sortBy) {
  if (!sortBy) return undefined;
  if (typeof sortBy === 'function') return sortBy(row);
  return String(sortBy).split('.').reduce((acc, key) => acc?.[key], row);
}

export function useTableState(rows = [], options = {}) {
  const { pageSize = 8, searchFn, defaultSort } = options;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(defaultSort || { key: '', direction: 'asc' });
  const [status, setStatus] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredRows = useMemo(() => {
    let next = [...rows];
    const keyword = search.trim().toLowerCase();

    if (keyword && searchFn) {
      next = next.filter((row) => searchFn(row, keyword));
    }

    if (status !== 'ALL') {
      next = next.filter((row) => {
        const raw = row.status ?? row.isLocked;
        if (typeof raw === 'boolean') return status === (raw ? 'LOCKED' : 'ACTIVE');
        return String(raw || '').toUpperCase() === status;
      });
    }

    if (sort?.key) {
      next.sort((a, b) => {
        const av = resolveValue(a, sort.key);
        const bv = resolveValue(b, sort.key);
        const aa = typeof av === 'string' ? av.toLowerCase() : av ?? '';
        const bb = typeof bv === 'string' ? bv.toLowerCase() : bv ?? '';
        if (aa === bb) return 0;
        const base = aa > bb ? 1 : -1;
        return sort.direction === 'desc' ? -base : base;
      });
    }

    return next;
  }, [rows, search, sort, status, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const currentPageIds = paginatedRows.map((item) => item.id).filter(Boolean);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

  const toggleRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      if (allCurrentPageSelected) return prev.filter((id) => !currentPageIds.includes(id));
      return Array.from(new Set([...prev, ...currentPageIds]));
    });
  };

  return {
    search,
    setSearch: (value) => {
      setSearch(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    sort,
    setSort,
    status,
    setStatus: (value) => {
      setStatus(value);
      setPage(1);
    },
    filteredRows,
    paginatedRows,
    selectedIds,
    setSelectedIds,
    toggleRow,
    togglePageSelection,
    allCurrentPageSelected,
    currentPageIds,
  };
}
