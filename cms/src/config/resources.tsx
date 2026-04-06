import type { CmsRecord, CmsResourceConfig } from '../types/cms';
import { formatDate, joinNames } from '../lib/utils';
import { Badge } from '../components/ui/badge';

const getNestedName = (value: unknown) => {
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name?: unknown }).name ?? '-');
  }
  return '-';
};

const genderLabel = (value: unknown) => {
  if (typeof value !== 'boolean') {
    return '-';
  }
  return value ? 'Nam' : 'Nữ';
};

const leaveStatusBadge = (value: unknown) => {
  if (value === 'approved') return <Badge variant='success'>Đã duyệt</Badge>;
  if (value === 'reject') return <Badge variant='danger'>Từ chối</Badge>;
  if (value === 'waiting') return <Badge variant='warning'>Đang chờ</Badge>;
  return <Badge variant='secondary'>Không rõ</Badge>;
};

const blogCategoryBadge = (value: unknown) => {
  if (value === 'class') return <Badge variant='secondary'>Lớp học</Badge>;
  if (value === 'student') return <Badge variant='default'>Học sinh</Badge>;
  if (value === 'all') return <Badge variant='success'>Toàn trường</Badge>;
  return <Badge variant='secondary'>Không rõ</Badge>;
};

const localeBadge = (value: unknown) => {
  const locale = String(value ?? '').toLowerCase();
  if (locale === 'vi') return <Badge variant='default'>VI</Badge>;
  if (locale === 'en') return <Badge variant='secondary'>EN</Badge>;
  return <Badge variant='secondary'>-</Badge>;
};

const publishedBadge = (value: unknown) => {
  if (value === true) return <Badge variant='success'>Published</Badge>;
  if (value === false) return <Badge variant='warning'>Draft</Badge>;
  return <Badge variant='secondary'>-</Badge>;
};

const leadStatusBadge = (value: unknown) => {
  if (value === 'new') return <Badge variant='warning'>Mới</Badge>;
  if (value === 'processing') return <Badge variant='default'>Đang xử lý</Badge>;
  if (value === 'closed') return <Badge variant='success'>Đã đóng</Badge>;
  return <Badge variant='secondary'>-</Badge>;
};

const formatCurrencyVnd = (value: unknown) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '-';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
};

const landingBlogCategoryBadge = (value: unknown) => {
  if (value === 'Study Tips') return <Badge variant='secondary'>Study Tips</Badge>;
  if (value === 'Career') return <Badge variant='default'>Career</Badge>;
  if (value === 'STEM') return <Badge variant='success'>STEM</Badge>;
  if (value === 'Language') return <Badge variant='warning'>Language</Badge>;
  return <Badge variant='secondary'>Không rõ</Badge>;
};

const stripEmptyValues = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  Object.keys(next).forEach((key) => {
    const value = next[key];

    if (typeof value === 'string' && value.trim() === '') {
      delete next[key];
      return;
    }

    if (Array.isArray(value) && value.length === 0) {
      delete next[key];
    }
  });
  return next;
};

const normalizeLandingPayload = (numericFields: string[] = []) => (payload: Record<string, unknown>) => {
  const next = stripEmptyValues(payload);
  numericFields.forEach((field) => {
    const value = next[field];
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        next[field] = num;
      }
    }
  });
  return next;
};

const localeOptions = [
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'English', value: 'en' },
];

const publishOptions = [
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' },
];

