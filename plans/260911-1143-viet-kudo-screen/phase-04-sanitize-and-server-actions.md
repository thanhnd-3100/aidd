# Phase 04 — Sanitize HTML + `create-kudos` + `list-hashtag-options`

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md) (Q5 rich text, Q6 hashtag) · [phase-03](phase-03-migration-title-anonymous-hashtag-options.md)
- `src/lib/kudos/create-kudos.ts`, `src/lib/kudos/list-kudos.ts`, `src/lib/kudos/hashtag-bounds.ts`

## Overview
- Priority: P1 · Owner: **implementer** (Track B, RED-first) · Status: blocked (chờ 03)
- Đây là bề mặt XSS của cả tính năng. Làm chậm và kỹ.

## Key Insights
- Repo hiện **không có** thư viện sanitize nào. Tự viết sanitizer HTML là sai lầm kinh điển — đề xuất `isomorphic-dompurify` (chạy được cả server lẫn client, cùng một module dùng chung cho ghi và render).
- Sanitize **hai đầu** là cố ý, không thừa: đầu ghi chặn dữ liệu bẩn vào DB; đầu render bảo vệ những hàng đã có sẵn trong DB (kể cả hàng do người có quyền DB chèn tay).
- `create-kudos.ts` hiện lặp lại hằng số hashtag → thay bằng import từ `hashtag-bounds.ts` (phase 02).
- Validate hashtag phải đối chiếu với `hashtag_options`, không tin client.

## Requirements
- Module mới `src/lib/kudos/sanitize-kudos-html.ts`, thuần (không "use server"), export `sanitizeKudosHtml(html: string): string`.
  - `ALLOWED_TAGS: ['b','strong','i','em','s','strike','ol','li','a','blockquote','br','p']`
  - `ALLOWED_ATTR: ['href','target','rel']`
  - Ép `rel="noopener noreferrer"` khi có `target="_blank"`.
  - Chặn scheme: chỉ `http:`, `https:`, `mailto:`. Loại `javascript:`, `data:`.
  - Trả `''` khi đầu vào rỗng hoặc sau sanitize chỉ còn khoảng trắng.
- `create-kudos.ts` nhận thêm `title`, `isAnonymous`, `anonymousName`, và `content` là HTML.
  - Sanitize `content` → nếu phần text sau strip rỗng → lỗi "Content is required."
  - `title`: trim, bắt buộc, **plain text** (strip toàn bộ tag, không cho HTML).
  - `anonymousName`: trim, plain text, bắt buộc khi `isAnonymous`, bỏ qua khi không.
  - Hashtag: phải 1..5, không trùng, mọi slug ∈ `hashtag_options` đang `is_active`.
  - `sender_id` vẫn lấy từ `auth.getUser()`, không bao giờ từ client.
- Server action mới `src/lib/kudos/list-hashtag-options.ts` → `{ slug, label }[]` theo `sort_order`, chỉ `is_active`.
- `list-kudos.ts` bổ sung `title`, `isAnonymous`, `anonymousName` vào select và `KudosRow`. **Không** trả `sender` khi ẩn danh? — không, vẫn trả (RLS cho đọc), việc ẩn do phase 05 làm ở tầng hiển thị; ghi chú rõ trong doc comment.

## Architecture
```
client payload {title, contentHtml, hashtags[], isAnonymous, anonymousName}
   │
create-kudos (server)
   ├─ auth.getUser() → sender_id thật
   ├─ sanitizeKudosHtml(contentHtml) ──► content
   ├─ stripTags(title).trim()          ──► title
   ├─ hashtags ∩ hashtag_options       ──► hashtags
   └─ insert kudos
                      ▼
list-kudos ──► KudosRow (+title, isAnonymous, anonymousName)
                      ▼
kudos-card (phase 05) ── sanitizeKudosHtml lần hai ──► dangerouslySetInnerHTML
```

