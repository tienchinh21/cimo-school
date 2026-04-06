import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { ResourceFormDialog } from '../components/cms/resource-form-dialog';
import { ResourceTable } from '../components/cms/resource-table';
import { cmsResourceMap } from '../config/resources';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useReferenceOptions } from '../hooks/use-reference-options';
import { getErrorMessage } from '../lib/utils';
import { createResource, deleteResource, fetchCollection, fetchCount, updateResource } from '../services/cms-api';
import { useAuthStore } from '../store/auth-store';
import type { CmsRecord } from '../types/cms';
import { useConfirmDialog } from '../components/ui/confirm-dialog-provider';

interface ResourcePageProps {
  resourceKey: string;
}

const buildSearchWhere = (search: string, fields: string[] = []) => {
  const keyword = search.trim();
  if (!keyword || fields.length === 0) {
    return undefined;
  }

  return {
    or: fields.map((field) => ({
      [field]: {
        like: `%${keyword}%`,
      },
    })),
  } as Record<string, unknown>;
};

export function ResourcePage({ resourceKey }: ResourcePageProps) {
  const resource = cmsResourceMap[resourceKey];
  const isDetailManagedResource = resourceKey === 'students' || resourceKey === 'classes';
  const profile = useAuthStore((state) => state.profile);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { map: referenceOptions } = useReferenceOptions();
  const confirmDialog = useConfirmDialog();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<CmsRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<string>(() => {
    if (!resource) return 'createdDate';
    const order = resource.defaultOrder?.[0];
    if (!order) return 'createdDate';
    return order.split(' ')[0] || 'createdDate';
  });

  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>(() => {
    if (!resource) return 'DESC';
    const order = resource.defaultOrder?.[0];
    if (!order) return 'DESC';
    return order.toUpperCase().includes('ASC') ? 'ASC' : 'DESC';
  });

  const where = useMemo(
    () => buildSearchWhere(debouncedSearch, resource?.searchFields),
    [debouncedSearch, resource?.searchFields]
  );

  const listQuery = useQuery({
    queryKey: ['resource', resourceKey, page, pageSize, where, sortBy, sortDirection],
    queryFn: () =>
      fetchCollection(resource.endpoint, {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        includeRelations: resource.includeRelations,
        order: [`${sortBy} ${sortDirection}`],
        where,
      }),
    enabled: Boolean(resource),
  });

  const countQuery = useQuery({
    queryKey: ['resource-count', resourceKey, where],
    queryFn: () => fetchCount(resource.countEndpoint ?? `${resource.endpoint}/count`, where),
    enabled: Boolean(resource),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createResource(resource.endpoint, payload),
    onSuccess: () => {
      toast.success(`Đã tạo mới ${resource.title.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['resource-count', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['refs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateResource(resource.endpoint, id, payload),
    onSuccess: () => {
      toast.success(`Đã cập nhật ${resource.title.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['refs'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResource(resource.endpoint, id),
    onSuccess: () => {
      toast.success(`Đã xóa ${resource.title.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['resource-count', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['refs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteResource(resource.endpoint, id)));
    },
    onSuccess: (_data, ids) => {
      toast.success(`Đã xóa ${ids.length} bản ghi ${resource.title.toLowerCase()}.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['resource-count', resourceKey] });
      queryClient.invalidateQueries({ queryKey: ['refs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const total = countQuery.data ?? 0;
  const selectedIdsOnPage = useMemo(
    () => selectedIds.filter((id) => rows.some((row) => String(row.id) === id)),
    [selectedIds, rows]
  );

  const viewHandler = useMemo(() => {
    if (resourceKey === 'students') {
      return (row: CmsRecord) => navigate(`/students/${String(row.id)}`);
    }

    if (resourceKey === 'classes') {
      return (row: CmsRecord) => navigate(`/classes/${String(row.id)}`);
    }

    return undefined;
  }, [navigate, resourceKey]);

  const editHandler = useMemo(() => {
    if (isDetailManagedResource || resource.editable === false) {
      return undefined;
    }

    return (row: CmsRecord) => {
      setMode('edit');
      setEditingData(row);
      setDialogOpen(true);
    };
  }, [isDetailManagedResource]);

  if (!resource) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p>Không tìm thấy module.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ResourceTable
        resource={resource}
        data={rows}
        search={search}
        page={page}
        pageSize={pageSize}
        total={total}
        loading={listQuery.isLoading || countQuery.isLoading}
        fetching={listQuery.isFetching || countQuery.isFetching}
        selectedIds={selectedIdsOnPage}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onCreate={
          resource.creatable === false
            ? undefined
            : () => {
                setMode('create');
                setEditingData(null);
                setDialogOpen(true);
              }
        }
        onEdit={editHandler}
        onDelete={async (row) => {
          if (resourceKey === 'users' && String(row.id) === String(profile?.id)) {
            toast.error('Không thể xóa tài khoản đang đăng nhập.');
            return;
          }
          const confirmed = await confirmDialog({
            title: 'Xóa bản ghi',
            description: 'Bạn chắc chắn muốn xóa bản ghi này?',
            confirmText: 'Xóa',
            variant: 'danger',
          });
          if (!confirmed) return;
          deleteMutation.mutate(String(row.id));
        }}
        onToggleSelect={(id, checked) => {
          setSelectedIds((prev) => {
            if (checked) {
              if (prev.includes(id)) return prev;
              return [...prev, id];
            }
            return prev.filter((item) => item !== id);
          });
        }}
        onToggleSelectAll={(checked) => {
          if (checked) {
            setSelectedIds(rows.map((row) => String(row.id)));
            return;
          }
          setSelectedIds([]);
        }}
        onDeleteSelected={async () => {
          if (resourceKey === 'users' && profile?.id && selectedIdsOnPage.includes(String(profile.id))) {
            toast.error('Danh sách đang chọn có tài khoản hiện tại. Vui lòng bỏ chọn trước khi xóa.');
            return;
          }
          if (selectedIdsOnPage.length === 0) {
            toast.error('Vui lòng chọn ít nhất một bản ghi để xóa.');
            return;
          }
          const confirmed = await confirmDialog({
            title: 'Xóa nhiều bản ghi',
            description: `Xóa ${selectedIdsOnPage.length} bản ghi đã chọn?`,
            confirmText: 'Xóa',
            variant: 'danger',
          });
          if (!confirmed) return;
          bulkDeleteMutation.mutate(selectedIdsOnPage);
        }}
        onSortChange={(columnKey) => {
          if (sortBy === columnKey) {
            setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
            setPage(1);
            return;
          }
          setSortBy(columnKey);
          setSortDirection('ASC');
          setPage(1);
        }}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] });
          queryClient.invalidateQueries({ queryKey: ['resource-count', resourceKey] });
        }}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          setSelectedIds([]);
        }}
        onPageSizeChange={(nextSize) => {
          setPage(1);
          setPageSize(nextSize);
          setSelectedIds([]);
        }}
        onView={viewHandler}
      />

      <ResourceFormDialog
        resource={resource}
        mode={mode}
        open={dialogOpen}
        loading={createMutation.isPending || updateMutation.isPending}
        initialData={editingData}
        referenceOptions={referenceOptions}
        onOpenChange={setDialogOpen}
        onSubmit={async (payload) => {
          if (mode === 'create') {
            await createMutation.mutateAsync(payload);
            return;
          }

          if (!editingData?.id) {
            throw new Error('Không tìm thấy id để cập nhật');
          }

          await updateMutation.mutateAsync({ id: String(editingData.id), payload });
        }}
      />
    </>
  );
}
