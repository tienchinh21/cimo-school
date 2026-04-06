# Parent App Agent Guide

## 1. Context dự án
- Domain: quản lý trường học cho phụ huynh (học sinh, lịch học, điểm danh, thông báo, học phí, v.v.).
- Repo này: frontend dành cho **phụ huynh**.
- Mục tiêu: codebase dễ mở rộng theo module, tách rõ UI và business/data logic, đồng nhất cách gọi API.
- Product shape: **web app** chạy trên trình duyệt.
- UX strategy: **mobile-first bắt buộc** vì phụ huynh chủ yếu dùng điện thoại.

## 2. Tech stack chuẩn
- Runtime/UI: `React 19`, `TypeScript`, `Vite`.
- Styling: `Tailwind CSS v4` + design token trong `src/styles/globals.css`.
- Theme: hỗ trợ **light/dark mode** qua `next-themes` (class-based theme với `.dark`), toggle ở `src/app/components/theme-toggle.tsx`, lưu preference bằng `storageKey="cimo-theme"`.
- Routing: `react-router-dom`.
- Server state: `@tanstack/react-query`.
- Utilities: `lodash` (bắt buộc dùng cho transform/normalize/filter/sort/group dữ liệu).
- UI primitives: `shadcn/ui` nền tảng (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`).

## 3. Kiến trúc core

### 3.1 App shell
- `src/app/providers`: global providers (Router, QueryClientProvider, future: auth/theme providers).
- `src/app/router`: route table và route-level composition.
- `src/app/App.tsx`: app layout shell.

### 3.2 Shared layer
- `src/shared/api`: HTTP client, query keys, API types dùng chung.
- `src/shared/lib`: helper utilities (`cn`, mapper dùng chung, constants parser, date helpers).
- `src/shared/config`: app/site/env config.

### 3.3 Page modules (angular-like)
Mỗi page bắt buộc theo cấu trúc:

```text
src/pages/<page-name>/
  components/
  hooks/
  service/
  types/
  <page-name>-page.tsx
  index.ts
```

- `components/`: component hiển thị của page.
- `hooks/`: hook composition dành riêng cho page (React Query + map sang view model).
- `service/`: nơi xử lý API của page (call `httpRequest`, định nghĩa request/response types).
- `types/`: type cho view model/props của page.
- `<page-name>-page.tsx`: page container.
- `index.ts`: export public API của page module.

### 3.4 UI/UX implementation rules (mobile-first web app)
- Thiết kế từ màn nhỏ trước (`320px`, `360px`, `390px`) rồi mới mở rộng tablet/desktop.
- Tất cả layout dùng breakpoints theo hướng `base -> sm -> md -> lg`, không làm ngược desktop-first.
- Navigation, form, CTA, bảng dữ liệu phải tối ưu thao tác một tay trên mobile.
- Ưu tiên component pattern cho mobile:
  - Danh sách dạng card/stack thay vì table phức tạp ở màn nhỏ.
  - Bottom actions/sticky actions cho thao tác quan trọng.
  - Hit area đủ lớn (tối thiểu ~44px).
- Hiệu năng mobile là mặc định:
  - Hạn chế bundle không cần thiết.
  - Lazy-load theo route/page khi phù hợp.
  - Tránh render thừa và transform nặng trong JSX.

## 4. Quy tắc API bắt buộc

### 4.1 Không gọi fetch trực tiếp trong page/component
- Tuyệt đối không gọi `fetch` trong UI component.
- Mọi request đi qua `src/shared/api/http-client.ts`.

### 4.2 Mỗi API phải có hook
Với mỗi endpoint mới, bắt buộc tạo tối thiểu:
1. API function dùng `httpRequest` trong `src/pages/<page>/service` (hoặc `src/shared/api` nếu dùng chung nhiều page).
2. Hook React Query ở `src/pages/<page>/hooks`.
3. Query key trong `src/shared/api/query-keys.ts`.
4. Page chỉ dùng hook, không gọi thẳng API function.

Ví dụ pattern:

```text
src/pages/students/hooks/use-students-query.ts
src/pages/students/service/get-students.ts
src/pages/students/types/student.types.ts
src/shared/api/query-keys.ts
```

### 4.3 Query key convention
- Dùng object key có namespace theo feature (`students`, `schedule`, `attendance`, `tuition`, ...).
- Ưu tiên factory function cho key động.
- Không hardcode mảng key rải rác trong UI.

### 4.4 Query config convention
- Set `staleTime`, `retry`, `refetchOnWindowFocus` rõ ràng theo nghiệp vụ.
- Mutation thành công phải `invalidateQueries` key liên quan.
- Xử lý error nhất quán qua `ApiError`.

## 5. Quy tắc dùng lodash (bắt buộc)
Dùng `lodash` cho các thao tác dữ liệu không tầm thường:
- `groupBy`: nhóm lịch học theo ngày/lớp/học sinh.
- `orderBy`: sort timeline lịch học, thông báo, công nợ.
- `uniqBy`: khử trùng item theo id.
- `debounce`: search/filter input.
- `keyBy`, `mapValues`: normalize list về map theo id.
- `pick`, `omit`, `isEmpty`, `get`: xử lý payload an toàn.

Nguyên tắc:
- Transform dữ liệu thực hiện ở `pages/*/hooks`, không làm inline trong JSX dài.
- Với transform có thể tái sử dụng, tách qua `src/shared/lib`.

## 6. Luồng logic chuẩn
1. Router vào page module.
2. Page gọi page hook (`src/pages/*/hooks`).
3. Page hook gọi API function ở `src/pages/*/service` (hoặc shared nếu dùng chung).
4. API function dùng `httpRequest` từ `src/shared/api/http-client.ts`.
5. Data trả ngược lên được map (lodash) thành view model trước khi render component.

## 7. Naming conventions
- File: `kebab-case.ts` / `kebab-case.tsx`.
- Hook: `use-<entity>-query.ts`, `use-<page>-page.ts`.
- Types: `<entity>.types.ts` hoặc `<page>.types.ts`.
- Component page-level: `<name>-view.tsx`, `<name>-section.tsx`, `<name>-card.tsx`.

## 8. Checklist khi thêm feature mới
- [ ] Tạo/đặt hook ở `src/pages/<page>/hooks`.
- [ ] Tạo API service ở `src/pages/<page>/service`.
- [ ] Tạo response/request types rõ ràng.
- [ ] Tạo query keys trong shared.
- [ ] Tạo React Query hook cho từng endpoint/mutation trong page module.
- [ ] Dùng lodash để normalize dữ liệu trước khi render.
- [ ] Tạo page module đầy đủ `components/hooks/types/index`.
- [ ] Không để business logic dày trong JSX.
- [ ] Màn hình mới đạt mobile-first trước khi polish desktop.
- [ ] Kiểm tra UI trên viewport mobile phổ biến trước khi merge.
- [ ] `yarn lint` và `yarn build` pass trước khi merge.

## 9. Ưu tiên mở rộng theo domain trường học
Ưu tiên tách module theo domain:
- `students`
- `schedule`
- `attendance`
- `notifications`
- `tuition`
- `profile`

Mỗi domain tuân thủ cùng một chuẩn cấu trúc page-module và shared API như mục 3 và 4.
