# Cimo CMS

Trang quan tri CMS cho he thong Cimo School.

## Tech stack
- React 19 + Vite 8 + TypeScript
- TailwindCSS (UI custom theo huong shadcn)
- TanStack Query
- Zustand
- Axios
- Sonner
- Radix UI

## API backend
- Mac dinh: `https://api.cimoschool.xyz`
- Co the doi bang bien moi truong:

```bash
VITE_API_BASE_URL=https://api.cimoschool.xyz
```

File mau: `.env.example`

## Chuc nang
- Dang nhap CMS bang JWT (`/auth/login`)
- Dashboard thong ke nhanh:
  - So luong nguoi dung, hoc sinh, phu huynh, lop, vai tro, bai viet
  - Trang thai don xin nghi hoc
  - Bai viet va loi chuc gan day
- CRUD day du cho:
  - Nhan su (`/so-users`)
  - Vai tro (`/so-roles`)
  - Lop hoc (`/so-classes`)
  - Hoc sinh (`/so-students`)
  - Phu huynh (`/so-parents`)
  - Don xin nghi (`/so-student-leaves`)
  - Bai viet (`/so-blogs`)
- Quan ly lien ket 2 chieu Phu huynh - Hoc sinh
- Quan ly loi chuc (`/do-wishes`) voi xoa don/xoa hang loat bang verification code
- Server-side search, pagination, sort, bulk delete, CSV export theo trang

## Cai dat va chay
```bash
yarn

yarn workspace cms dev
```

Build production:
```bash
yarn workspace cms build
```

Lint:
```bash
yarn workspace cms lint
```

## Cau truc thu muc chinh
- `src/pages`: cac trang login, dashboard, CRUD, link, wishes
- `src/components/ui`: bo component UI
- `src/components/cms`: table/form engine cho CRUD
- `src/config/resources.tsx`: khai bao schema field/column cho tung module
- `src/services/cms-api.ts`: API layer
- `src/store/auth-store.ts`: state dang nhap

## Luu y
- Token luu trong localStorage (`cimo-cms-auth`).
- Neu API tra ve `401`, ung dung se tu dong clear session va yeu cau dang nhap lai.
