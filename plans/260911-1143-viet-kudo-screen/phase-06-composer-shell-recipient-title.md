# Phase 06 — Composer: tách module, recipient picker, danh hiệu, lỗi inline

test_policy: e2e-red-first

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: /Users/nguyen.danh.thanh/Work/aidd/plans/260911-1143-viet-kudo-screen/clarifications.md
- testPolicy: e2e-red-first

## Context Links
- [plan.md](plan.md) · [phase-02](phase-02-shared-contracts-and-i18n-keys.md) (hợp đồng types + testid) · [reports/red-evidence.md](reports/red-evidence.md)
- `src/components/kudos/composer/kudos-composer.tsx` (247 dòng, sẽ tách)

## Overview
- Priority: P1 · Owner: **momorph-ui-implementer** (Track A) · Status: blocked (chờ 02 + RED)
- Thuần presentational. Không gọi Supabase, không server action. Mọi dữ liệu đến qua props.

## Key Insights
- **Không đoán giá trị thị giác.** Gọi `get_frame(ihQ26W78P2)` qua MoMorph MCP để lấy đúng màu, khoảng cách, bo góc, cỡ chữ. Con số trong digest (border `#998C5F`, radius 8px, cao 56px, input 514x56, asterisk bold 22px) là tham chiếu, MCP mới là nguồn thật.
- Composer hiện 247 dòng và sẽ phình gấp nhiều lần nếu nhồi thêm rich text + hashtag + ẩn danh → **bắt buộc tách file ngay ở phase này**, trước khi thêm tính năng, không phải sau.
- "Danh hiệu" không có spec item, chỉ có trong ảnh. Đã chốt là bắt buộc. Ghi comment `// no spec item — from design image, see clarifications.md` ngay tại chỗ.
- Dùng dữ liệu nội dung trong Figma làm mock. Không tự bịa dữ liệu.

## Requirements
- Tách `kudos-composer.tsx` thành shell < 200 dòng, điều phối các module con.
- Hook trạng thái dùng chung `use-kudos-composer-state.ts`: giữ toàn bộ field, cờ `touched`, hàm `validate()`, `canSubmit`, `reset()`.
- `recipient-picker.tsx`: input + icon mũi tên dropdown bên phải + danh sách gợi ý; bắt buộc chọn từ danh sách (gõ tay không khớp = chưa chọn); trim query trước khi gọi `onSearchRecipient` (test case `"  Nguyễn  "`); ký tự đặc biệt `@ # $` không làm vỡ.
- `title-field.tsx`: input + 2 dòng hint dưới ("Ví dụ: Người truyền động lực cho tôi." và dòng kết "… làm tiêu đề Kudos của bạn.").
- `field-error.tsx` + `required-mark.tsx`: dùng chung cho mọi trường — viền đỏ + chữ "Không được để trống" (khoá `composer.errors.required`).
- Submit khi tất cả rỗng (ID-56) → hiện lỗi ở **mọi** trường bắt buộc cùng lúc.
- Đủ `data-testid` theo bảng ở phase 02.

## Architecture
```
kudos-composer.tsx (shell: modal, layout, footer, gọi onSubmit)
├── use-kudos-composer-state.ts   (state + validate + canSubmit)
├── recipient-picker.tsx          (+ .module.css)
├── title-field.tsx
├── field-error.tsx / required-mark.tsx
└── (phase 07) rich-text-*, mention-*, link-dialog
    (phase 08) hashtag-picker, anonymous-toggle
```
Luồng dữ liệu: props vào → hook giữ state → `onSubmit(payload)` ra. Không có state nào sống ngoài hook.

## Related Code Files
- Tạo: `use-kudos-composer-state.ts`, `recipient-picker.tsx` (+css), `title-field.tsx` (+css), `field-error.tsx`, `required-mark.tsx`
- Sửa: `kudos-composer.tsx`, `kudos-composer.module.css`, `kudos-composer.test.tsx`
- **Sở hữu độc quyền:** `src/components/kudos/composer/**` trừ `types.ts` (phase 02 đã chốt, chỉ đọc)
- Không chạm: `src/lib/**`, `src/app/**`, `src/components/kudos/board/**`, `src/messages/**`

## Implementation Steps
1. Bật skill `tkm:momorph-implement-design`. Gọi `get_frame`, `download_specs`, `download_test_cases` cho `ihQ26W78P2`. Lấy giá trị thị giác thật.
2. Viết/cập nhật test jest cho hook (`canSubmit` sai khi thiếu recipient / title / content / hashtag) và cho `recipient-picker` (trim, chọn từ danh sách) — đỏ trước.
3. Tách file theo sơ đồ trên, giữ hành vi hiện có không đổi.
4. Thêm `title-field`, `required-mark`, `field-error`.
5. Nối lỗi inline vào `validate()` + submit-khi-rỗng.
6. Chạy `npm test -- kudos-composer`, `npx tsc --noEmit`, `npm run lint`.

## Todo List
- [ ] Lấy giá trị thị giác từ MoMorph MCP (không hardcode đoán)
- [ ] Test hook + picker (đỏ trước)
- [ ] Tách module, mọi file < 200 dòng
- [ ] `title-field` + 2 dòng hint
- [ ] `required-mark` + `field-error` + viền đỏ
- [ ] Submit rỗng hiện đủ lỗi (ID-56)
- [ ] Đủ `data-testid`

## Success Criteria
- `npm test -- kudos-composer` → exit 0
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0
- `wc -l src/components/kudos/composer/*.tsx` — mọi file < 200
- Các assertion của `e2e/viet-kudo.spec.ts` liên quan recipient/title/lỗi inline chuyển từ fail sang pass (spec tổng thể vẫn đỏ vì phase 07/08 chưa xong — đúng kỳ vọng)

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Tách file làm vỡ test composer hiện có | Cao | Suite đỏ | Tách trước, thêm tính năng sau; chạy test sau mỗi lần tách |
| Đoán giá trị pixel thay vì hỏi MCP | Trung bình | Sai thiết kế, phải làm lại ở phase 10 | Quy tắc cứng: mọi con số thị giác phải truy được về `get_frame` |
| testid lệch bảng phase 02 | Trung bình | Spec E2E đỏ oan | Đối chiếu bảng trước khi commit |

## Rollback
Revert thư mục `composer/` về commit trước. Không có thay đổi DB, không có thay đổi API.

## Security Considerations
- Không render HTML ở phase này. `title` là input text thuần.
- Không tin `recipientOptions` chứa HTML — render bằng text node, không `dangerouslySetInnerHTML`.

## Next Steps
Phase 07 (cùng track, tuần tự).
