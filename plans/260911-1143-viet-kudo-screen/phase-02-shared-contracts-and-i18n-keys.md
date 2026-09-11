# Phase 02 — Hợp đồng dùng chung: types, i18n keys, hằng số, testid

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md) · [phase-01](phase-01-red-gate-and-auth-harness-dependency.md)
- `src/components/kudos/composer/types.ts`, `src/messages/kudos.json`

## Overview
- Priority: P1 · Owner: **implementer** · Status: blocked (chờ phase 01)
- Một phase nhỏ chạy MỘT LẦN trước khi Track A và Track B fan-out, để hai track không tranh cùng file.

## Key Insights
- `src/messages/kudos.json` là file duy nhất cả hai track đều cần (copy composer + copy card ẩn danh). Nếu để mỗi track tự thêm key → xung đột. Gom hết vào đây.
- Hằng số `MAX_HASHTAGS/MIN_HASHTAGS` đang nằm trong `kudos-composer.tsx` và lặp lại trong `create-kudos.ts` → vi phạm DRY, tách ra module dùng chung.
- Danh sách `data-testid` phải chốt ở đây vì phase 01 viết spec theo nó.

## Requirements
- Mở rộng `KudosComposerSubmitPayload`: `title: string`, `contentHtml: string`, `hashtags: string[]`, `isAnonymous: boolean`, `anonymousName: string | null`. Bỏ `content` phẳng.
- Thêm `HashtagOption = { slug: string; label: string }` và prop `hashtagOptions: HashtagOption[]` vào `KudosComposerProps` (composer vẫn thuần presentational, không tự fetch).
- Thêm khoá i18n vi + en: `composer.title.label/placeholder/hintExample/hintUsage`, `composer.content.hint`, `composer.content.counter`, `composer.toolbar.{bold,italic,strike,orderedList,link,quote,communityStandards}`, `composer.linkDialog.{title,urlLabel,openNewTab,confirm,cancel}`, `composer.mention.hint`, `composer.hashtags.{addButton,maxNote,maxReached}`, `composer.anonymous.{checkboxLabel,nameLabel,namePlaceholder}`, `composer.errors.required`, `card.anonymousFallback`.
- Giá trị copy tiếng Việt lấy đúng chữ trong design/spec; bản `en` tạm sao chép bản `vi` (đúng thông lệ file hiện tại).
- Chốt bảng `data-testid`.

## Architecture
Không logic. Chỉ type + hằng + chuỗi. Chuỗi lỗi rỗng dùng chung một khoá `composer.errors.required` = "Không được để trống" (spec dùng đúng một câu cho mọi trường).

## Related Code Files
- Sửa: `src/components/kudos/composer/types.ts`, `src/messages/kudos.json`
- Tạo: `src/lib/kudos/hashtag-bounds.ts` (export `MIN_HASHTAGS = 1`, `MAX_HASHTAGS = 5`)
- Không sửa: `kudos-composer.tsx` (Track A sở hữu), `create-kudos.ts` (Track B sở hữu) — hai track tự import hằng số mới ở phase của mình

## Bảng data-testid (hợp đồng — phase 01 và 06–08 đều bám vào)
| testid | Thuộc |
|---|---|
| `composer-modal` | modal gốc |
| `composer-recipient-input`, `composer-recipient-option`, `composer-recipient-error` | B/B.1/B.2 |
| `composer-title-input`, `composer-title-error` | Danh hiệu |
| `composer-toolbar`, `composer-toolbar-bold|italic|strike|ordered-list|link|quote`, `composer-community-standards` | C.1–C.6 |
| `composer-content-editor`, `composer-content-error`, `composer-content-counter` | D/D.1 |
| `composer-mention-list`, `composer-mention-option` | D mention |
| `composer-link-dialog`, `composer-link-url`, `composer-link-newtab`, `composer-link-confirm` | C.5 |
| `composer-hashtag-add`, `composer-hashtag-menu`, `composer-hashtag-option`, `composer-hashtag-chip`, `composer-hashtag-remove`, `composer-hashtag-error` | E |
| `composer-anonymous-checkbox`, `composer-anonymous-name` | G |
| `composer-cancel`, `composer-submit` | H |

## Implementation Steps
1. Viết test jest cho `hashtag-bounds.ts` (giá trị 1 và 5) — nhỏ nhưng giữ RED-first hình thức.
2. Tạo `src/lib/kudos/hashtag-bounds.ts`.
3. Cập nhật `composer/types.ts` theo hợp đồng trên (chỉ type, chưa ai dùng → build vẫn xanh vì `kudos-composer.tsx` chưa import trường mới; nếu `tsc` báo lỗi do payload cũ thiếu trường, để lỗi đó lại cho phase 06 — KHÔNG tự sửa file của Track A).
4. Nếu bước 3 làm `npx tsc --noEmit` đỏ: giữ `KudosComposerSubmitPayload` cũ thành `KudosComposerSubmitPayloadV1` deprecated và export song song, để repo compile được giữa hai phase.
5. Thêm toàn bộ khoá i18n vào cả `vi` và `en`.

## Todo List
- [ ] `hashtag-bounds.ts` + test
- [ ] Mở rộng `composer/types.ts`
- [ ] Thêm khoá i18n vi + en
- [ ] `npx tsc --noEmit` xanh
- [ ] `npm run lint` xanh

## Success Criteria
- `npx tsc --noEmit` → exit 0
- `npm test -- hashtag-bounds` → exit 0
- `node -e "JSON.parse(require('fs').readFileSync('src/messages/kudos.json'))"` → exit 0, và số khoá trong `vi` bằng số khoá trong `en`

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Đổi type làm repo không compile giữa hai phase | Cao | Chặn cả hai track | Bước 4: export song song type cũ, xoá ở phase 09 |
| Copy tiếng Việt lệch với design | Trung bình | Test E2E fail vặt | Lấy chuỗi từ MoMorph MCP (`get_frame`), không gõ lại theo trí nhớ |

## Security Considerations
Không có bề mặt. Chỉ chuỗi tĩnh.

## Next Steps
Mở khoá phase 03 (Track B) và phase 06 (Track A) chạy song song.
