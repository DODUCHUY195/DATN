# Cinema Ticket Frontend - Enterprise Level

Frontend ReactJS + Vite cho hệ thống đặt vé cinema, dùng TailwindCSS, Axios, React Query, Zustand và React Hook Form.

## Tính năng enterprise-level đã thêm
- Admin sidebar collapse
- DataTable có search / sort / filter / bulk actions
- Confirm dialog cho thao tác nhạy cảm
- Toast notification toàn cục
- Dashboard có chart và filter theo 7 / 30 / 90 ngày
- Dark mode
- Form validation bằng Zod + react-hook-form
- Permission matrix / RBAC mock để mở rộng về sau

## Chạy dự án
```bash
npm install
npm run dev
```

## Biến môi trường
Tạo `.env` từ `.env.example`:
```env
VITE_API_URL=http://localhost:3000/api
```

## Gợi ý nâng cấp tiếp
- Tích hợp upload poster thật qua cloud storage
- Server-side pagination / filters
- Audit log cho admin actions
- Export Excel / CSV cho bookings và users
- Multi-tenant cinema management