const users: CmsResourceConfig = {
  key: 'users',
  title: 'Nhân sự',
  subtitle: 'Quản lý tài khoản nội bộ đăng nhập CMS',
  endpoint: '/so-users',
  countEndpoint: '/so-users/count',
  includeRelations: ['soRoles'],
  searchFields: ['username', 'name', 'phone', 'email', 'nationalId'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'username', label: 'Tài khoản' },
    { key: 'name', label: 'Họ tên' },
    { key: 'phone', label: 'Điện thoại' },
    {
      key: 'soRoles',
      label: 'Vai trò',
      sortable: false,
      render: (row) => joinNames(row.soRoles, 'Chưa gán'),
    },
    {
      key: 'createdDate',
      label: 'Ngày tạo',
      render: (row) => formatDate(row.createdDate),
    },
  ],
  fields: [
    { key: 'username', label: 'Tên đăng nhập', type: 'text', required: true, description: 'Dùng để đăng nhập CMS.' },
    {
      key: 'password',
      label: 'Mật khẩu',
      type: 'password',
      required: true,
      onlyOnCreate: true,
      description: 'Mật khẩu khởi tạo cho tài khoản nhân sự.',
    },
    {
      key: 'password',
      label: 'Mật khẩu mới',
      type: 'password',
      onlyOnEdit: true,
      description: 'Nhập để reset mật khẩu đăng nhập. Để trống nếu không đổi.',
    },
    { key: 'name', label: 'Họ và tên', type: 'text' },
    { key: 'phone', label: 'Số điện thoại', type: 'text' },
    { key: 'nationalId', label: 'CCCD', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'address', label: 'Địa chỉ', type: 'textarea' },
    { key: 'avt', label: 'Avatar URL', type: 'text' },
    { key: 'dob', label: 'Ngày sinh', type: 'date' },
    {
      key: 'soRoleIds',
      label: 'Vai trò',
      type: 'multi-select',
      reference: 'roles',
      description: 'Có thể chọn nhiều vai trò cho một tài khoản.',
    },
  ],
  normalizePayload: stripEmptyValues,
};

const roles: CmsResourceConfig = {
  key: 'roles',
  title: 'Vai trò',
  subtitle: 'Khai báo nhóm quyền cho hệ thống',
  endpoint: '/so-roles',
  countEndpoint: '/so-roles/count',
  searchFields: ['name'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Tên vai trò' },
    {
      key: 'createdDate',
      label: 'Ngày tạo',
      render: (row) => formatDate(row.createdDate),
    },
  ],
  fields: [{ key: 'name', label: 'Tên vai trò', type: 'text', required: true }],
};

const classes: CmsResourceConfig = {
  key: 'classes',
  title: 'Lớp học',
  subtitle: 'Quản lý danh sách lớp và số học sinh',
  endpoint: '/so-classes',
  countEndpoint: '/so-classes/count',
  includeRelations: ['soStudents', 'soUsers'],
  searchFields: ['name'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Tên lớp' },
    {
      key: 'fromDate',
      label: 'Từ ngày',
      render: (row) => formatDate(row.fromDate),
    },
    {
      key: 'toDate',
      label: 'Đến ngày',
      render: (row) => formatDate(row.toDate),
    },
    {
      key: 'costPerSession',
      label: 'Chi phí/buổi',
      render: (row) => formatCurrencyVnd(row.costPerSession),
    },
    {
      key: 'soStudents',
      label: 'Sĩ số',
      sortable: false,
      render: (row) => (Array.isArray(row.soStudents) ? row.soStudents.length : 0),
    },
    {
      key: 'createdDate',
      label: 'Ngày tạo',
      render: (row) => formatDate(row.createdDate),
    },
  ],
  fields: [
    { key: 'name', label: 'Tên lớp', type: 'text', required: true },
    {
      key: 'studentIds',
      label: 'Học sinh',
      type: 'multi-select',
      reference: 'students',
      description: 'Có thể chọn nhiều học sinh để thêm vào lớp ngay khi tạo.',
    },
    {
      key: 'teacherIds',
      label: 'Giáo viên',
      type: 'multi-select',
      reference: 'users',
      description: 'Có thể chọn nhiều giáo viên chủ nhiệm.',
    },
    { key: 'fromDate', label: 'Từ ngày', type: 'date', required: true },
    { key: 'toDate', label: 'Đến ngày', type: 'date', required: true },
    { key: 'costPerSession', label: 'Chi phí/buổi (VNĐ)', type: 'text', required: true },
  ],
  normalizePayload: (payload) => {
    const next = stripEmptyValues(payload);
    const rawCost = next.costPerSession;
    if (typeof rawCost === 'string' && rawCost.trim()) {
      const parsed = Number(rawCost);
      if (!Number.isNaN(parsed)) {
        next.costPerSession = parsed;
      }
    }
    return next;
  },
};

