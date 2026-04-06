import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, GraduationCap, House, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { formatDate, joinNames } from '../lib/utils';
import { fetchCollection } from '../services/cms-api';
import { useAuthStore } from '../store/auth-store';
import type { CmsRecord } from '../types/cms';

interface TeacherClassItem extends CmsRecord {
  name?: string;
  fromDate?: string;
  toDate?: string;
  soStudents?: unknown[];
  soUsers?: Array<{ id?: string; name?: string }>;
}

const toText = (value: unknown, fallback = '-') => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return fallback;
};

const isClassAssignedToTeacher = (item: TeacherClassItem, teacherId: string) => {
  if (!teacherId || !Array.isArray(item.soUsers)) {
    return false;
  }

  return item.soUsers.some((teacher) => String(teacher?.id ?? '') === teacherId);
};

export function TeacherOverviewPage() {
  const profile = useAuthStore((state) => state.profile);
  const teacherId = String(profile?.id ?? '');

  const classesQuery = useQuery({
    queryKey: ['teacher-overview', 'classes', teacherId],
    queryFn: () =>
      fetchCollection('/so-classes', {
        limit: 1000,
        includeRelations: ['soStudents', 'soUsers'],
        order: ['name ASC'],
      }),
    enabled: Boolean(teacherId),
  });

  const assignedClasses = useMemo(() => {
    const rows = (classesQuery.data ?? []) as TeacherClassItem[];
    return rows.filter((item) => isClassAssignedToTeacher(item, teacherId));
  }, [classesQuery.data, teacherId]);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <House className='h-5 w-5 text-primary' />
                Lớp học được phân công
              </CardTitle>
              <CardDescription>
                Danh sách lớp đang phụ trách và lối vào nhanh tới trang chi tiết từng lớp.
              </CardDescription>
            </div>
            <Button asChild variant='secondary' size='sm'>
              <Link to='/classes'>Mở danh sách lớp</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {classesQuery.isLoading ? (
            <div className='rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground'>
              Đang tải lớp học được phân công...
            </div>
          ) : assignedClasses.length === 0 ? (
            <div className='rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground'>
              Chưa có lớp nào được phân công cho tài khoản này.
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {assignedClasses.map((item) => {
                const studentCount = Array.isArray(item.soStudents) ? item.soStudents.length : 0;
                const teacherCount = Array.isArray(item.soUsers) ? item.soUsers.length : 0;

                return (
                  <div key={item.id} className='rounded-2xl border border-border/70 bg-muted/20 p-4'>
                    <p className='font-semibold'>{toText(item.name, 'Chưa đặt tên lớp')}</p>

                    <div className='mt-2 flex flex-wrap gap-2'>
                      <Badge variant='secondary' className='inline-flex items-center gap-1'>
                        <GraduationCap className='h-3.5 w-3.5' />
                        {studentCount} học sinh
                      </Badge>
                      <Badge variant='secondary' className='inline-flex items-center gap-1'>
                        <Users className='h-3.5 w-3.5' />
                        {teacherCount} giáo viên
                      </Badge>
                    </div>

                    <p className='mt-2 text-xs text-muted-foreground'>
                      Thời gian: {formatDate(item.fromDate)} - {formatDate(item.toDate)}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>Phụ trách: {joinNames(item.soUsers, 'Chưa có')}</p>

                    <Button asChild size='sm' className='mt-3 w-full justify-between'>
                      <Link to={`/classes/${String(item.id)}`}>
                        Vào chi tiết lớp
                        <ArrowUpRight className='h-4 w-4' />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
