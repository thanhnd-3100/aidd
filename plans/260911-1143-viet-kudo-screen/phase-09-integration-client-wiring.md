# Phase 09 — Tích hợp: `sun-kudos-client` + view model

## Context Links
- [plan.md](plan.md) · [phase-05](phase-05-card-renders-title-html-anonymous.md) · [phase-08](phase-08-hashtag-picker-anonymous-footer.md)
- `src/app/sun-kudos/sun-kudos-client.tsx`, `src/app/sun-kudos/kudos-view-model.ts`, `src/app/sun-kudos/page.tsx`

## Overview
- Priority: P1 · Owner: **implementer** · Status: blocked (chờ 05 + 08)
- Điểm duy nhất nối Track A với Track B. Không phase nào khác được sửa `src/app/sun-kudos/**`.

## Key Insights
- `kudos-view-model.ts` tồn tại riêng vì `sun-kudos-client.tsx` là `"use client"` — Server Component import từ đó sẽ nhận client-reference proxy. Giữ nguyên nguyên tắc này: mọi thứ server cần phải nằm ngoài file `"use client"`.
- `hashtagOptions` nên fetch ở `page.tsx` (Server Component) và truyền xuống, thay vì fetch ở client khi mở modal — ít round-trip, danh sách tĩnh.
- Type `KudosComposerSubmitPayloadV1` deprecated từ phase 02 phải xoá ở đây.

## Requirements
- `page.tsx`: gọi `listHashtagOptions()` song song với `listKudos()`, truyền `hashtagOptions` xuống `SunKudosClient`.
- `SunKudosClient`: nhận `hashtagOptions`, truyền vào `KudosComposer`; `handleSubmit` gọi `createKudos` với payload mới (`title`, `content: payload.contentHtml`, `hashtags`, `isAnonymous`, `anonymousName`).
- `mapKudosRow`: map thêm `title`, `isAnonymous`, `anonymousName`.
- Giữ nguyên hành vi hiện có: refetch trang 1 sau khi gửi, redirect `/login` khi chưa đăng nhập, fail-soft khi like lỗi.
- Xoá type deprecated của phase 02.

## Architecture
```
page.tsx (server)
  ├─ listKudos({offset:0, limit:PAGE_SIZE}) ─► initialKudos (mapKudosRow)
  └─ listHashtagOptions()                   ─► hashtagOptions
            ▼
SunKudosClient (client)
  ├─ KudosBoard ─► KudosCard (title + HTML + ẩn danh)
  └─ KudosComposer (hashtagOptions, onSearchRecipient, onSubmit)
            └─ createKudos(payload) ─► refetch trang 1
```

## Related Code Files
- Sửa: `src/app/sun-kudos/sun-kudos-client.tsx`, `kudos-view-model.ts`, `page.tsx`, `page.test.tsx`, `sun-kudos-client.test.tsx`
- Sửa: `src/components/kudos/composer/types.ts` (chỉ để xoá type deprecated)
- Đọc: `src/lib/kudos/*`, `src/components/kudos/**`

## Implementation Steps
1. **RED:** test `sun-kudos-client` — submit gọi `createKudos` đúng payload mới; `hashtagOptions` được truyền xuống composer; `mapKudosRow` map đủ 3 trường mới.
2. Sửa `page.tsx` fetch song song bằng `Promise.all`.
3. Sửa `mapKudosRow`.
4. Sửa `handleSubmit`.
5. Xoá type deprecated, chạy `npx tsc --noEmit`.
6. `npm test` toàn bộ; `npm run build`.

## Todo List
- [ ] Test tích hợp (đỏ trước)
- [ ] `page.tsx` fetch `hashtagOptions`
- [ ] `mapKudosRow` +3 trường
- [ ] `handleSubmit` payload mới
- [ ] Xoá type deprecated phase 02
- [ ] `npm run build` xanh

## Success Criteria
- `npm test` → exit 0 (toàn bộ suite jest)
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0 · `npm run build` → exit 0
- `grep -rn "KudosComposerSubmitPayloadV1" src/` → rỗng

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Hai track lệch hợp đồng payload | Trung bình | `tsc` đỏ ở đây | Hợp đồng đã chốt ở phase 02; lệch thì sửa phía lệch, không sửa hợp đồng |
| `listHashtagOptions` fail-soft trả `[]` → không gửi được kudos | Trung bình | Tính năng chết lặng | Composer hiện thông điệp khi options rỗng (phase 08); thêm `console.error` ở action |
| Import server action vào client component sai cách | Trung bình | Build đỏ | Theo đúng khuôn hiện có (`"use server"` ở đầu file lib) |

## Rollback
Revert `src/app/sun-kudos/**`. Track A và Track B vẫn nằm đó nhưng không được nối — UI cũ hoạt động lại nếu revert kèm phase 08.

## Security Considerations
- Client gửi `contentHtml` thô; **không** tin. `create-kudos` sanitize (phase 04) và card sanitize lại (phase 05).
- `senderId` không bao giờ lấy từ client — giữ nguyên `auth.getUser()` phía server.
- `hashtagOptions` fetch phía server, nhưng validate slug vẫn phải làm lại ở `create-kudos` (client có thể gửi slug tự chế).

## Next Steps
Phase 10: GREEN + visual validation + docs.
