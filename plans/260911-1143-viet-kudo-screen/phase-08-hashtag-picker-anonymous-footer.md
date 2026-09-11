# Phase 08 — Hashtag dropdown, ẩn danh, trạng thái footer

test_policy: e2e-red-first

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: /Users/nguyen.danh.thanh/Work/aidd/plans/260911-1143-viet-kudo-screen/clarifications.md
- testPolicy: e2e-red-first

## Context Links
- [plan.md](plan.md) · [phase-07](phase-07-rich-text-editor-toolbar-mention.md)
- Spec E/E.1/E.2, G, H/H.1/H.2 · Test case ID-14..17, 34..36, 53 (hashtag), ID-41..44 (ẩn danh), ID-45 (hủy), ID-48/49 (nút Gửi)

## Overview
- Priority: P1 · Owner: **momorph-ui-implementer** (Track A) · Status: blocked (chờ 07)

## Key Insights
- Hashtag chuyển từ **gõ tự do** sang **chọn từ danh sách cố định** (clarifications Q6) → input hiện tại phải bỏ, không giữ song song. Đây là thay đổi hành vi, test composer cũ sẽ đỏ và phải sửa.
- Danh sách đến qua prop `hashtagOptions` (phase 02). Composer vẫn không fetch.
- Chọn đủ 5 rồi bấm thêm cái thứ 6 → hiện thông điệp "Tối đa 5 hashtag" (ID-53), không im lặng bỏ qua. Ghi chú tĩnh "Tối đa 5" (E.2) là thứ khác, luôn hiển thị.
- Ẩn danh: checkbox mặc định **bỏ chọn**; tick → hiện ô nhập tên hiển thị; bỏ tick → ẩn ô **và xoá giá trị** (ID-43/44).
- "Hủy" luôn bật, đóng và **xoá sạch** state (ID-45). "Gửi" tắt tới khi đủ mọi trường bắt buộc (ID-48/49), có trạng thái loading, đóng modal khi thành công.

## Requirements
- `hashtag-picker.tsx`: nút "+ Hashtag" → menu chọn; chip có nút `x`; ghi chú "Tối đa 5"; chặn trùng; chặn quá 5 kèm thông điệp; tối thiểu 1 để hợp lệ.
- `anonymous-toggle.tsx`: checkbox + ô tên ẩn danh có điều kiện; khi bật thì tên là **bắt buộc**.
- `composer-footer.tsx`: hai nút theo spec H.1/H.2, `disabled` theo `canSubmit`, chữ loading từ `composer.submitting`.
- Cập nhật `use-kudos-composer-state.ts`: `hashtags: string[]` chỉ nhận slug hợp lệ; `isAnonymous`, `anonymousName`; `canSubmit = recipient && title && contentText && hashtags.length>=1 && (!isAnonymous || anonymousName) && !submitting`.
- Payload gửi ra đúng hợp đồng phase 02.

## Architecture
```
hashtagOptions (prop, nguồn: phase 04 list-hashtag-options, nối ở phase 09)
        ▼
hashtag-picker ──► state.hashtags: slug[]
anonymous-toggle ──► state.isAnonymous / state.anonymousName
                      │
              canSubmit ──► composer-footer (Gửi bật/tắt)
                      │
              onSubmit({title, contentHtml, hashtags, isAnonymous, anonymousName, recipientId})
```

## Related Code Files
- Tạo: `hashtag-picker.tsx`, `anonymous-toggle.tsx`, `composer-footer.tsx` (+ css + test)
- Sửa: `kudos-composer.tsx`, `use-kudos-composer-state.ts`, `kudos-composer.module.css`, `kudos-composer.test.tsx`
- **Sở hữu độc quyền:** `src/components/kudos/composer/**`
- Không chạm: `src/lib/**`, `src/app/**`, `board/**`, `src/messages/**`

## Implementation Steps
1. Lấy giá trị thị giác của dropdown, chip, checkbox, hai nút footer từ MoMorph MCP.
2. **RED:** test — thêm hashtag (ID-14), xoá chip (ID-15/16), thêm cái thứ 6 hiện "Tối đa 5 hashtag" (ID-17/53), chọn trùng không nhân đôi (ID-34..36); tick ẩn danh hiện ô tên (ID-41/42), bỏ tick ẩn và xoá (ID-43/44); Hủy xoá sạch (ID-45); Gửi tắt khi thiếu trường (ID-48), bật khi đủ (ID-49).
3. Bỏ input hashtag gõ tự do, dựng `hashtag-picker.tsx`.
4. Dựng `anonymous-toggle.tsx`.
5. Tách `composer-footer.tsx` khỏi shell.
6. Cập nhật `canSubmit` và payload.
7. `npm test -- composer`, `npx tsc --noEmit`, `npm run lint`, `wc -l`.

## Todo List
- [ ] Giá trị thị giác từ MCP
- [ ] Test ID-14..17, 34..36, 53, 41..44, 45, 48, 49 (đỏ trước)
- [ ] `hashtag-picker.tsx` (bỏ gõ tự do)
- [ ] `anonymous-toggle.tsx`
- [ ] `composer-footer.tsx`
- [ ] `canSubmit` + payload theo hợp đồng phase 02
- [ ] Mọi file < 200 dòng

## Success Criteria
- `npm test -- composer` → exit 0, mỗi test case ID ở bước 2 có một test tương ứng.
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0
- `grep -r "hashtagDraft" src/components/kudos/composer/` → không còn kết quả (đã bỏ gõ tự do)
- `wc -l src/components/kudos/composer/*.tsx` — mọi file < 200

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Bỏ gõ tự do làm đỏ test composer cũ và cả `e2e/sun-kudos.spec.ts` | Cao | Suite đỏ ngoài phạm vi | Sửa test composer trong phase này; test E2E board thuộc phase 01/10 — báo tester ngay khi đổi |
| `hashtagOptions` rỗng (chưa nối phase 09) làm không submit nổi | Cao | Nút Gửi không bao giờ bật | Test dùng options mock; trạng thái rỗng hiện thông điệp thay vì menu trống |
| Ẩn danh + nút Gửi: quên tính `anonymousName` vào `canSubmit` | Trung bình | Submit lỗi ở server | Test ID-49 phủ cả nhánh ẩn danh |

## Rollback
Revert thư mục `composer/` về mốc cuối phase 07.

## Security Considerations
- `anonymousName` là text thuần, không HTML. Server vẫn strip lần nữa (phase 04).
- UI **không được** hứa hẹn ẩn danh tuyệt đối. Chữ trên checkbox giữ đúng nguyên văn design; mọi giải thích thêm về giới hạn ẩn danh đặt ở docs (phase 10), không tự thêm chữ vào UI.

## Next Steps
Track A xong. Phase 09 tích hợp với Track B.
