# Phase 10 — GREEN, visual validation, docs

## Context Links
- [plan.md](plan.md) · [phase-01](phase-01-red-gate-and-auth-harness-dependency.md) · [reports/red-evidence.md](reports/red-evidence.md)
- `docs/authentication.md`, `docs/journals/`

## Overview
- Priority: P1 · Owner: **tester** (GREEN + visual) → **doc-writer** (docs) · Status: blocked (chờ 09)
- Cùng một `tester` sở hữu cả bằng chứng thực thi lẫn bằng chứng thị giác. `momorph-ui-implementer` không sở hữu phần này.

## Key Insights
- GREEN phải chạy **đúng lệnh** đã ghi ở `redCommand`. Đổi lệnh = bằng chứng vô giá trị.
- Lệch thị giác đáng kể = chưa xong: trả lại một việc sửa có giới hạn cho `momorph-ui-implementer`, **không** nới lỏng test.
- Test case ảnh (ID-18..24, 37..40, 54, 55) vẫn skip kèm lý do — phải xuất hiện trong báo cáo, không biến mất.

## Requirements
- Chạy `redCommand` → exit 0.
- Chạy toàn bộ: `npm test`, `npm run lint`, `npm run build`, `npx playwright test`.
- Visual validation qua Playwright MCP: chụp modal "Viết Kudo" ở các trạng thái — mặc định, lỗi inline đầy đủ (ID-56), 5 hashtag, bật ẩn danh, đang gửi. Đối chiếu với `get_frame(ihQ26W78P2)`.
- Docs: cập nhật `docs/` với mục ẩn danh + sanitize; thêm entry journal.

## Related Code Files
- Sửa/tạo: `docs/authentication.md` (hoặc trang mới `docs/kudos-composer.md`), `docs/journals/2026-09-11-viet-kudo-composer.md`, `plans/260911-1143-viet-kudo-screen/reports/green-evidence.md`
- Không sửa: `src/**` (trừ khi vòng sửa lỗi có giới hạn được mở, và khi đó chủ sở hữu file gốc làm)

## Implementation Steps
1. Chạy lại `redCommand`, ghi exit code vào `reports/green-evidence.md`.
2. Chạy `npm test`, `npm run lint`, `npm run build`, `npx playwright test` — ghi từng exit code thật.
3. Visual validation 5 trạng thái, lưu ảnh vào `reports/visuals/`.
4. Lệch → mô tả lệch cụ thể (thuộc tính, giá trị mong đợi từ MCP, giá trị thực tế) và trả về `momorph-ui-implementer`. Lặp cho tới khi khớp.
5. Docs viết rõ ba điều: (a) ẩn danh chỉ ở tầng hiển thị, `sender_id` lưu thật và `anon` đọc được qua PostgREST; (b) sanitize hai đầu và vì sao đầu render không thể bỏ; (c) upload ảnh hoãn, kèm danh sách test case bị skip.
6. Journal: ghi lại quyết định `execCommand` vs editor library và kết quả thực tế.

## Todo List
- [ ] `redCommand` → exit 0
- [ ] 4 lệnh kiểm tra toàn cục xanh
- [ ] Visual 5 trạng thái, đối chiếu MCP
- [ ] Vòng sửa có giới hạn nếu lệch
- [ ] Docs: ẩn danh, sanitize, phạm vi hoãn
- [ ] Journal entry
- [ ] `reports/green-evidence.md`

## Success Criteria
- `npx playwright test e2e/viet-kudo.spec.ts --project=chromium-auth` → exit **0**
- `npm test` → 0 · `npm run lint` → 0 · `npm run build` → 0 · `npx playwright test` → 0
- `reports/green-evidence.md` có exit code thật của từng lệnh (không viết "passed" chung chung)
- Docs nêu thẳng giới hạn ẩn danh bằng một câu không né tránh

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Test đỏ lác đác (flaky) do contentEditable + Playwright | Cao | GREEN không đáng tin | Chạy 3 lần liên tiếp; flaky thì sửa test, không thêm retry để giấu |
| Cám dỗ nới assertion cho xanh | Trung bình | Bằng chứng giả | Quy tắc cứng: sửa code, không hạ test |
| Docs bỏ qua mục ẩn danh | Trung bình | Người dùng hiểu sai về quyền riêng tư | Là success criteria, không phải tuỳ chọn |

## Rollback
Phase chỉ ghi docs và bằng chứng. Rollback = xoá file docs/report mới.

## Security Considerations
Đây là nơi cam kết ghi thẳng: **"Gửi ẩn danh" không ẩn danh với bất kỳ ai đọc được database hoặc gọi PostgREST trực tiếp** — `sender_id` vẫn lưu đúng và `kudos_select_all` mở cho `anon`. Nếu sản phẩm cần ẩn danh thật thì phải làm thêm một vòng: view lọc cột hoặc thu hẹp RLS.

## Next Steps
Đóng plan. Mở plan riêng cho upload ảnh khi Supabase Storage chạy được.
