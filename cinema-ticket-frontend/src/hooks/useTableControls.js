import { useMemo, useState } from 'react';

export function useTableControls(items = [], matcher, pageSize = 6) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => matcher(item, keyword));
  }, [items, matcher, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage, pageSize]);

  return { search, setSearch, page: safePage, setPage, totalPages, paginated, totalItems: filtered.length };
}