const students: CmsResourceConfig = {
  key: 'students',
  title: 'Học sinh',
  subtitle: 'Theo dõi hồ sơ học sinh theo lớp',
  endpoint: '/so-students',
  countEndpoint: '/so-students/count',
  includeRelations: ['soClass', 'parents'],
  searchFields: ['name', 'phone', 'email', 'nationalId'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Họ tên' },
    {
      key: 'gender',
      label: 'Giới tính',
      render: (row) => genderLabel(row.gender),
    },
    {
      key: 'soClass',
      label: 'Lớp',
      sortable: false,
      render: (row) => getNestedName(row.soClass),
    },
    {
      key: 'parents',
      label: 'Phụ huynh',
      sortable: false,
      render: (row) => joinNames(row.parents, 'Chưa liên kết'),
    },
    {
      key: 'dob',
      label: 'Ngày sinh',
      render: (row) => formatDate(row.dob),
    },
  ],
  fields: [
    { key: 'name', label: 'Họ và tên', type: 'text', required: true },
    {
      key: 'gender',
      label: 'Giới tính',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'Nam', value: 'true' },
        { label: 'Nữ', value: 'false' },
      ],
    },
    { key: 'dob', label: 'Ngày sinh', type: 'date', required: true },
    { key: 'soClassId', label: 'Lớp học', type: 'select', reference: 'classes' },
    { key: 'phone', label: 'Số điện thoại', type: 'text' },
    { key: 'nationalId', label: 'Mã định danh', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'address', label: 'Địa chỉ', type: 'textarea' },
    { key: 'avt', label: 'Avatar URL', type: 'text' },
  ],
  normalizePayload: stripEmptyValues,
};

const parents: CmsResourceConfig = {
  key: 'parents',
  title: 'Phụ huynh',
  subtitle: 'Theo dõi thông tin liên hệ và quan hệ với học sinh',
  endpoint: '/so-parents',
  countEndpoint: '/so-parents/count',
  includeRelations: ['students'],
  searchFields: ['name', 'phone', 'email', 'nationalId', 'relation', 'job'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Họ tên' },
    {
      key: 'relation',
      label: 'Quan hệ',
    },
    {
      key: 'gender',
      label: 'Giới tính',
      render: (row) => genderLabel(row.gender),
    },
    { key: 'phone', label: 'Điện thoại' },
    {
      key: 'students',
      label: 'Học sinh',
      sortable: false,
      render: (row) => joinNames(row.students, 'Chưa liên kết'),
    },
  ],
  fields: [
    { key: 'name', label: 'Họ và tên', type: 'text', required: true },
    {
      key: 'gender',
      label: 'Giới tính',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'Nam', value: 'true' },
        { label: 'Nữ', value: 'false' },
      ],
    },
    { key: 'phone', label: 'Số điện thoại', type: 'text', required: true },
    { key: 'nationalId', label: 'CCCD', type: 'text', required: true },
    { key: 'relation', label: 'Quan hệ', type: 'text', required: true },
    { key: 'dob', label: 'Ngày sinh', type: 'date' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'job', label: 'Nghề nghiệp', type: 'text' },
    { key: 'address', label: 'Địa chỉ', type: 'textarea' },
    { key: 'avt', label: 'Avatar URL', type: 'text' },
  ],
  normalizePayload: stripEmptyValues,
};

