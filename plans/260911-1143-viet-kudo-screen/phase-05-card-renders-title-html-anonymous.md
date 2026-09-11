# Phase 05 — Card: tiêu đề, nội dung HTML đã sanitize, tên ẩn danh

## Context Links
- [plan.md](plan.md) · [phase-04](phase-04-sanitize-and-server-actions.md)
- `src/components/kudos/board/kudos-card.tsx`, `board/types.ts`, `board/kudos-card.module.css`

## Overview
- Priority: P1 · Owner: **implementer** (Track B, RED-first) · Status: blocked (chờ 04)
- Card đang render `{kudos.content}` dạng text thuần. Đổi sang HTML → đây là bề mặt XSS, không phải việc trang trí.

## Key Insights
- `kudos-card.tsx` không có `"use client"` nhưng được `KudosBoard` (nhánh của `sun-kudos-client.tsx`, một client component) render → nó nằm trong bundle client. Sanitizer phải chạy được ở client → `isomorphic-dompurify` là lựa chọn đúng.
- Card là surface chung cho cả kudos cũ (không title, không HTML) và kudos mới. Phải chịu được cả hai.
- Ẩn danh chỉ đổi phần hiển thị tên + avatar người gửi. `senderId` vẫn cần cho logic "không tự like bài mình" → giữ nguyên trong `Kudos`.

## Requirements
- `Kudos` (board/types.ts) thêm: `title: string`, `isAnonymous: boolean`, `anonymousName: string | null`, và `content` giờ là HTML string.
- Card render:
  - Khối tiêu đề mới phía trên nội dung; ẩn hoàn toàn khi `title` rỗng (dữ liệu cũ).
  - Nội dung: `dangerouslySetInnerHTML={{ __html: sanitizeKudosHtml(kudos.content) }}`, bọc trong khối có CSS cho `ol/li/blockquote/a/b/i/s`.
  - Khi `isAnonymous`: tên người gửi = `anonymousName` (fallback `card.anonymousFallback` khi rỗng), avatar = ảnh mặc định/placeholder, **không** render `senderAvatarUrl` thật.
  - `isOwnKudos` vẫn tính theo `senderId` thật (người gửi ẩn danh vẫn không tự like bài mình được) — ghi chú rõ trong comment vì đây là rò rỉ suy luận nhỏ: người dùng có thể suy ra mình là tác giả. Chấp nhận, ghi vào docs phase 10.
- `line-clamp` hiện tại áp cho `<p>` text; đổi sang clamp khối HTML mà không vỡ layout với `ol`.

## Architecture
```
KudosRow (phase 04) ──mapKudosRow (phase 09)──► Kudos{title, content(HTML), isAnonymous, anonymousName}
                                                        │
                                         KudosCard ── sanitizeKudosHtml ──► dangerouslySetInnerHTML
                                                        └─ isAnonymous ? anonymousName : senderName
```

## Related Code Files
- Sửa: `src/components/kudos/board/kudos-card.tsx`, `board/types.ts`, `board/kudos-card.module.css`
- Tạo: `src/components/kudos/board/kudos-card.test.tsx` (nếu chưa có test riêng cho card)
- Đọc: `src/lib/kudos/sanitize-kudos-html.ts`
- Không sửa: `src/lib/kudos/**` (phase 04), `src/app/**` (phase 09), `composer/**` (Track A)

## Implementation Steps
1. **RED:** test card với `content = '<b>hi</b><script>alert(1)</script>'` → DOM chứa `<b>`, không chứa `script`; test `title` rỗng → không có khối tiêu đề; test `isAnonymous` → hiện `anonymousName`, không hiện `senderName`; test kudos cũ (không title, content text thuần) vẫn render.
2. Mở rộng `board/types.ts`.
3. Sửa card, thêm CSS cho các thẻ allowlist.
4. Chạy test, `tsc`, `lint`.
5. Kiểm mắt bằng `npm run dev` với seed dev — nhưng **visual validation chính thức thuộc phase 10 / tester**.

## Todo List
- [ ] Test card (đỏ trước) gồm vector XSS
- [ ] Mở rộng `board/types.ts`
- [ ] Render tiêu đề + HTML + ẩn danh
- [ ] CSS cho ol/li/blockquote/a
- [ ] Giữ tương thích kudos cũ

## Success Criteria
- `npm test -- kudos-card` → exit 0, có ít nhất một test khẳng định `script` bị loại.
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0
- `e2e/sun-kudos.spec.ts` (board công khai) vẫn xanh: `npx playwright test e2e/sun-kudos.spec.ts` → exit 0.

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| `dangerouslySetInnerHTML` bị dùng thiếu sanitize ở một nhánh | Trung bình | XSS lưu trữ | Chỉ một nơi duy nhất gọi; thêm eslint comment giải thích; test XSS bắt buộc |
| Đổi `Kudos.content` sang HTML làm vỡ test board cũ | Cao | Suite đỏ | Sửa test cũ trong cùng phase, đây là file thuộc quyền sở hữu của phase |
| `line-clamp` vỡ với danh sách đánh số | Trung bình | Lệch thiết kế | Đo lại với MoMorph MCP ở phase 10, chỉnh CSS |

## Rollback
Revert 3 file board về commit trước. Dữ liệu HTML trong DB vẫn hợp lệ vì card cũ render nó dưới dạng text (xấu nhưng an toàn, không thực thi).

## Security Considerations
- Sanitize lần hai ở render là lớp phòng thủ chính chống hàng bẩn chèn thẳng qua PostgREST (RLS chỉ chặn `sender_id` giả, không kiểm nội dung).
- Ẩn danh chỉ ở tầng hiển thị: `senderId` vẫn nằm trong payload gửi xuống client. Ai mở DevTools/Network đều đọc được. **Phải nêu thẳng trong docs.** Muốn ẩn thật thì phase 04/09 phải lọc `senderId` ở server trước khi gửi — ngoài phạm vi vòng này, ghi thành đề xuất.

## Next Steps
Chờ Track A xong (phase 08) → phase 09 tích hợp.
