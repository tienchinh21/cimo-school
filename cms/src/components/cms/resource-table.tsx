import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Eye, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { CmsRecord, CmsResourceConfig } from '../../types/cms';

interface ResourceTableProps {
  resource: CmsResourceConfig;
  data: CmsRecord[];
  search: string;
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  fetching: boolean;
  selectedIds: string[];
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  onSearchChange: (search: string) => void;
  onCreate?: () => void;
  onView?: (row: CmsRecord) => void;
  onEdit?: (row: CmsRecord) => void;
  onDelete: (row: CmsRecord) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onSortChange: (columnKey: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const primitiveToText = (value: unknown) => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-';

    return value
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return String((item as { name: unknown }).name);
        }
        return String(item);
      })
      .join(', ');
  }

  if (typeof value === 'object') {
    if ('name' in value) {
      return String((value as { name: unknown }).name);
    }
    return '-';
  }

  return String(value);
};

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const toCsv = (resource: CmsResourceConfig, rows: CmsRecord[]) => {
  const header = resource.columns.map((column) => column.label);
  const lines = rows.map((row) =>
    resource.columns.map((column) => {
      const value = primitiveToText(row[column.key]);
      return escapeCsv(value);
    })
  );

  return [header.map(escapeCsv).join(','), ...lines.map((line) => line.join(','))].join('\n');
};

export function ResourceTable({
  resource,
  data,
  search,
  page,
  pageSize,
  total,
  loading,
  fetching,
  selectedIds,
  sortBy,
  sortDirection,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  onSortChange,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onView,
}: ResourceTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allowSelection = resource.selectable !== false && resource.deletable !== false;
  const allSelected = allowSelection && data.length > 0 && data.every((row) => selectedIds.includes(String(row.id)));

  return (
    <Card className='animate-fade-in'>
      <CardHeader className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div>
          <CardTitle>{resource.title}</CardTitle>
          <CardDescription>{resource.subtitle}</CardDescription>
        </div>

        <div className='flex flex-col gap-2 lg:flex-row'>
          <div className='relative min-w-64'>
            <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Tìm kiếm theo dữ liệu server...'
              value={search}
              className='pl-9'
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <Button variant='secondary' onClick={onRefresh}>
            {fetching ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
            Làm mới
          </Button>
          <Button
            variant='secondary'
            onClick={() => {
              const csv = toCsv(resource, data);
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `${resource.key}-page-${page}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            disabled={data.length === 0}
          >
            <Download className='h-4 w-4' />
            Xuất CSV
          </Button>
          {onCreate ? (
            <Button onClick={onCreate}>
              <Plus className='h-4 w-4' />
              Thêm mới
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {allowSelection ? (
          <div className='flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-3'>
            <p className='text-sm text-muted-foreground'>Đã chọn {selectedIds.length} bản ghi trên trang hiện tại.</p>
            <Button variant='danger' size='sm' onClick={onDeleteSelected} disabled={selectedIds.length === 0}>
              <Trash2 className='h-4 w-4' />
              Xóa đã chọn
            </Button>
          </div>
        ) : null}

        <div className='overflow-x-auto rounded-xl border border-border/70'>
          <Table>
            <TableHeader>
              <TableRow>
                {allowSelection ? (
                  <TableHead className='w-12'>
                    <input
                      type='checkbox'
                      checked={allSelected}
                      onChange={(event) => onToggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                ) : null}
                {resource.columns.map((column) => {
                  const sortable = column.sortable !== false;
                  const isSortColumn = sortBy === column.key;
                  return (
                    <TableHead key={column.key} className={column.className}>
                      {sortable ? (
                        <button
                          type='button'
                          className='inline-flex items-center gap-1 font-semibold text-inherit'
                          onClick={() => onSortChange(column.key)}
                        >
                          {column.label}
                          {isSortColumn ? (
                            sortDirection === 'ASC' ? (
                              <ArrowUp className='h-3.5 w-3.5' />
                            ) : (
                              <ArrowDown className='h-3.5 w-3.5' />
                            )
                          ) : null}
                        </button>
                      ) : (
                        <span className='inline-flex items-center gap-1 font-semibold text-inherit'>{column.label}</span>
                      )}
                    </TableHead>
                  );
                })}
                <TableHead className='w-44 text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={resource.columns.length + 1 + (allowSelection ? 1 : 0)}
                    className='py-10 text-center text-muted-foreground'
                  >
                    <div className='inline-flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang tải dữ liệu...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={resource.columns.length + 1 + (allowSelection ? 1 : 0)}
                    className='py-8 text-center text-muted-foreground'
                  >
                    Không có dữ liệu phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    {allowSelection ? (
                      <TableCell>
                        <input
                          type='checkbox'
                          checked={selectedIds.includes(String(row.id))}
                          onChange={(event) => onToggleSelect(String(row.id), event.target.checked)}
                        />
                      </TableCell>
                    ) : null}
                    {resource.columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render ? column.render(row) : primitiveToText(row[column.key])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className='flex items-center justify-end gap-1'>
                        {onView ? (
                          <Button size='sm' variant='ghost' onClick={() => onView(row)}>
                            <Eye className='h-4 w-4 text-primary' />
                          </Button>
                        ) : null}
                        {onEdit ? (
                          <Button size='sm' variant='ghost' onClick={() => onEdit(row)}>
                            <Pencil className='h-4 w-4' />
                          </Button>
                        ) : null}
                        {resource.deletable === false ? null : (
                          <Button size='sm' variant='ghost' onClick={() => onDelete(row)}>
                            <Trash2 className='h-4 w-4 text-danger' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-sm text-muted-foreground'>
            Trang {page} / {totalPages} - Tổng {total} bản ghi
          </div>

          <div className='flex items-center gap-2'>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className='w-[120px] rounded-lg'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant='secondary' size='icon' onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='secondary'
              size='icon'
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
