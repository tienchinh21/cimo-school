import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { fetchCollection } from '../services/cms-api';
import { apiClient } from '../lib/api-client';
import { getErrorMessage, joinNames } from '../lib/utils';

function toIds(source: unknown, key: string) {
  if (!Array.isArray(source)) {
    return [] as string[];
  }

  return source
    .map((item) => {
      if (item && typeof item === 'object' && key in item) {
        return String((item as Record<string, unknown>)[key]);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

export function StudentParentLinkPage() {
  const queryClient = useQueryClient();
  const [searchStudent, setSearchStudent] = useState('');
  const [searchParent, setSearchParent] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['resource', 'student-links'],
    queryFn: () => fetchCollection('/so-students', { limit: 500, includeRelations: ['parents', 'soClass'] }),
  });

  const parentsQuery = useQuery({
    queryKey: ['resource', 'parents-links'],
    queryFn: () => fetchCollection('/so-parents', { limit: 500, includeRelations: ['students'] }),
  });

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const parents = useMemo(() => parentsQuery.data ?? [], [parentsQuery.data]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSelectionMap, setStudentSelectionMap] = useState<Record<string, string[]>>({});

  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentSelectionMap, setParentSelectionMap] = useState<Record<string, string[]>>({});

  const effectiveStudentId = selectedStudentId || (students[0] ? String(students[0].id) : '');
  const effectiveParentId = selectedParentId || (parents[0] ? String(parents[0].id) : '');

  const selectedStudent = useMemo(
    () => students.find((item) => String(item.id) === effectiveStudentId),
    [effectiveStudentId, students]
  );

  const selectedParent = useMemo(
    () => parents.find((item) => String(item.id) === effectiveParentId),
    [effectiveParentId, parents]
  );

  const selectedParentIds =
    studentSelectionMap[effectiveStudentId] ?? toIds(selectedStudent?.parents, 'id');
  const selectedStudentIds =
    parentSelectionMap[effectiveParentId] ?? toIds(selectedParent?.students, 'id');

  const saveByStudentMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveStudentId) {
        throw new Error('Vui lòng chọn học sinh.');
      }

      const currentIds = toIds(selectedStudent?.parents, 'id');
      const toAdd = selectedParentIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedParentIds.includes(id));

      if (toAdd.length > 0) {
        await apiClient.post(`/so-students/${effectiveStudentId}/parents`, {
          parentIds: toAdd,
        });
      }

      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((parentId) => apiClient.delete(`/so-students/${effectiveStudentId}/parents/${parentId}`)));
      }
    },
    onSuccess: () => {
      toast.success('Đã cập nhật liên kết theo học sinh.');
      setStudentSelectionMap((prev) => {
        const next = { ...prev };
        delete next[effectiveStudentId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const saveByParentMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveParentId) {
        throw new Error('Vui lòng chọn phụ huynh.');
      }

      const currentIds = toIds(selectedParent?.students, 'id');
      const toAdd = selectedStudentIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedStudentIds.includes(id));

      if (toAdd.length > 0) {
        await apiClient.post(`/so-parents/${effectiveParentId}/students`, {
          studentIds: toAdd,
        });
      }

      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((studentId) => apiClient.delete(`/so-students/${studentId}/parents/${effectiveParentId}`)));
      }
    },
    onSuccess: () => {
      toast.success('Đã cập nhật liên kết theo phụ huynh.');
      setParentSelectionMap((prev) => {
        const next = { ...prev };
        delete next[effectiveParentId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const filteredParents = useMemo(() => {
    const keyword = searchParent.trim().toLowerCase();
    if (!keyword) return parents;
    return parents.filter((item) => JSON.stringify(item).toLowerCase().includes(keyword));
  }, [parents, searchParent]);

  const filteredStudents = useMemo(() => {
    const keyword = searchStudent.trim().toLowerCase();
    if (!keyword) return students;
    return students.filter((item) => JSON.stringify(item).toLowerCase().includes(keyword));
  }, [students, searchStudent]);

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card className='animate-fade-in'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link2 className='h-5 w-5 text-primary' />
            Liên kết theo học sinh
          </CardTitle>
          <CardDescription>
            Chọn một học sinh rồi gán các phụ huynh tương ứng bằng endpoint `/so-students/{'{id}'}/parents`.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div>
            <p className='mb-2 text-sm font-semibold'>Học sinh</p>
            <Select value={effectiveStudentId || undefined} onValueChange={setSelectedStudentId}>
              <SelectTrigger className='h-11'>
                <SelectValue placeholder='Chọn học sinh' />
              </SelectTrigger>
              <SelectContent>
                {students.map((item) => {
                  const className =
                    item.soClass && typeof item.soClass === 'object' && 'name' in item.soClass
                      ? ` - ${String(item.soClass.name)}`
                      : '';

                  return (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {String(item.name ?? item.id)}
                      {className}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className='mt-4 rounded-xl border border-border/70 bg-muted/30 p-3'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>Phụ huynh hiện tại</p>
              <p className='mt-1 text-sm'>{joinNames(selectedStudent?.parents, 'Chưa có liên kết')}</p>
            </div>
          </div>

          <div>
            <p className='mb-2 text-sm font-semibold'>Danh sách phụ huynh</p>
            <div className='relative mb-2'>
              <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                className='pl-9'
                value={searchParent}
                placeholder='Tìm phụ huynh...'
                onChange={(event) => setSearchParent(event.target.value)}
              />
            </div>
            <select
              multiple
              className='min-h-52 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              value={selectedParentIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                setStudentSelectionMap((prev) => ({
                  ...prev,
                  [effectiveStudentId]: values,
                }));
              }}
            >
              {filteredParents.map((parent) => (
                <option key={parent.id} value={String(parent.id)}>
                  {String(parent.name ?? parent.id)}
                  {parent.relation ? ` - ${String(parent.relation)}` : ''}
                </option>
              ))}
            </select>

            <p className='mt-1 text-xs text-muted-foreground'>Giữ Ctrl/Cmd để chọn nhiều mục.</p>

            <Button
              className='mt-4 w-full'
              onClick={() => saveByStudentMutation.mutate()}
              disabled={saveByStudentMutation.isPending}
            >
              {saveByStudentMutation.isPending ? 'Đang cập nhật...' : 'Lưu liên kết theo học sinh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='animate-fade-in'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link2 className='h-5 w-5 text-accent' />
            Liên kết theo phụ huynh
          </CardTitle>
          <CardDescription>
            Chọn một phụ huynh rồi gán danh sách học sinh bằng `/so-parents/{'{id}'}/students`.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div>
            <p className='mb-2 text-sm font-semibold'>Phụ huynh</p>
            <Select value={effectiveParentId || undefined} onValueChange={setSelectedParentId}>
              <SelectTrigger className='h-11'>
                <SelectValue placeholder='Chọn phụ huynh' />
              </SelectTrigger>
              <SelectContent>
                {parents.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {String(item.name ?? item.id)}
                    {item.relation ? ` - ${String(item.relation)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='mt-4 rounded-xl border border-border/70 bg-muted/30 p-3'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>Học sinh hiện tại</p>
              <p className='mt-1 text-sm'>{joinNames(selectedParent?.students, 'Chưa có liên kết')}</p>
            </div>
          </div>

          <div>
            <p className='mb-2 text-sm font-semibold'>Danh sách học sinh</p>
            <div className='relative mb-2'>
              <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                className='pl-9'
                value={searchStudent}
                placeholder='Tìm học sinh...'
                onChange={(event) => setSearchStudent(event.target.value)}
              />
            </div>
            <select
              multiple
              className='min-h-52 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              value={selectedStudentIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                setParentSelectionMap((prev) => ({
                  ...prev,
                  [effectiveParentId]: values,
                }));
              }}
            >
              {filteredStudents.map((student) => (
                <option key={student.id} value={String(student.id)}>
                  {String(student.name ?? student.id)}
                </option>
              ))}
            </select>

            <p className='mt-1 text-xs text-muted-foreground'>Giữ Ctrl/Cmd để chọn nhiều mục.</p>

            <Button
              className='mt-4 w-full'
              onClick={() => saveByParentMutation.mutate()}
              disabled={saveByParentMutation.isPending}
            >
              {saveByParentMutation.isPending ? 'Đang cập nhật...' : 'Lưu liên kết theo phụ huynh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
