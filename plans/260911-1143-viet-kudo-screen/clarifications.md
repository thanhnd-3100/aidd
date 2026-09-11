# Clarifications — Màn "Viết Kudo"

- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- fileKey: `9ypp4enmFmdK3YAFJLIu6C` · screenId: `ihQ26W78P2` · frame: "Viết Kudo" (`520:11602`)
- Nguồn đã đọc: 26 spec item + 57 test case (download_specs / download_test_cases), ảnh frame có annotate
- testPolicy: `e2e-red-first`

## Session 2026-09-11

- Q: Phạm vi triển khai màn "Viết Kudo" lần này đến đâu? → A: Bỏ phần upload ảnh (F, F.1–F.5), làm toàn bộ phần còn lại — danh hiệu, rich text toolbar, mention, hashtag dropdown, ẩn danh, hiển thị lỗi inline. Lý do loại ảnh: storage-api không pull được trên máy này (layer docker hỏng), nên không có cách kiểm chứng tại chỗ.
- Q: "Danh hiệu" có trong ảnh thiết kế nhưng không có trong 26 spec item lẫn 57 test case — theo nguồn nào? → A: Làm theo ảnh, coi là trường bắt buộc. Thêm cột `title` vào bảng `kudos`, hiển thị làm tiêu đề trên card. Ghi rõ đây là suy luận từ ảnh, không có spec item hậu thuẫn.
- Q: "Gửi ẩn danh" xung đột với RLS `kudos_insert_own` (bắt `sender_id = auth.uid()`) — chấp nhận kiểu nào? → A: Ẩn ở tầng hiển thị. Thêm `is_anonymous` + `anonymous_name`, vẫn lưu `sender_id` thật. Phải ghi rõ trong tài liệu: không ẩn danh với người có quyền đọc DB.
- Q: RED hợp lệ cần đăng nhập được, mà harness auth cho E2E chưa tồn tại — xử lý thứ tự thế nào? → A: Làm harness auth trước (plan `260911-1134-kudos-write-like-e2e-coverage`), xong mới quay lại màn Viết Kudo với RED hợp lệ. **SATISFIED 2026-09-11** — harness phase 03 completed.
- Q: Rich text lưu và render thế nào (cột `content` đang là text thuần)? → A: Lưu HTML, sanitize bằng allowlist thẻ (b/i/s/ol/li/a/blockquote) ở cả lúc ghi và lúc render. Giữ nguyên kiểu cột `text`, không đổi schema cho phần này.
- Q: Nút "+ Hashtag" mở dropdown — danh sách hashtag lấy từ đâu? → A: Danh sách cố định do team định nghĩa (bảng hashtag seed sẵn), không cho gõ tự do.
- Q: `@ + tên` mention làm đến mức nào? → A: Gợi ý từ `profiles` khi gõ `@`, chọn thì chèn tên vào nội dung. Không lưu quan hệ mention, không gửi notification — vừa đủ cho test case ID-12, ID-13, ID-33.

**Decisions finalized (2026-09-11):**
- Sanitize: `isomorphic-dompurify` approved ✓. Repo chưa có sanitizer nào; `kudos-card.tsx` nằm trong client bundle nên sanitize cả 2 phía. Tự viết bị loại.
- Rich text editor: `tiptap` selected ✓. (Reverses planner's execCommand-first choice in phase 07; tiptap HTML controlledù khớp allowlist, execCommand deprecated + weak on ordered-list/blockquote.)
- Fixed hashtag list: `teamwork`, `reliable`, `great-job`, `mentorship` (4 from current seed) ✓. Mở rộng sau bằng migration khác.

## Unresolved Questions

- Link "Tiêu chuẩn cộng đồng" trên toolbar (thấy trong ảnh, chữ đỏ) không có spec item, không có test case, chưa rõ trỏ đi đâu.
- Phần upload ảnh (F) hoãn lại — cần Supabase Storage chạy được và một quyết định về bucket/policy.
- `maxLength` của nội dung và danh hiệu: spec ghi "bộ đếm ký tự" ở D.1 nhưng không nêu con số; test case cũng không kiểm.
