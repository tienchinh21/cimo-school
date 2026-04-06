import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useConfirmDialog } from '../components/ui/confirm-dialog-provider';
import { apiClient } from '../lib/api-client';
import { formatDate, getErrorMessage } from '../lib/utils';
import { fetchCollection } from '../services/cms-api';

export function WishesPage() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const wishesQuery = useQuery({
    queryKey: ['wishes'],
    queryFn: () => fetchCollection('/do-wishes', { limit: 500 }),
  });

  const wishes = useMemo(() => wishesQuery.data ?? [], [wishesQuery.data]);

  const filteredWishes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return wishes;
    }
    return wishes.filter((item) => JSON.stringify(item).toLowerCase().includes(keyword));
  }, [search, wishes]);

  const allSelected = useMemo(
    () =>
      filteredWishes.length > 0 &&
      filteredWishes.every((wish) => selectedIds.includes(String(wish.id))),
    [filteredWishes, selectedIds]
  );

  const removeOneMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      apiClient.delete(`/do-wishes/${id}`, {
        data: { verificationCode: code },
      }),
    onSuccess: (_data, variables) => {
      toast.success('Đã xóa lời chúc.');
      queryClient.invalidateQueries({ queryKey: ['wishes'] });
      setSelectedIds((prev) => prev.filter((item) => item !== variables.id));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const removeManyMutation = useMutation({
    mutationFn: ({ ids, code }: { ids: string[]; code: string }) =>
      apiClient.delete('/do-wishes/delete-many', {
        data: { ids, verificationCode: code },
      }),
    onSuccess: () => {
      toast.success('Đã xóa các lời chúc đã chọn.');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['wishes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'wishes'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleRemoveOne = async (id: string) => {
    if (!verificationCode) {
      toast.error('Vui lòng nhập mã xác thực trước khi xóa.');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Xóa lời chúc',
      description: 'Bạn chắc chắn muốn xóa lời chúc này?',
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) return;

    removeOneMutation.mutate({ id, code: verificationCode });
  };

  const handleRemoveMany = async () => {
    if (!verificationCode) {
      toast.error('Vui lòng nhập mã xác thực trước khi xóa.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lời chúc.');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Xóa nhiều lời chúc',
      description: `Xóa ${selectedIds.length} lời chúc đã chọn?`,
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) return;

    removeManyMutation.mutate({ ids: selectedIds, code: verificationCode });
  };

  return (
    <Card className='animate-fade-in'>
      <CardHeader>
        <CardTitle>Quản lý lời chúc</CardTitle>
        <CardDescription>
          Endpoint `/do-wishes` yêu cầu mã xác thực khi xóa. Nhập mã, tìm kiếm và thao tác theo lô.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='flex flex-col gap-2 lg:flex-row'>
          <Input
            value={verificationCode}
            placeholder='Nhập verificationCode để xóa'
            onChange={(event) => setVerificationCode(event.target.value)}
          />

          <div className='relative min-w-72'>
            <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input value={search} className='pl-9' placeholder='Tìm theo tên hoặc nội dung...' onChange={(event) => setSearch(event.target.value)} />
          </div>

          <Button variant='danger' onClick={handleRemoveMany} disabled={removeManyMutation.isPending || selectedIds.length === 0}>
            {removeManyMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
            Xóa đã chọn ({selectedIds.length})
          </Button>
        </div>

        <div className='overflow-x-auto rounded-xl border border-border/70'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <input
                    type='checkbox'
                    checked={allSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds(filteredWishes.map((item) => String(item.id)));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wishesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                    <span className='inline-flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang tải dữ liệu...
                    </span>
                  </TableCell>
                </TableRow>
              ) : filteredWishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                    Không có lời chúc phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWishes.map((wish) => {
                  const checked = selectedIds.includes(String(wish.id));
                  return (
                    <TableRow key={wish.id}>
                      <TableCell>
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={(event) => {
                            const id = String(wish.id);
                            if (event.target.checked) {
                              setSelectedIds((prev) => [...prev, id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((item) => item !== id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{String(wish.name ?? '-')}</TableCell>
                      <TableCell className='max-w-lg whitespace-normal'>{String(wish.content ?? '-')}</TableCell>
                      <TableCell>{formatDate(wish.createdDate)}</TableCell>
                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleRemoveOne(String(wish.id))}
                          disabled={removeOneMutation.isPending}
                        >
                          <Trash2 className='h-4 w-4 text-danger' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
