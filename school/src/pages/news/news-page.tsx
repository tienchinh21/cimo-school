import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarClock,
  IconNews,
  IconPhotoPlus,
  IconSparkles,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ClassSelector } from '@/app/components/class-selector'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { queryKeys } from '@/shared/api/query-keys'
import { createClassBlog, getClassBlogs } from '@/shared/api/teacher'
import { formatDateTime, usePageSeo } from '@/shared/lib'

const emptyForm = {
  description: '',
  imgs: '',
  name: '',
  sumary: '',
}

const quickTemplates = [
  {
    description:
      'Hôm nay lớp đã hoàn thành các hoạt động học tập theo kế hoạch. Giáo viên ghi nhận sự hợp tác tốt của học sinh trong giờ học và sinh hoạt.',
    id: 'daily-update',
    label: 'Bản tin hằng ngày',
    name: 'Bản tin lớp hôm nay',
    sumary: 'Cập nhật nhanh hoạt động học tập và nề nếp trong ngày.',
  },
  {
    description:
      'Giáo viên đề nghị phụ huynh phối hợp chuẩn bị đầy đủ dụng cụ học tập cho tuần tới. Vui lòng kiểm tra tập vở và đồng phục trước khi đến lớp.',
    id: 'parent-reminder',
    label: 'Nhắc phụ huynh',
    name: 'Nhắc chuẩn bị đầu tuần',
    sumary: 'Thông báo phối hợp chuẩn bị vật dụng học tập.',
  },
  {
    description:
      'Lớp sẽ tổ chức hoạt động ngoại khóa trong tuần này. Giáo viên sẽ cập nhật lịch chi tiết và các lưu ý an toàn đến phụ huynh ngay khi có xác nhận.',
    id: 'event',
    label: 'Hoạt động lớp',
    name: 'Thông báo hoạt động ngoại khóa',
    sumary: 'Thông tin sơ bộ về hoạt động ngoại khóa của lớp.',
  },
]

