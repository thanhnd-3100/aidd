# Phase 07 — Rich text editor + toolbar + link dialog + mention

test_policy: e2e-red-first

## MoMorph refs:
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: /Users/nguyen.danh.thanh/Work/aidd/plans/260911-1143-viet-kudo-screen/clarifications.md
- testPolicy: e2e-red-first

## Context Links
- [plan.md](plan.md) · [phase-06](phase-06-composer-shell-recipient-title.md) · [clarifications.md](clarifications.md) (Q5, Q7)
- Spec C.1–C.6, D, D.1 · Test case ID-27..32 (toolbar), ID-12/13/33 (mention)

## Overview
- Priority: P1 · Owner: **momorph-ui-implementer** (Track A) · Status: blocked (chờ 06)
- Phase nặng nhất và rủi ro nhất của plan.

## Key Insights
- Repo không có editor library. Hai đường: (a) `contentEditable` + `document.execCommand` — 0 dependency, API deprecated nhưng vẫn chạy trên mọi trình duyệt mục tiêu; (b) thêm tiptap/lexical — mạnh hơn, nặng hơn, phải duyệt dependency. **REVERSED: Chọn tiptap (b)** (clarifications Q7 finalized 2026-09-11). Lý do: HTML từ tiptap có kiểm soát nên khớp đúng allowlist; execCommand deprecated + yếu ở ordered-list và blockquote.
- Editor xuất HTML → phải trùng allowlist của `sanitize-kudos-html.ts` (b/i/s/ol/li/a/blockquote). Toolbar không được sinh thẻ ngoài allowlist, nếu không nội dung sẽ bị nuốt lặng lẽ khi lưu. **Tiptap giúp điều này dễ hơn.**
- Mention chỉ là chèn **text**, không tạo thẻ, không lưu quan hệ (clarifications Q7). Đúng đủ cho ID-12/13/33.
- Link "Tiêu chuẩn cộng đồng" chưa rõ đích → render đúng vị trí, chữ đỏ, `href="#"` kèm `data-todo="community-standards-url"`. **Không bịa URL.**
- Bộ đếm ký tự: hiện số, không đặt giới hạn (spec không cho số — unresolved #4).

## Requirements
- `tiptap-editor.tsx` (or `rich-text-editor.tsx`): tiptap instance, `data-testid="composer-content-editor"`, placeholder khi rỗng, emit `onChange(html)`. Extensions: bold/italic/strike/orderedList/blockquote/link, configurable menu bubble or slash commands.
- `rich-text-toolbar.tsx`: 6 nút B / I / S / danh sách đánh số / link / trích dẫn, trạng thái active theo tiptap `isActive()`, `aria-pressed`, `aria-label` từ i18n. Cùng hàng: link "Tiêu chuẩn cộng đồng" chữ đỏ.
- `link-dialog.tsx`: nhập URL + checkbox "mở tab mới" → tiptap `setLink()` + attributes (target, rel); chặn scheme không phải http/https/mailto ngay ở UI (server vẫn chặn lần nữa).
- `mention-suggester.tsx`: gõ `@` mở danh sách từ prop `recipientOptions`/`mentionOptions`; chọn → chèn tên dạng text vào vị trí con trỏ, đóng danh sách; `Esc` đóng; không khớp ai → không mở. Có thể dùng tiptap mention extension hoặc vanilla.
- `character-counter.tsx`: đếm ký tự của phần **text** (đã strip tag via tiptap `getEditor().getText()`), không đếm markup.
- Hint dưới textarea: `Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác` (D.1).
- Nội dung rỗng (chỉ markup, không text) = chưa hợp lệ → lỗi inline.

## Architecture
```
tiptap-editor.tsx (tiptap editor instance w/ Toolbar extension)
  ├─ rich-text-toolbar.tsx  ── tiptap commands: bold, italic, strike, bulletList, orderedList, link, blockquote, etc.
  ├─ link-dialog.tsx        ── tiptap setLink + attributes (target, rel)
  ├─ mention-suggester.tsx  ── gợi ý `@` mention từ recipientOptions; chèn text vào editor
  └─ character-counter.tsx  ── getEditor().getText().length
                 │ onChange(html)
                 ▼
     use-kudos-composer-state (phase 06) ──► payload.contentHtml
```
Tiptap xử lý state + undo/redo; HTML output có kiểm soát khớp allowlist từ đầu.

## Related Code Files
- Tạo: `rich-text-editor.tsx`, `rich-text-toolbar.tsx`, `link-dialog.tsx`, `mention-suggester.tsx`, `character-counter.tsx` + css module tương ứng, và test jest cho từng cái
- Sửa: `kudos-composer.tsx`, `use-kudos-composer-state.ts`
- **Sở hữu độc quyền:** `src/components/kudos/composer/**`
- Không chạm: `src/lib/**`, `src/app/**`, `board/**`, `src/messages/**`

## Implementation Steps
1. Lấy giá trị thị giác toolbar + icon từ MoMorph MCP (`get_frame`). Icon nào không có sẵn thì export từ MCP, không tự vẽ gần đúng.
2. **RED:** test jest cho mỗi lệnh toolbar (ID-27..32): bôi đen text, bấm nút, HTML kết quả chứa đúng thẻ allowlist. Test mention: gõ `@Ngu`, danh sách hiện, chọn → text chèn đúng. Test counter. Test link dialog chặn `javascript:`.
3. Setup tiptap editor instance với extensions: bold/italic/strike/orderedList/blockquote/link. Cấu hình nodes/marks để match allowlist của `sanitize-kudos-html.ts`.
4. Dựng `tiptap-editor.tsx` hoặc `rich-text-editor.tsx` (tiptap wrapper, placeholder, onChange emit HTML).
5. Dựng toolbar: 6 nút tương ứng với tiptap commands, trạng thái active theo `isActive()`, không mất selection vì tiptap xử lý.
6. Dựng link dialog (chèn via tiptap `setLink()` + target/rel attributes; chặn scheme không phải http/https/mailto).
7. Dựng mention suggester: detect `@` + search recipientOptions, chèn text via tiptap.
8. Dựng counter + hint D.1 + link "Tiêu chuẩn cộng đồng" (`href="#"`).
9. Kiểm tra HTML sinh ra chỉ chứa thẻ trong allowlist — cấu hình tiptap extensions đảm bảo điều này; thêm test khẳng định, đối chiếu danh sách của `sanitize-kudos-html.ts`.
10. `npm test -- composer`, `npx tsc --noEmit`, `npm run lint`.

## Todo List
- [ ] Giá trị thị giác + icon từ MCP
- [ ] Test toolbar ID-27..32 (đỏ trước)
- [ ] `rich-text-editor.tsx`
- [ ] `rich-text-toolbar.tsx` + preventDefault selection
- [ ] `link-dialog.tsx` + chặn scheme
- [ ] `mention-suggester.tsx` (ID-12/13/33)
- [ ] `character-counter.tsx` (không giới hạn — unresolved #4)
- [ ] Test: HTML sinh ra ⊆ allowlist
- [ ] Mọi file < 200 dòng

## Success Criteria
- `npm test -- composer` → exit 0, có test riêng cho từng ID-27..32 và ID-12/13/33.
- Test "HTML sinh ra ⊆ allowlist" pass — đây là chốt chặn không để nội dung bị sanitize nuốt.
- `npx tsc --noEmit` → exit 0 · `npm run lint` → exit 0
- `wc -l` mọi file mới < 200

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| `execCommand` không dựng nổi blockquote/ol ổn định | Trung bình | Phải đổi sang tiptap giữa chừng | Làm quote và ol **trước** trong bước 4; hỏng thì dừng, escalate xin duyệt tiptap, đừng chắp vá |
| jsdom không hỗ trợ `execCommand` → test jest không chạy được | **Cao** | Mất tầng unit test cho toolbar | Tách logic sinh HTML ra hàm thuần test được; phần gọi execCommand phủ bằng E2E Playwright ở phase 10. Ghi rõ ranh giới này. |
| Toolbar sinh `<div>`/`<span style>` ngoài allowlist | Cao | Nội dung bị nuốt sau sanitize | Test bước 8; cần thì chuẩn hoá HTML trước khi emit |
| Mất selection khi bấm nút toolbar | Cao | Nút không tác dụng | `onMouseDown` preventDefault trên mọi nút |
| Mention làm vỡ con trỏ trong contentEditable | Trung bình | Nhập liệu khó chịu | Dùng Range API, có test chèn giữa văn bản |

## Rollback
Revert thư mục `composer/` về mốc cuối phase 06 — composer vẫn dùng textarea thuần, vẫn gửi được kudos. Đây là điểm lùi an toàn có chủ đích.

## Security Considerations
- Editor sinh HTML **không phải** ranh giới tin cậy. Nó chỉ giúp trải nghiệm; chặn thật nằm ở `sanitize-kudos-html.ts` hai đầu (phase 04, 05).
- Link dialog chặn `javascript:`/`data:` ở UI là tiện dụng, không phải bảo mật — không được vì thế mà nới lỏng phía server.
- `target="_blank"` luôn kèm `rel="noopener noreferrer"`.
- Không `dangerouslySetInnerHTML` trong composer để render lại nội dung người dùng vừa gõ ngoài chính contentEditable.

## Next Steps
Phase 08 (cùng track, tuần tự).