## Related Code Files
- Tạo: `src/lib/kudos/sanitize-kudos-html.ts`, `sanitize-kudos-html.test.ts`, `list-hashtag-options.ts`, `list-hashtag-options.test.ts`
- Sửa: `src/lib/kudos/create-kudos.ts` (+ `.test.ts`), `src/lib/kudos/list-kudos.ts` (+ `.test.ts`)
- Sửa: `package.json` (thêm `isomorphic-dompurify`) — cần duyệt, xem Unresolved
- Không sửa: bất cứ gì dưới `src/components/` hoặc `src/app/`

## Implementation Steps
1. **RED trước:** viết `sanitize-kudos-html.test.ts` với các vector: `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `<a href="javascript:alert(1)">`, `<a href="data:text/html,...">`, `<b onclick=...>`, thẻ lồng hợp lệ `<ol><li><b>x</b></li></ol>`, `<blockquote>`, HTML rỗng, chỉ khoảng trắng. Chạy → đỏ.
2. Thêm dependency, cài, viết `sanitize-kudos-html.ts` → xanh.
3. RED cho `create-kudos`: thiếu title, title toàn tag, ẩn danh không tên, hashtag lạ không có trong `hashtag_options`, 6 hashtag, hashtag trùng, content chỉ `<p></p>`. Rồi implement.
4. RED cho `list-hashtag-options`: sắp xếp theo `sort_order`, bỏ hàng `is_active = false`, fail-soft trả `[]` khi Supabase lỗi (đồng bộ phong cách `search-profiles`).
5. Mở rộng `list-kudos` + test.
6. Chạy `npm test -- src/lib/kudos`, `npx tsc --noEmit`, `npm run lint`.

## Todo List
- [ ] Test sanitize (đỏ trước)
- [ ] Duyệt + cài `isomorphic-dompurify`
- [ ] `sanitize-kudos-html.ts`
- [ ] `create-kudos.ts` mở rộng + test
- [ ] `list-hashtag-options.ts` + test
- [ ] `list-kudos.ts` mở rộng + test
- [ ] Bỏ hằng số hashtag lặp, import từ `hashtag-bounds.ts`

## Success Criteria
- `npm test -- src/lib/kudos` → exit 0, và test sanitize phủ đủ 9 vector ở bước 1.
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0
- Kiểm tay: `psql` insert qua action với `content = '<script>x</script><b>hi</b>'` → hàng lưu `<b>hi</b>`, không còn `script`.

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Không được duyệt thêm dependency | Trung bình | Phải tự viết sanitizer | Không tự viết. Fallback: `sanitize-html` (server) + render phía server component — đổi kiến trúc card, phải quay lại planner |
| DOMPurify trên server cần jsdom, tăng bundle | Trung bình | Build chậm/nặng | `isomorphic-dompurify` đã gói sẵn; đo `npm run build` và ghi lại kích thước |
| Sanitize hai đầu lệch cấu hình | Trung bình | Lỗ hổng hoặc nội dung bị nuốt | Một module duy nhất, một hằng allowlist, dùng chung — cấm sao chép cấu hình |
| `title` cho phép HTML lọt qua | Thấp | XSS ở heading card | `title` strip sạch tag, test riêng |

## Rollback
Revert các file `src/lib/kudos/*` về commit trước; gỡ dependency. DB không đụng tới ở phase này nên không có rollback dữ liệu.

## Security Considerations
- **Đầu ghi:** mọi HTML đi vào `kudos.content` đều qua `sanitizeKudosHtml`. Không đường nào khác ghi được vì `kudos_insert_own` chỉ cho authenticated insert với `sender_id = auth.uid()` — nhưng người dùng vẫn có thể gọi PostgREST trực tiếp, bỏ qua server action. **Vì vậy đầu render bắt buộc phải sanitize lại**, không được coi DB là đáng tin.
- **Scheme injection:** `javascript:` và `data:` phải bị loại ở `href`; có test riêng.
- **`target="_blank"`:** luôn kèm `rel="noopener noreferrer"` để chặn reverse tabnabbing.
- **Ẩn danh:** action vẫn ghi `sender_id` thật. Không log `anonymous_name` kèm `sender_id` ra console.

## Next Steps
Mở khoá phase 05.
