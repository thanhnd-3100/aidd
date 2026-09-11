---
title: "Màn Viết Kudo — composer đầy đủ (trừ upload ảnh)"
description: "Mở rộng composer Kudo: danh hiệu, rich text, mention, hashtag cố định, ẩn danh hiển thị, cùng migration và sanitize HTML hai đầu."
status: pending
priority: P1
effort: 14h
branch: feature/new/noID/implement-kudos-screen
tags: [momorph, kudos, composer, rich-text, supabase, e2e, sanitization]
created: 2026-09-11
---

# Viết Kudo — implementation blueprint

MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2 (frame `520:11602`, 26 spec, 57 test case)
Clarifications (authoritative): [clarifications.md](clarifications.md) · testPolicy: **e2e-red-first**

## GATE — không phase implementation nào được bắt đầu trước khi RED hợp lệ

1. Plan `plans/260911-1134-kudos-write-like-e2e-coverage/` phải xong tới phase 03 (Playwright auth setup + storageState). **SATISFIED ✓ (2026-09-11)**
   - Harness phase 03 completed: `e2e/auth.setup.ts`, `chromium-auth` project, `storageState` + access token ready
   - Smoke test verified: authenticated click on "Ghi nhận" opens modal ✓
   
2. `tester` viết/cập nhật spec màn hình `e2e/viet-kudo.spec.ts`, chạy `npx playwright test e2e/viet-kudo.spec.ts --project=chromium-auth`, exit code khác 0 **vì assertion màn hình**, không phải vì config/browser/dev-server.
3. Ghi `redTestFiles / redCommand / redExitCode / redFailure` vào [reports/red-evidence.md](reports/red-evidence.md).

Phase 02 trở đi hiện UNBLOCKED và sẵn sàng chạy khi RED được thiết lập.

## Phases

| # | Phase | Track | Owner agent | Status | Depends on | Effort |
|---|-------|-------|-------------|--------|-----------|--------|
| 01 | [RED gate + phụ thuộc auth harness](phase-01-red-gate-and-auth-harness-dependency.md) | — | tester | pending | plan 260911-1134 ph.03 | 1h |
| 02 | [Hợp đồng dùng chung: types, i18n keys, hằng số](phase-02-shared-contracts-and-i18n-keys.md) | — | implementer | blocked | 01 | 0.75h |
| 03 | [Migration: title / is_anonymous / anonymous_name + bảng hashtag](phase-03-migration-title-anonymous-hashtag-options.md) | B | implementer | blocked | 02 | 1h |
| 04 | [Sanitize HTML + create-kudos + list-hashtag-options](phase-04-sanitize-and-server-actions.md) | B | implementer | blocked | 03 | 1.5h |
| 05 | [Card render: tiêu đề, HTML đã sanitize, tên ẩn danh](phase-05-card-renders-title-html-anonymous.md) | B | implementer | blocked | 04 | 1h |
| 06 | [Composer: tách module, recipient, danh hiệu, lỗi inline](phase-06-composer-shell-recipient-title.md) | A | momorph-ui-implementer | blocked | 02 | 2h |
| 07 | [Rich text editor + toolbar + link dialog + mention](phase-07-rich-text-editor-toolbar-mention.md) | A | momorph-ui-implementer | blocked | 06 | 3h |
| 08 | [Hashtag dropdown + ẩn danh + trạng thái footer](phase-08-hashtag-picker-anonymous-footer.md) | A | momorph-ui-implementer | blocked | 07 | 1.5h |
| 09 | [Tích hợp: sun-kudos-client + view model](phase-09-integration-client-wiring.md) | — | implementer | blocked | 05, 08 | 1h |
| 10 | [GREEN + visual validation + docs](phase-10-green-visual-validation-docs.md) | — | tester → doc-writer | blocked | 09 | 1.25h |

Track A (06→07→08) và Track B (03→04→05) chạy song song sau phase 02. File ownership rời nhau hoàn toàn — xem bảng dưới.

## File ownership (không phase song song nào chạm cùng file)

| Vùng | Chủ |
|------|-----|
| `src/components/kudos/composer/**` | Track A (06/07/08, tuần tự trong track) |
| `supabase/migrations/**`, `supabase/seeds/**` | 03 |
| `src/lib/kudos/**` | 04 |
| `src/components/kudos/board/kudos-card.*`, `board/types.ts` | 05 |
| `src/messages/kudos.json`, `composer/types.ts`, `src/lib/kudos/hashtag-bounds.ts` | 02 (một lần, trước khi fan-out) |
| `src/app/sun-kudos/**` | 09 |
| `e2e/viet-kudo.spec.ts`, `docs/**` | 01 / 10 |

## Phạm vi

**IN:** danh hiệu (bắt buộc), toolbar rich text (B/I/S/ol/link/quote), mention `@`, hashtag dropdown cố định, ẩn danh hiển thị, lỗi inline + dấu `*`, icon mũi tên dropdown, ghi chú "Tối đa 5", migration, create-kudos, sanitize 2 đầu, card render HTML + tiêu đề, i18n vi/en, spec E2E màn hình.

**OUT (ghi nhận, không im lặng bỏ):** upload ảnh F/F.1–F.5 và test case **ID-18..24, 37..40, 54, 55** — hoãn, chờ Supabase Storage chạy được; lưu mention vào DB + notification; đổi luồng đăng nhập Google; bản thân auth harness; project Supabase hosted.

## Unresolved questions

1. Danh sách hashtag cố định gồm tag nào? Tạm dùng `teamwork, reliable, great-job, mentorship` từ seed hiện có — **cần team xác nhận trước khi merge phase 03**.
2. Link "Tiêu chuẩn cộng đồng" (chữ đỏ trên toolbar) trỏ đi đâu? Không spec, không test case → phase 07 render nhưng `href="#"` + `data-todo`, không bịa URL.
3. Upload ảnh: cần quyết định bucket/policy + Storage chạy được.
4. `maxLength` của nội dung và danh hiệu: spec D.1 nói có bộ đếm ký tự nhưng không nêu số → phase 07 dựng bộ đếm, giới hạn để trống (không chặn) cho tới khi có số.
5. (mới) Thư viện sanitize: `isomorphic-dompurify` là đề xuất, cần duyệt thêm dependency — xem phase 04.
6. (mới) `document.execCommand` đã deprecated nhưng vẫn chạy mọi trình duyệt mục tiêu. Nếu phase 07 thấy không đủ, fallback là thêm tiptap — đổi dependency, cần duyệt.
7. (mới) "Danh hiệu" bắt buộc → `kudos.title NOT NULL`, nhưng các hàng kudos cũ chưa có. Phase 03 dùng `default ''` rồi backfill, xem chi tiết ở đó.