const studentLeaves: CmsResourceConfig = {
  key: 'student-leaves',
  title: 'Xin nghỉ học',
  subtitle: 'Duyệt và theo dõi đơn nghỉ học của học sinh',
  endpoint: '/so-student-leaves',
  countEndpoint: '/so-student-leaves/count',
  includeRelations: ['soParent', 'soStudent', 'soUser'],
  searchFields: ['leaveStatus', 'reason'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    {
      key: 'leaveStatus',
      label: 'Trạng thái',
      render: (row) => leaveStatusBadge(row.leaveStatus),
    },
    {
      key: 'soStudent',
      label: 'Học sinh',
      sortable: false,
      render: (row) => getNestedName(row.soStudent),
    },
    {
      key: 'soParent',
      label: 'Phụ huynh',
      sortable: false,
      render: (row) => getNestedName(row.soParent),
    },
    {
      key: 'leaveStartDate',
      label: 'Từ ngày',
      render: (row) => formatDate(row.leaveStartDate),
    },
    {
      key: 'leaveEndDate',
      label: 'Đến ngày',
      render: (row) => formatDate(row.leaveEndDate),
    },
  ],
  fields: [
    {
      key: 'leaveStatus',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      options: [
        { label: 'Đang chờ', value: 'waiting' },
        { label: 'Đã duyệt', value: 'approved' },
        { label: 'Từ chối', value: 'reject' },
      ],
    },
    { key: 'leaveStartDate', label: 'Ngày bắt đầu nghỉ', type: 'date', required: true },
    { key: 'leaveEndDate', label: 'Ngày kết thúc nghỉ', type: 'date', required: true },
    { key: 'reason', label: 'Lý do nghỉ', type: 'textarea', required: true },
    { key: 'soStudentId', label: 'Học sinh', type: 'select', reference: 'students', required: true },
    { key: 'soParentId', label: 'Phụ huynh', type: 'select', reference: 'parents', required: true },
    { key: 'soUserId', label: 'Người duyệt', type: 'select', reference: 'users' },
  ],
};

const blogs: CmsResourceConfig = {
  key: 'blogs',
  title: 'Bài viết',
  subtitle: 'Quản lý tin tức và bài thông báo của trường',
  endpoint: '/so-blogs',
  countEndpoint: '/so-blogs/count',
  searchFields: ['name', 'sumary', 'description', 'category'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Tiêu đề' },
    {
      key: 'category',
      label: 'Danh mục',
      render: (row) => blogCategoryBadge(row.category),
    },
    {
      key: 'relateIds',
      label: 'Số mục liên kết',
      sortable: false,
      render: (row) => (Array.isArray(row.relateIds) ? row.relateIds.length : 0),
    },
    {
      key: 'createdDate',
      label: 'Ngày tạo',
      render: (row) => formatDate(row.createdDate),
    },
  ],
  fields: [
    { key: 'name', label: 'Tiêu đề', type: 'text', required: true },
    { key: 'sumary', label: 'Tóm tắt', type: 'textarea', required: true },
    {
      key: 'category',
      label: 'Danh mục',
      type: 'select',
      required: true,
      options: [
        { label: 'Toàn trường', value: 'all' },
        { label: 'Theo lớp', value: 'class' },
        { label: 'Theo học sinh', value: 'student' },
      ],
    },
    {
      key: 'imgs',
      label: 'Danh sách ảnh',
      type: 'array',
      description: 'Mỗi dòng một URL ảnh.',
    },
    {
      key: 'relateIds',
      label: 'ID liên kết',
      type: 'array',
      description: 'Mỗi dòng một ID lớp hoặc ID học sinh theo category.',
    },
    { key: 'description', label: 'Nội dung', type: 'textarea', required: true },
  ],
  normalizePayload: stripEmptyValues,
};

const landingPageSeo: CmsResourceConfig = {
  key: 'landing-page-seo',
  title: 'Landing SEO',
  subtitle: 'Quản lý SEO cho các trang landing theo locale',
  endpoint: '/lad-page-seos',
  countEndpoint: '/lad-page-seos/count',
  searchFields: ['title', 'description', 'path', 'pageKey'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'pageKey', label: 'Page' },
    { key: 'title', label: 'Title' },
    { key: 'path', label: 'Path' },
    { key: 'noIndex', label: 'Index', render: (row) => (row.noIndex ? <Badge variant='warning'>NoIndex</Badge> : <Badge variant='success'>Index</Badge>) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    {
      key: 'pageKey',
      label: 'Page key',
      type: 'select',
      required: true,
      options: [
        { label: 'home', value: 'home' },
        { label: 'about', value: 'about' },
        { label: 'blog', value: 'blog' },
        { label: 'blogPost', value: 'blogPost' },
        { label: 'courses', value: 'courses' },
        { label: 'course', value: 'course' },
        { label: 'registration', value: 'registration' },
        { label: 'contacts', value: 'contacts' },
        { label: 'recruitment', value: 'recruitment' },
      ],
    },
    { key: 'title', label: 'SEO title', type: 'text', required: true },
    { key: 'description', label: 'SEO description', type: 'textarea', required: true },
    { key: 'path', label: 'Path', type: 'text', required: true },
    { key: 'seoKeywords', label: 'SEO keywords', type: 'seo-keywords' },
    { key: 'ogImage', label: 'OG image', type: 'image' },
    {
      key: 'noIndex',
      label: 'No index',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'No', value: 'false' },
        { label: 'Yes', value: 'true' },
      ],
    },
  ],
  normalizePayload: normalizeLandingPayload(),
};