export function NewsPage() {
  usePageSeo({
    title: 'Bản tin lớp học',
    description:
      'Soạn và đăng bản tin lớp học chuyên nghiệp để cập nhật thông tin nhanh đến phụ huynh.',
    keywords: ['ban tin lop', 'thong bao phu huynh', 'giao vien', 'cimo school'],
  })

  const { activeClass, activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const blogsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassBlogs(activeClassId),
    queryKey: queryKeys.teacher.blogs(activeClassId),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeClassId) {
        throw new Error('Vui lòng chọn lớp trước khi tạo bài viết.')
      }

      return createClassBlog(activeClassId, {
        description: form.description.trim(),
        imgs: form.imgs
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        name: form.name.trim(),
        sumary: form.sumary.trim(),
      })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể đăng bài.'
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Đăng bài thành công.')
      setForm(emptyForm)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.blogs(activeClassId),
      })
    },
  })

  const recentBlogs = useMemo(() => blogsQuery.data ?? [], [blogsQuery.data])
  const latestBlog = recentBlogs[0] ?? null
  const totalAttachments = useMemo(
    () => recentBlogs.reduce((total, item) => total + (item.imgs?.length ?? 0), 0),
    [recentBlogs],
  )
  const imageUrls = useMemo(
    () =>
      form.imgs
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.imgs],
  )

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader title="Truyền thông lớp" subtitle="Soạn và đăng bản tin chuyên nghiệp tới phụ huynh" />

        <ClassSelector
          activeClassId={activeClassId}
          classes={classes}
          isLoading={classesQuery.isLoading}
          onChange={setActiveClassId}
        />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 via-indigo-700 to-blue-700 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconNews className="size-3.5" />
                Bản tin lớp
              </p>
              <p className="text-base font-bold">
                {activeClass ? `Kênh truyền thông của ${activeClass.name}` : 'Vui lòng chọn lớp để bắt đầu'}
              </p>
              <p className="text-sm text-white/85">
                {latestBlog
                  ? `Tin mới nhất: ${formatDateTime(latestBlog.createdDate ?? null)}`
                  : 'Chưa có bản tin trong lớp hiện tại'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Tổng bài</p>
                <p className="text-base font-bold">{recentBlogs.length}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Ảnh đính kèm</p>
                <p className="text-base font-bold">{totalAttachments}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Đang soạn</p>
                <p className="text-base font-bold">{form.name.trim() ? '1' : '0'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mẫu nội dung gợi ý soạn nhanh
          </p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700"
                onClick={() =>
                  setForm({
                    description: template.description,
                    imgs: '',
                    name: template.name,
                    sumary: template.sumary,
                  })
                }
              >
                <IconSparkles className="size-3.5" />
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ui-subtle-panel space-y-3 p-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiêu đề bản tin</p>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ví dụ: Tổng kết tuần học và nhắc chuẩn bị đầu tuần mới"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tóm tắt ngắn</p>
            <Input
              value={form.sumary}
              onChange={(event) => setForm((prev) => ({ ...prev, sumary: event.target.value }))}
              placeholder="1-2 câu ngắn, dễ đọc trên mobile phụ huynh"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nội dung chi tiết</p>
            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mô tả các hoạt động chính, ghi nhận tích cực, thông báo cần phối hợp..."
              className="min-h-28"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ảnh minh họa (mỗi dòng 1 URL)
            </p>
            <Textarea
              value={form.imgs}
              onChange={(event) => setForm((prev) => ({ ...prev, imgs: event.target.value }))}
              placeholder="https://..."
              className="min-h-20"
            />
          </div>

          {imageUrls[0] ? (
            <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-2">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                <IconPhotoPlus className="size-3.5" />
                Xem trước ảnh đầu tiên ({imageUrls.length} URL)
              </p>
              <img src={imageUrls[0]} alt="Xem trước ảnh bản tin" className="h-36 w-full rounded-lg object-cover" loading="lazy" />
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={
              createMutation.isPending ||
              !activeClassId ||
              !form.name.trim() ||
              !form.sumary.trim() ||
              !form.description.trim()
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Đang đăng bài...' : 'Đăng bản tin cho phụ huynh'}
          </Button>
        </div>
      </div>

      <section className="ui-section space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">Danh sách bài đăng</h2>
          <Badge variant="secondary">{recentBlogs.length} bài</Badge>
        </div>

        {blogsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={`news-loading-${index}`} className="ui-subtle-panel space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </article>
            ))}
          </div>
        ) : recentBlogs.length === 0 ? (
          <p className="ui-subtle-panel p-3 text-sm text-muted-foreground">Lớp này chưa có bài đăng nào.</p>
        ) : (
          recentBlogs.map((item) => (
            <article key={item.id} className="ui-subtle-panel space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 font-semibold">{item.name}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                  <IconCalendarClock className="size-3.5" />
                  {formatDateTime(item.createdDate ?? null)}
                </span>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">{item.sumary}</p>
              <p className="line-clamp-3 text-sm">{item.description}</p>

              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">
                  Tin lớp
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                  {item.imgs && item.imgs.length > 0 ? `${item.imgs.length} ảnh đính kèm` : 'Không có ảnh'}
                </span>
              </div>

              {item.imgs && item.imgs.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-border/70 bg-muted/40 p-2">
                  <img src={item.imgs[0]} alt={item.name} className="h-36 w-full rounded-lg object-cover" loading="lazy" />
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>

      {blogsQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Không thể tải danh sách bài đăng.</p>
        </div>
      ) : null}

      <section className="ui-section rounded-2xl p-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <IconNews className="mt-0.5 size-4 shrink-0" />
          <p>Gợi ý chuyên nghiệp: dùng tiêu đề rõ mục đích, tóm tắt ngắn, và luôn có CTA cho phụ huynh ở cuối bản tin.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link to="/leaves?mode=review&status=waiting">
            Mở nhanh đơn nghỉ chờ duyệt
            <IconArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </section>
    </section>
  )
}
