import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import { CardSkeleton } from "../../components/common/Skeleton";
import DataTable from "../../components/table/DataTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import PermissionGate from "../../components/admin/PermissionGate";
import { useTableState } from "../../hooks/useTableState";
import { useAdminMutations, useAdminUsers } from "../../hooks/useAdmin";
import { PERMISSIONS } from "../../constants/permissions";

export default function AdminUsersPage() {
  const usersQuery = useAdminUsers();
  const m = useAdminMutations();
  const [targetUser, setTargetUser] = useState(null);
  const [bulkToggle, setBulkToggle] = useState(false);
  const users = usersQuery.data || [];
  const table = useTableState(users, {
    pageSize: 8,
    defaultSort: { key: "fullName", direction: "asc" },
    searchFn: (user, keyword) =>
      [user.fullName, user.email, user.role, user.phoneNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword)),
  });

  const onToggleLock = async () => {
    try {
      if (bulkToggle) {
        await Promise.all(
          table.selectedIds.map((id) => {
            const user = users.find((item) => item.id === id);
            return m.lockUser.mutateAsync({
              id,
              payload: { isLocked: !user?.isLocked },
            });
          }),
        );
        toast.success("Đã cập nhật trạng thái các tài khoản đã chọn");
        table.setSelectedIds([]);
        setBulkToggle(false);
      } else {
        await m.lockUser.mutateAsync({
          id: targetUser.id,
          payload: { isLocked: !targetUser.isLocked },
        });
        toast.success(
          targetUser.isLocked ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
        );
      }
      setTargetUser(null);
    } catch {
      toast.error("Không thể cập nhật trạng thái tài khoản");
    }
  };

  const columns = [
    {
      key: "user",
      label: "Người dùng",
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">
            {user.fullName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user.email}
          </p>
        </div>
      ),
    },
    {
      key: "phoneNumber",
      label: "Liên hệ",
      sortable: true,
      render: (user) => user.phoneNumber || "--",
    },
    {
      key: "role",
      label: "Vai trò",
      sortable: true,
      render: (user) => (
        <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      render: (user) => (
        <span
          className={`badge ${user.isLocked ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"}`}
        >
          {user.isLocked ? "LOCKED" : "ACTIVE"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (user) => (
        <button
          className={user.isLocked ? "btn-primary" : "btn-danger"}
          onClick={() => {
            setBulkToggle(false);
            setTargetUser(user);
          }}
        >
          {user.isLocked ? "Mở khóa" : "Khóa"}
        </button>
      ),
    },
  ];

  if (usersQuery.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-32" />
        ))}
      </div>
    );
  if (usersQuery.isError)
    return (
      <ErrorState
        message="Không tải được danh sách người dùng"
        onRetry={usersQuery.refetch}
      />
    );

  return (
    <PermissionGate permissions={[PERMISSIONS.USERS_VIEW]}>
      <div className="space-y-6">
        <PageHeader
          title="Quản lý người dùng"
          // description="Theo dõi tài khoản, vai trò, trạng thái khóa và bulk action bảo mật."
        />
        <DataTable
          title="Danh sách người dùng"
          // description="Có tìm kiếm, filter trạng thái, sort và xác nhận trước khi khóa/mở khóa tài khoản."
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Tìm tên, email, số điện thoại, role..."
          columns={columns}
          rows={table.paginatedRows}
          page={table.page}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          emptyText="Không tìm thấy người dùng"
          selectedIds={table.selectedIds}
          onToggleRow={table.toggleRow}
          onTogglePageSelection={table.togglePageSelection}
          allCurrentPageSelected={table.allCurrentPageSelected}
          sort={table.sort}
          onToggleSort={(key) =>
            table.setSort((current) => ({
              key,
              direction:
                current?.key === key && current.direction === "asc"
                  ? "desc"
                  : "asc",
            }))
          }
          filters={[
            {
              key: "status",
              value: table.status,
              onChange: table.setStatus,
              options: [
                { value: "ALL", label: "Tất cả trạng thái", emoji: "👥" },
                {
                  value: "ACTIVE",
                  label: "Hoạt động",
                  emoji: "🟢",
                  meta: "Có thể đăng nhập",
                },
                {
                  value: "LOCKED",
                  label: "Đã khóa",
                  emoji: "🔒",
                  meta: "Bị hạn chế truy cập",
                },
              ],
            },
          ]}
          bulkActions={[
            {
              key: "toggle",
              label: "Đảo trạng thái đã chọn",
              onClick: () => {
                setBulkToggle(true);
                setTargetUser({});
              },
            },
          ]}
        />
        <ConfirmDialog
          open={!!targetUser}
          onClose={() => {
            setTargetUser(null);
            setBulkToggle(false);
          }}
          onConfirm={onToggleLock}
          title={
            bulkToggle
              ? "Cập nhật trạng thái hàng loạt"
              : targetUser?.isLocked
                ? "Mở khóa tài khoản"
                : "Khóa tài khoản"
          }
          description={
            bulkToggle
              ? `Các tài khoản đã chọn sẽ được đảo trạng thái khóa/mở khóa.`
              : `Tài khoản ${targetUser?.fullName || ""} sẽ được ${targetUser?.isLocked ? "mở khóa" : "khóa"} trong hệ thống.`
          }
          confirmText={
            bulkToggle
              ? "Xác nhận cập nhật"
              : targetUser?.isLocked
                ? "Mở khóa"
                : "Khóa tài khoản"
          }
          tone={targetUser?.isLocked ? "primary" : "danger"}
        />
      </div>
    </PermissionGate>
  );
}
