# Phase 01 — RED gate + phụ thuộc auth harness

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md)
- Phụ thuộc chặn: `plans/260911-1134-kudos-write-like-e2e-coverage/` (đặc biệt phase 01→03)
- `playwright.config.ts`, `e2e/sun-kudos.spec.ts`

## Overview
- Priority: P1 · Owner: **tester** · Status: ready to start (dependency satisfied)
- Không phải phase implementation. Đây là cổng: tạo bằng chứng RED hợp lệ cho màn "Viết Kudo".

## Key Insights
- Auth kiểm ở server (`page.tsx` → `supabase.auth.getUser()`), `page.route()` stub không với tới được → bắt buộc có session thật.
- Harness plan `260911-1134` **đã hoàn thành phase 03** (2026-09-11): Playwright setup project + storageState + chromium-auth ready. Điều kiện "session thật" hiện có.
- RED hợp lệ = exit khác 0 do assertion màn hình. Lỗi cài browser, lỗi dev-server, lỗi config **không tính**.

## Requirements

**Dependency Status:** SATISFIED ✓
- Harness plan `260911-1134` hoàn thành phase 03 (2026-09-11)
  - `e2e/auth.setup.ts` viết xong: gate assertion + real login
  - Project `chromium-auth` + `storageState` (`playwright/.auth/an.json`) chạy được
  - Smoke test verified: authenticated click mở modal ✓
  - Access token đã dump để dùng cho RLS test

Một spec màn hình duy nhất, bền (không `test.fixme`), phủ các nhóm test case: mở modal khi đã đăng nhập (ID-01..), GUI mặc định + placeholder, validate từng trường bắt buộc (ID-56 submit rỗng hiện đủ lỗi), autocomplete người nhận có trim và ký tự đặc biệt, mention ID-12/13/33, toolbar ID-27..32, hashtag ID-14..17/34..36/53, ẩn danh ID-41..44, hủy ID-45, submit ID-46/47, enable/disable nút Gửi ID-48/49.

Test case ảnh ID-18..24, 37..40, 54, 55: ghi `test.skip` kèm lý do "deferred — image upload out of scope", KHÔNG xoá.

## Architecture
Playwright `chromium-auth` project → storageState của seed user → `/sun-kudos` → click "Ghi nhận" → modal "Viết Kudo" → thao tác → assert DOM + assert kudos mới xuất hiện trên feed.

## Related Code Files
- Tạo: `e2e/viet-kudo.spec.ts`, `plans/260911-1143-viet-kudo-screen/reports/red-evidence.md`
- Đọc: `playwright.config.ts`, `e2e/sun-kudos.spec.ts`, `src/messages/kudos.json`
- Không sửa: bất cứ file nào dưới `src/`

## Implementation Steps
1. Xác nhận harness plan phase 03 đã completed. Chưa xong → báo BLOCKED, dừng.
2. Chạy `npx playwright test --project=chromium-auth` trên spec hiện có để chứng minh auth hoạt động (phải PASS). Đây là tiền đề, tách khỏi RED.
3. Viết `e2e/viet-kudo.spec.ts` bám selector `data-testid` mà phase 06–08 cam kết (danh sách testid chốt ở phase 02).
4. Chạy `npx playwright test e2e/viet-kudo.spec.ts --project=chromium-auth`. Ghi exit code và thông điệp fail đầu tiên.
5. Kiểm chứng fail là do assertion màn hình (ví dụ `getByTestId('composer-title-input')` không tồn tại), không do hạ tầng.
6. Ghi `reports/red-evidence.md`: `redTestFiles`, `redCommand`, `redExitCode`, `redFailure`.

## Todo List
- [ ] Xác nhận harness phase 03 completed
- [ ] Chạy suite auth hiện có → PASS
- [ ] Viết `e2e/viet-kudo.spec.ts`
- [ ] Thu RED, kiểm chứng nguyên nhân
- [ ] Ghi `reports/red-evidence.md`
- [ ] Đánh dấu skip + lý do cho các test case ảnh

## Success Criteria
- `npx playwright test e2e/viet-kudo.spec.ts --project=chromium-auth` → exit code **1**, thông điệp fail trỏ đúng assertion màn hình.
- `reports/red-evidence.md` tồn tại với đủ 4 trường.
- Suite cũ `e2e/sun-kudos.spec.ts` vẫn xanh.

## Risk Assessment
| Rủi ro | Khả năng | Tác động | Đối sách |
|---|---|---|---|
| Harness không chạy (docker layer hỏng, `enable_signup` không bật password login) | Cao | Chặn toàn bộ plan | Escalate ngay, không hạ policy xuống visual-contract (clarifications đã chốt e2e-red-first) |
| RED vì lý do hạ tầng bị nhầm là RED hợp lệ | Trung bình | Bằng chứng giả | Bước 2 chứng minh hạ tầng xanh trước |
| Spec khoá vào testid mà phase 06–08 đặt tên khác | Trung bình | Sửa lại spec | Phase 02 chốt danh sách testid trước khi viết spec |

## Security Considerations
Không dùng credential thật. Seed user chỉ ở local. Không commit `storageState` chứa token.

## Next Steps
Mở cổng cho phase 02. Nếu BLOCKED → plan này giữ nguyên trạng thái `pending`, không phase nào chạy.