const landingCourses: CmsResourceConfig = {
  key: 'landing-courses',
  title: 'Landing Courses',
  subtitle: 'Quản lý khóa học hiển thị trên landing',
  endpoint: '/lad-courses',
  countEndpoint: '/lad-courses/count',
  searchFields: ['courseId', 'title', 'description', 'level', 'relatedTrackId'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'courseId', label: 'Course ID' },
    { key: 'title', label: 'Title' },
    { key: 'level', label: 'Level' },
    { key: 'seatsLeft', label: 'Seats' },
    { key: 'isPublished', label: 'Publish', render: (row) => publishedBadge(row.isPublished) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'courseId', label: 'Course ID', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'overview', label: 'Overview', type: 'textarea', required: true },
    { key: 'outcomes', label: 'Outcomes', type: 'array', required: true, description: 'Mỗi dòng 1 outcome.' },
    { key: 'modules', label: 'Modules', type: 'array', required: true, description: 'Mỗi dòng 1 module.' },
    { key: 'audience', label: 'Audience', type: 'textarea', required: true },
    { key: 'delivery', label: 'Delivery', type: 'text', required: true },
    { key: 'relatedTrackId', label: 'Related Track ID', type: 'text', required: true },
    { key: 'duration', label: 'Duration', type: 'text', required: true },
    {
      key: 'level',
      label: 'Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced', value: 'Advanced' },
      ],
    },
    { key: 'seatsLeft', label: 'Seats Left', type: 'text', required: true },
    {
      key: 'comingSoon',
      label: 'Coming soon',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'No', value: 'false' },
        { label: 'Yes', value: 'true' },
      ],
    },
    { key: 'orderIndex', label: 'Order', type: 'text' },
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'imageAlt', label: 'Image Alt', type: 'text' },
    { key: 'seoTitle', label: 'SEO title', type: 'text' },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
    { key: 'seoKeywords', label: 'SEO keywords', type: 'seo-keywords' },
    {
      key: 'isPublished',
      label: 'Publish',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: publishOptions,
    },
  ],
  normalizePayload: normalizeLandingPayload(['seatsLeft', 'orderIndex']),
};

