# Phase 03 — Migration: `title`, `is_anonymous`, `anonymous_name`, bảng `hashtag_options`

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md) (Q2, Q3, Q6)
- `supabase/migrations/20260908165400_kudos_schema.sql` (đã apply — KHÔNG sửa)
- `supabase/seeds/dev/001_kudos_dev_seed.sql`

## Overview
- Priority: P1 · Owner: **implementer** (Track B) · Status: blocked (chờ 02)
- Migration cộng thêm, không phá dữ liệu cũ.

## Key Insights
- Cột nội dung tên thật là `content` (kiểu `text`), không phải `text`. Clarifications nói "giữ nguyên kiểu cột text" = không đổi kiểu, không đổi tên.
- `kudos_insert_own` bắt `auth.uid() = sender_id`. Ẩn danh **không** được đụng vào policy này — `sender_id` vẫn lưu thật.
- Hashtag vẫn nằm ở `kudos.hashtags text[]` với check 1..5 sẵn có. Bảng mới chỉ là **nguồn danh sách chọn**, không phải khoá ngoại (Postgres không FK được phần tử mảng, và ép bằng trigger là phức tạp thừa — validate ở server action, phase 04).
- `title` bắt buộc nhưng hàng cũ chưa có → `not null default ''` rồi siết bằng check `char_length(trim(title)) > 0`? Không: hàng cũ sẽ vi phạm. Dùng `not null default ''` và **không** thêm check; bắt buộc ép ở tầng server action + UI. Ghi rõ đây là đánh đổi.

## Requirements
- Cột mới trên `public.kudos`: `title text not null default ''`, `is_anonymous boolean not null default false`, `anonymous_name text`.
- Ràng buộc: `check (not is_anonymous or coalesce(nullif(trim(anonymous_name), ''), null) is not null)` — bật ẩn danh thì phải có tên hiển thị.
- Bảng `public.hashtag_options`: `slug text primary key`, `label text not null`, `sort_order int not null default 0`, `is_active boolean not null default true`. RLS bật, policy `hashtag_options_select_all` cho `anon, authenticated`. Không có policy insert/update/delete (chỉ sửa qua migration).
- Seed 4 slug tạm: `teamwork`, `reliable`, `great-job`, `mentorship`. **Chờ team xác nhận trước khi merge** (unresolved #1).

## Architecture
```
hashtag_options (nguồn chọn, read-only với app)
        │ đọc lúc render composer
        ▼
composer  ──submit──►  create_kudos (phase 04) ── validate slug ∈ hashtag_options ──► kudos.hashtags text[]
kudos: + title, + is_anonymous, + anonymous_name (sender_id giữ nguyên giá trị thật)
```

## Related Code Files
- Tạo: `supabase/migrations/20260911xxxxxx_kudos_title_anonymous_hashtag_options.sql`
- Tạo: `supabase/seeds/dev/002_hashtag_options_seed.sql` (hoặc gộp vào migration nếu danh sách là dữ liệu hệ thống — chọn **gộp vào migration**, vì đây là dữ liệu team định nghĩa chứ không phải seed dev)
- Không sửa: migration cũ, mọi file `src/`

## Implementation Steps
1. Viết migration mới, chỉ `alter table ... add column` + `create table` + `insert ... on conflict do nothing`.
2. `supabase db reset` trên local, xác nhận apply sạch.
3. `psql "$DATABASE_URL" -c "\d public.kudos"` xác nhận 3 cột mới; `select * from public.hashtag_options order by sort_order;` xác nhận 4 hàng.
4. Kiểm chứng RLS: với vai `anon`, `select` trên `hashtag_options` trả về hàng; `insert` bị từ chối.
5. Kiểm chứng check ràng buộc: insert `is_anonymous = true, anonymous_name = null` phải lỗi.
6. Cập nhật `docs/` không làm ở đây — dồn về phase 10.

## Todo List
- [ ] Viết migration
- [ ] `supabase db reset` xanh
- [ ] Xác nhận cột + bảng + seed bằng `psql`
- [ ] Xác nhận RLS select/insert
- [ ] Xác nhận check ẩn danh
- [ ] Xác nhận danh sách hashtag với team (blocking merge)

## Success Criteria
- `supabase db reset` → exit 0
- `psql "$DATABASE_URL" -c "select count(*) from public.hashtag_options"` → `4`
- `psql "$DATABASE_URL" -c "insert into public.kudos(sender_id,receiver_id,content,hashtags,is_anonymous) values ('1111...','2222...','x','{teamwork}',true)"` → exit khác 0 (vi phạm check)
- Suite E2E cũ `e2e/sun-kudos.spec.ts` vẫn xanh sau reset + seed.

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Danh sách hashtag đổi sau khi migration đã apply | Cao | Phải thêm migration nữa | Danh sách nằm trong bảng dữ liệu, thêm/tắt bằng `is_active` chứ không sửa migration cũ |
| `title default ''` cho phép hàng rỗng lọt vào DB | Trung bình | Card hiển thị tiêu đề rỗng | Ép ở phase 04 (server) + phase 06 (UI); card phase 05 ẩn khối tiêu đề khi rỗng |
| Docker/storage layer hỏng làm `supabase start` fail | Cao (đã gặp) | Không verify được | Tạm `[storage] enabled = false`, ghi lại và khôi phục — giống mitigation trong plan 260911-1134 |

## Rollback
Một migration nghịch: `alter table public.kudos drop column title, drop column is_anonymous, drop column anonymous_name; drop table public.hashtag_options;`. Không bao giờ sửa migration đã apply. Dữ liệu mất khi rollback chỉ là tiêu đề + cờ ẩn danh, nội dung kudos không đụng tới.

## Security Considerations
- `is_anonymous` **không phải ẩn danh thật**: `sender_id` vẫn lưu đúng danh tính và `kudos_select_all` cho phép `anon` đọc bảng `kudos` — nghĩa là bất kỳ ai gọi PostgREST đều đọc được `sender_id` của kudos ẩn danh. Đây là ẩn ở tầng hiển thị, đúng như clarifications đã chốt, và **phải ghi rõ trong docs ở phase 10**.
- Nếu muốn ẩn thật về sau: cần view lọc cột hoặc thu hẹp `kudos_select_all` — ngoài phạm vi vòng này.
- `hashtag_options` không có policy ghi → người dùng không tự thêm tag được.

## Next Steps
Mở khoá phase 04.