const landingTestimonials: CmsResourceConfig = {
  key: 'landing-testimonials',
  title: 'Landing Testimonials',
  subtitle: 'Quản lý testimonials của landing',
  endpoint: '/lad-testimonials',
  countEndpoint: '/lad-testimonials/count',
  searchFields: ['testimonialId', 'name', 'role', 'quote'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'testimonialId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'improvement', label: 'Improvement' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'testimonialId', label: 'ID', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text', required: true },
    { key: 'quote', label: 'Quote', type: 'textarea', required: true },
    { key: 'improvement', label: 'Improvement', type: 'text', required: true },
    { key: 'avatar', label: 'Avatar', type: 'image' },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingTrialSessions: CmsResourceConfig = {
  key: 'landing-trial-sessions',
  title: 'Landing Trial Sessions',
  subtitle: 'Quản lý lịch học thử hiển thị ở hero',
  endpoint: '/lad-trial-sessions',
  countEndpoint: '/lad-trial-sessions/count',
  searchFields: ['sessionId', 'title', 'dateTime', 'mode'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'sessionId', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'dateTime', label: 'Date Time' },
    { key: 'seats', label: 'Seats' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'sessionId', label: 'ID', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'dateTime', label: 'Date Time Label', type: 'text', required: true },
    { key: 'mode', label: 'Mode', type: 'text', required: true },
    { key: 'seats', label: 'Seats Text', type: 'text', required: true },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingSocialMetrics: CmsResourceConfig = {
  key: 'landing-social-metrics',
  title: 'Landing Social Metrics',
  subtitle: 'Quản lý social proof metrics',
  endpoint: '/lad-social-metrics',
  countEndpoint: '/lad-social-metrics/count',
  searchFields: ['metricId', 'label', 'value'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'metricId', label: 'ID' },
    { key: 'label', label: 'Label' },
    { key: 'value', label: 'Value' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'metricId', label: 'ID', type: 'text', required: true },
    { key: 'label', label: 'Label', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'text', required: true },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingMethodSteps: CmsResourceConfig = {
  key: 'landing-method-steps',
  title: 'Landing Method Steps',
  subtitle: 'Quản lý flow phương pháp học',
  endpoint: '/lad-method-steps',
  countEndpoint: '/lad-method-steps/count',
  searchFields: ['stepId', 'title', 'phase', 'navLabel'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'stepId', label: 'ID' },
    { key: 'phase', label: 'Phase' },
    { key: 'title', label: 'Title' },
    { key: 'icon', label: 'Icon' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'stepId', label: 'ID', type: 'text', required: true },
    { key: 'phase', label: 'Phase', type: 'text', required: true },
    { key: 'navLabel', label: 'Nav Label', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'signal', label: 'Signal', type: 'textarea', required: true },
    { key: 'coachNote', label: 'Coach Note', type: 'textarea', required: true },
    {
      key: 'icon',
      label: 'Icon',
      type: 'select',
      required: true,
      options: [
        { label: 'diagnostic', value: 'diagnostic' },
        { label: 'roadmap', value: 'roadmap' },
        { label: 'practice', value: 'practice' },
        { label: 'launch', value: 'launch' },
      ],
    },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingTeamMilestones: CmsResourceConfig = {
  key: 'landing-team-milestones',
  title: 'Landing Team Timeline',
  subtitle: 'Quản lý mốc thời gian đội ngũ',
  endpoint: '/lad-team-milestones',
  countEndpoint: '/lad-team-milestones/count',
  searchFields: ['milestoneId', 'year', 'title', 'description'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'milestoneId', label: 'ID' },
    { key: 'year', label: 'Year' },
    { key: 'title', label: 'Title' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'milestoneId', label: 'ID', type: 'text', required: true },
    { key: 'year', label: 'Year', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingAboutMetrics: CmsResourceConfig = {
  key: 'landing-about-metrics',
  title: 'Landing About Metrics',
  subtitle: 'Quản lý metric phần About',
  endpoint: '/lad-about-metrics',
  countEndpoint: '/lad-about-metrics/count',
  searchFields: ['metricId', 'label', 'value', 'detail'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'metricId', label: 'ID' },
    { key: 'label', label: 'Label' },
    { key: 'value', label: 'Value' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'metricId', label: 'ID', type: 'text', required: true },
    { key: 'value', label: 'Value', type: 'text', required: true },
    { key: 'label', label: 'Label', type: 'text', required: true },
    { key: 'detail', label: 'Detail', type: 'textarea', required: true },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingAboutPillars: CmsResourceConfig = {
  key: 'landing-about-pillars',
  title: 'Landing About Pillars',
  subtitle: 'Quản lý các pillar phần About',
  endpoint: '/lad-about-pillars',
  countEndpoint: '/lad-about-pillars/count',
  searchFields: ['pillarId', 'title', 'description', 'icon'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'pillarId', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'icon', label: 'Icon' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'pillarId', label: 'ID', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    {
      key: 'icon',
      label: 'Icon',
      type: 'select',
      required: true,
      options: [
        { label: 'roadmap', value: 'roadmap' },
        { label: 'mentoring', value: 'mentoring' },
        { label: 'outcome', value: 'outcome' },
      ],
    },
    { key: 'orderIndex', label: 'Order', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingRecruitmentTracks: CmsResourceConfig = {
  key: 'landing-recruitment-tracks',
  title: 'Landing Recruitment Tracks',
  subtitle: 'Quản lý track tuyển sinh landing',
  endpoint: '/lad-recruitment-tracks',
  countEndpoint: '/lad-recruitment-tracks/count',
  searchFields: ['trackId', 'name', 'description', 'status', 'location'],
  defaultOrder: ['orderIndex ASC', 'createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'trackId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'isPublished', label: 'Publish', render: (row) => publishedBadge(row.isPublished) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'trackId', label: 'Track ID', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Limited', value: 'Limited' },
        { label: 'Waitlist', value: 'Waitlist' },
      ],
    },
    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'courseIds', label: 'Courses', type: 'multi-select', reference: 'ladCourses', required: true },
    { key: 'orderIndex', label: 'Order', type: 'text' },
    { key: 'seoTitle', label: 'SEO title', type: 'text' },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
    { key: 'seoKeywords', label: 'SEO keywords', type: 'seo-keywords' },
    {
      key: 'isPublished',
      label: 'Publish',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: publishOptions,
    },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingBlogs: CmsResourceConfig = {
  key: 'landing-blogs',
  title: 'Landing Blogs',
  subtitle: 'Quản lý blog landing (soạn thảo richtext)',
  endpoint: '/lad-blogs',
  countEndpoint: '/lad-blogs/count',
  searchFields: ['slug', 'title', 'excerpt', 'category', 'author'],
  defaultOrder: ['publishedAt DESC', 'orderIndex ASC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'slug', label: 'Slug' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category', render: (row) => landingBlogCategoryBadge(row.category) },
    { key: 'isPublished', label: 'Publish', render: (row) => publishedBadge(row.isPublished) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'slug', label: 'Slug', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
    { key: 'content', label: 'Content', type: 'richtext', required: true },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { label: 'Study Tips', value: 'Study Tips' },
        { label: 'Career', value: 'Career' },
        { label: 'STEM', value: 'STEM' },
        { label: 'Language', value: 'Language' },
      ],
    },
    { key: 'author', label: 'Author', type: 'text', required: true },
    { key: 'publishedAt', label: 'Published Date', type: 'date', required: true },
    { key: 'readingTime', label: 'Reading Time (minutes)', type: 'text', required: true },
    { key: 'image', label: 'Image', type: 'image', required: true },
    { key: 'imageAlt', label: 'Image Alt', type: 'text' },
    { key: 'seoTitle', label: 'SEO title', type: 'text' },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
    { key: 'seoKeywords', label: 'SEO keywords', type: 'seo-keywords' },
    { key: 'orderIndex', label: 'Order', type: 'text' },
    {
      key: 'isPublished',
      label: 'Publish',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: publishOptions,
    },
  ],
  normalizePayload: normalizeLandingPayload(['orderIndex']),
};

const landingAssets: CmsResourceConfig = {
  key: 'landing-assets',
  title: 'Landing Assets',
  subtitle: 'Danh sách ảnh/tệp đã upload cho landing',
  endpoint: '/lad-assets',
  creatable: false,
  countEndpoint: '/lad-assets/count',
  searchFields: ['fileName', 'mimeType', 'publicUrl'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'locale', label: 'Locale', render: (row) => localeBadge(row.locale) },
    { key: 'fileName', label: 'File' },
    { key: 'mimeType', label: 'Mime' },
    { key: 'size', label: 'Size (B)' },
    { key: 'publicUrl', label: 'Public URL' },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', options: localeOptions },
    { key: 'publicUrl', label: 'Public URL', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'alt', label: 'Alt', type: 'text' },
  ],
  normalizePayload: normalizeLandingPayload(['size']),
};

const landingRegistrationLeads: CmsResourceConfig = {
  key: 'landing-registration-leads',
  title: 'Landing Registration Leads',
  subtitle: 'Theo dõi form đăng ký học thử từ landing',
  endpoint: '/lad-registration-leads',
  countEndpoint: '/lad-registration-leads/count',
  searchFields: ['fullName', 'email', 'phone', 'targetProgram', 'status'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'targetProgram', label: 'Program' },
    { key: 'status', label: 'Status', render: (row) => leadStatusBadge(row.status) },
    { key: 'createdDate', label: 'Created', render: (row) => formatDate(row.createdDate) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'fullName', label: 'Họ tên', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: true },
    { key: 'educationLevel', label: 'Education level', type: 'text', required: true },
    { key: 'targetProgram', label: 'Target program', type: 'text', required: true },
    { key: 'preferredSchedule', label: 'Preferred schedule', type: 'text', required: true },
    { key: 'goals', label: 'Goals', type: 'textarea', required: true },
    {
      key: 'consent',
      label: 'Consent',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'new', value: 'new' },
        { label: 'processing', value: 'processing' },
        { label: 'closed', value: 'closed' },
      ],
    },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  normalizePayload: normalizeLandingPayload(),
};

const landingContactLeads: CmsResourceConfig = {
  key: 'landing-contact-leads',
  title: 'Landing Contact Leads',
  subtitle: 'Theo dõi form liên hệ từ landing',
  endpoint: '/lad-contact-leads',
  countEndpoint: '/lad-contact-leads/count',
  searchFields: ['name', 'email', 'subject', 'status'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', render: (row) => leadStatusBadge(row.status) },
    { key: 'createdDate', label: 'Created', render: (row) => formatDate(row.createdDate) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'subject', label: 'Subject', type: 'text', required: true },
    { key: 'message', label: 'Message', type: 'textarea', required: true },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'new', value: 'new' },
        { label: 'processing', value: 'processing' },
        { label: 'closed', value: 'closed' },
      ],
    },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  normalizePayload: normalizeLandingPayload(),
};

const landingRecruitmentLeads: CmsResourceConfig = {
  key: 'landing-recruitment-leads',
  title: 'Landing Recruitment Leads',
  subtitle: 'Theo dõi form tuyển sinh từ landing',
  endpoint: '/lad-recruitment-leads',
  countEndpoint: '/lad-recruitment-leads/count',
  searchFields: ['fullName', 'email', 'phone', 'trackId', 'courseId', 'status'],
  defaultOrder: ['createdDate DESC'],
  columns: [
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'trackId', label: 'Track' },
    { key: 'courseId', label: 'Course' },
    { key: 'status', label: 'Status', render: (row) => leadStatusBadge(row.status) },
    { key: 'createdDate', label: 'Created', render: (row) => formatDate(row.createdDate) },
  ],
  fields: [
    { key: 'locale', label: 'Locale', type: 'select', required: true, options: localeOptions },
    { key: 'fullName', label: 'Họ tên', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: true },
    { key: 'studentLevel', label: 'Student level', type: 'text', required: true },
    { key: 'trackId', label: 'Track ID', type: 'text', required: true },
    { key: 'courseId', label: 'Course ID', type: 'text', required: true },
    { key: 'goals', label: 'Goals', type: 'textarea', required: true },
    {
      key: 'consent',
      label: 'Consent',
      type: 'select',
      required: true,
      valueType: 'boolean',
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'new', value: 'new' },
        { label: 'processing', value: 'processing' },
        { label: 'closed', value: 'closed' },
      ],
    },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  normalizePayload: normalizeLandingPayload(),
};

export const cmsResources: CmsResourceConfig[] = [
  users,
  roles,
  classes,
  students,
  parents,
  studentLeaves,
  blogs,
  landingPageSeo,
  landingCourses,
  landingTestimonials,
  landingTrialSessions,
  landingSocialMetrics,
  landingMethodSteps,
  landingTeamMilestones,
  landingAboutMetrics,
  landingAboutPillars,
  landingRecruitmentTracks,
  landingBlogs,
  landingAssets,
  landingRegistrationLeads,
  landingContactLeads,
  landingRecruitmentLeads,
];

export const cmsResourceMap = cmsResources.reduce<Record<string, CmsResourceConfig>>((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

export const findRecordId = (record: CmsRecord) => String(record.id);
