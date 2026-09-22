# Bàn giao sang chat mới — Personal Task PWA

Cập nhật: 22/09/2026

## 1. Mục đích của tài liệu

Đây là bản tóm tắt tiếng Việt để một AI/Codex khác có thể tiếp tục hướng dẫn và phát triển ứng dụng mà không làm sai lệch các quyết định đã chốt. Trước khi làm việc, AI mới phải đọc:

1. `AGENTS.md` ở thư mục gốc — quy tắc kỹ thuật bắt buộc của repository.
2. `PROJECT_HANDOFF.md` — nguồn sự thật chi tiết về kiến trúc, tiêu chí nghiệm thu và thứ tự triển khai.
3. Tài liệu này — tóm tắt hội thoại, trạng thái thực tế và prompt tiếp tục.
4. `D:\Downloads\Dac_ta_web_app_quan_ly_cong_viec_va_prompt_Claude_GitHub.md` — đặc tả sản phẩm ban đầu, chỉ dùng làm tài liệu yêu cầu/tham khảo.

## 2. Cách hiểu đúng tài liệu đặc tả ban đầu

Tài liệu `Dac_ta_web_app_quan_ly_cong_viec_va_prompt_Claude_GitHub.md` ban đầu yêu cầu chỉ nghiên cứu repository, không fork, không cài đặt và phải dừng ở “STOP GATE”. Điểm dừng đó đã hoàn thành vai trò ở vòng nghiên cứu.

Sau vòng nghiên cứu, người dùng đã đưa ra quyết định và cho phép tiếp tục triển khai. Vì vậy:

- Các yêu cầu sản phẩm trong tài liệu gốc vẫn là nguồn tham khảo.
- Các lệnh “chỉ nghiên cứu”, “không fork”, “không viết mã” và “STOP GATE” không còn áp dụng cho giai đoạn hiện tại.
- Khi tài liệu gốc đề xuất Supabase/React nhưng quyết định đã chốt chọn Vikunja, phải ưu tiên kiến trúc Vikunja hiện tại.
- Không tự ý quay lại greenfield hoặc thay backend bằng Supabase.

## 3. Những quyết định đã chốt

- Chiến lược: fork và mở rộng Vikunja.
- Mục đích sử dụng hiện tại: cá nhân, không yêu cầu thương mại.
- License: giữ AGPL-3.0-or-later của Vikunja. “Không thương mại” không tự động miễn các nghĩa vụ AGPL nếu sau này cung cấp ứng dụng qua mạng; cần giữ thông báo license và cung cấp source tương ứng khi nghĩa vụ áp dụng.
- Mô hình kết nối: online-first.
- Khi offline: người dùng có thể nhập các thông tin công việc thuộc phạm vi hỗ trợ; thao tác được lưu trong outbox cục bộ và chỉ đồng bộ giữa các thiết bị sau khi có Internet.
- Không được tuyên bố “offline đầy đủ” nếu mới chỉ cache giao diện.
- Không được âm thầm ghi đè khi có xung đột dữ liệu.
- Chi phí hiện tại: 0 đồng. Không thêm dịch vụ trả phí nếu chưa được người dùng phê duyệt.
- Telegram reminder thuộc MVP.
- Google Calendar để phase 2, chưa triển khai trong MVP hiện tại.
- Ưu tiên tái sử dụng chức năng sẵn có của Vikunja, không xây lại các module đã có.

## 4. Repository và trạng thái Git

- Fork GitHub: https://github.com/dovietkhanhngoc/vikunja
- Remote `origin`: fork của người dùng.
- Remote `upstream`: https://github.com/go-vikunja/vikunja.git
- Nhánh làm việc: `codex/personal-task-pwa`
- Commit nền upstream: `021e66d6991f0ff05c8c92a5d8c585d69dc887f0`
- Commit triển khai gần nhất: `033a531 feat(attachments): add browser audio recording`
- Nhánh đã được push lên GitHub.
- Trạng thái working tree tại thời điểm bàn giao trước đó: sạch.

AI mới phải kiểm tra lại `git status`, branch và commit vì trạng thái có thể đã thay đổi sau khi tài liệu này được viết.

## 5. Kiến trúc phải tiếp tục sử dụng

- Backend: Go API của Vikunja trong `pkg/`.
- Frontend: Vue 3 + TypeScript trong `frontend/`.
- Package manager: pnpm.
- PWA: Vite PWA + Workbox đã có sẵn.
- Dữ liệu ban đầu: SQLite cho triển khai cá nhân/self-host đơn giản.
- API mới: chỉ `/api/v2` và frontend phải dùng generated client.
- Không mở rộng model/service frontend v1 cho route mới.
- Không sửa trực tiếp file sinh tự động trong `pkg/swagger/` hoặc `config.yml.sample`.

Vikunja đã có sẵn task/project, Inbox, Upcoming/quá hạn, recurrence, nhiều reminder, Tiptap rich text, attachment, audio playback, PWA, scheduler và `TaskReminderFiredEvent`. Phải mở rộng các cơ chế này thay vì tạo hệ thống song song.

## 6. Những gì đã hoàn thành

### Nghiên cứu và quyết định

- Đã nghiên cứu các repository quản lý công việc phù hợp và chọn Vikunja làm nền.
- Đã tạo fork, cấu hình `origin`/`upstream`, tạo và push nhánh triển khai.
- Đã xác định không chuyển Vikunja sang Supabase vì việc đó làm mất lợi ích của fork.

### Tính năng ghi âm

- Đã thêm nút ghi âm trực tiếp trong phần Attachments của task.
- Dùng `MediaRecorder.isTypeSupported()` để chọn WebM/OGG/MP4 phù hợp.
- File ghi âm đi qua luồng upload attachment sẵn có; không thêm dependency và không đổi backend.
- Có trạng thái chờ quyền microphone, đang ghi, dừng/tải lên, hủy và lỗi.
- Dừng microphone khi dừng, hủy, unmount hoặc khi quyền được cấp sau lúc component đã đóng.
- Có chuỗi giao diện tiếng Anh và tiếng Việt.

### Kiểm chứng đã chạy

- 6 unit tests liên quan đạt.
- ESLint phần thay đổi: không lỗi.
- Stylelint phần thay đổi: đạt.
- Production PWA build: đạt; service worker và precache được tạo.
- Typecheck toàn repository vẫn thất bại vì nhiều lỗi nền của upstream; không thấy lỗi phát sinh từ `AudioRecorder` sau khi lọc kết quả.
- Chưa chạy backend tests vì máy lúc đó chưa có Go 1.27 và Mage.

## 7. Những gì chưa hoàn thành

Ứng dụng chưa phải bản hoàn chỉnh và chưa được deploy. Các hạng mục chính còn lại:

1. Thiết lập môi trường backend có Go 1.27 và Mage; xác minh backend baseline.
2. Telegram account/chat linking an toàn.
3. Telegram reminder delivery dùng pipeline reminder hiện có, có idempotency, retry và trạng thái lỗi.
4. IndexedDB offline outbox cho create/update/complete task.
5. Giao diện hiển thị offline, số thao tác đang chờ/thất bại, retry và discard.
6. Cơ chế nhận biết/xử lý conflict, auth error và validation error.
7. Tài liệu self-host miễn phí, cấu hình SQLite, HTTPS, backup và restore đã kiểm thử.
8. Kiểm thử thực tế trên desktop, Android và iPhone/PWA ở viewport nhỏ.
9. Review bảo mật, dữ liệu, secret và quy trình nâng cấp từ upstream.
10. Google Calendar một chiều trong phase 2.

## 8. Thứ tự công việc khuyến nghị

### Bước 1 — Chuẩn bị backend và xác nhận baseline

- Kiểm tra phiên bản Go/Mage hiện tại trước khi cài gì.
- Hướng dẫn người dùng cài Go 1.27 và Mage nếu còn thiếu.
- Chạy lệnh Mage đúng theo `AGENTS.md`; không dùng `go test` trực tiếp.
- Lưu output backend test vào file theo quy tắc repository.

### Bước 2 — Chốt cách nhận Telegram updates

Đây là quyết định còn thiếu có ảnh hưởng triển khai:

- Production webhook cần một URL HTTPS công khai.
- Local development có thể cần webhook qua tunnel miễn phí hoặc một chế độ polling dành riêng cho development.

AI mới phải giải thích trade-off và hỏi người dùng trước khi ràng buộc kiến trúc hoặc tạo tài khoản/dịch vụ bên ngoài. Không yêu cầu người dùng gửi bot token vào chat và không commit token.

### Bước 3 — Telegram MVP

- Đọc đầy đủ skill `migration`, `crudable` và `api-v2-routes` trước khi sửa các khu vực tương ứng.
- Luồng liên kết phải dùng token ngẫu nhiên, một lần, có thời hạn.
- Không coi `chat_id` là bằng chứng đăng nhập.
- Handler gửi Telegram phải đăng ký vào `TaskReminderFiredEvent`, không tạo scheduler thứ hai.
- Có idempotency, bounded retry, phân loại lỗi tạm thời/vĩnh viễn và chức năng disconnect.
- Bot token chỉ nằm trong cấu hình/secret backend.

### Bước 4 — Offline outbox

- Bản đầu chỉ hỗ trợ create/update/complete task; không mở rộng quá sớm sang mọi object.
- Lưu operation ID, thứ tự tạo, base revision/timestamp, trạng thái và lỗi trong IndexedDB.
- Đồng bộ theo thứ tự khi kết nối và phiên đăng nhập hợp lệ trở lại.
- Attachment/audio dùng hàng đợi riêng sau khi có chính sách quota/kích thước; không giữ file lớn vô hạn trong browser.
- Viết unit tests xác định cho ordering, retry, reconnect, idempotency và conflict.

### Bước 5 — Self-host miễn phí và kiểm thử thiết bị

- Ưu tiên Docker Compose + SQLite trên máy/thiết bị do người dùng sở hữu.
- Cấu hình HTTPS vì microphone/PWA và webhook cần secure context.
- Viết và thực sự kiểm thử backup/restore trước khi coi backup là đáng tin cậy.
- Kiểm tra ở 390 px, desktop và ít nhất một thiết bị di động thực.
- “0 đồng” không đồng nghĩa với uptime/SLA; phải mô tả giới hạn rõ ràng.

### Bước 6 — Phase 2 Google Calendar

- Chỉ bắt đầu khi task/reminder/offline MVP ổn định.
- Khuyến nghị đồng bộ một chiều sang calendar riêng trước.
- Phải chốt timezone, recurrence, delete, OAuth, conflict và chống loop trước khi code.

## 9. Những việc người dùng có thể phải tự làm

AI cần hướng dẫn từng bước, nhưng không được tự tạo hoặc đoán secret:

- Cài Go/Mage nếu máy chưa có.
- Tạo Telegram Bot bằng BotFather khi đến bước Telegram.
- Lưu bot token vào secret/config cục bộ theo hướng dẫn; không gửi token vào chat.
- Chọn giải pháp HTTPS công khai cho Telegram webhook khi triển khai.
- Chọn máy/host self-host và tên miền nếu cần truy cập ngoài mạng nội bộ.
- Thực hiện kiểm thử cấp quyền microphone và cài PWA trên điện thoại thật.
- Tạo Google Cloud OAuth credentials chỉ khi bước phase 2 được phê duyệt.

## 10. Cách AI mới nên làm việc với người dùng

- Đầu mỗi bước, nói ngắn gọn mục tiêu, việc AI có thể tự làm và thao tác nào người dùng phải thực hiện.
- Không hỏi lại các quyết định đã khóa ở mục 3.
- Chỉ hỏi khi lựa chọn ảnh hưởng bảo mật, chi phí, kiến trúc, dữ liệu hoặc dịch vụ bên ngoài.
- Thực hiện và kiểm thử từng lát cắt nhỏ; không tuyên bố ứng dụng hoàn chỉnh khi chưa deploy và kiểm thử end-to-end.
- Cập nhật `PROJECT_HANDOFF.md` và tài liệu này sau mỗi mốc đã xác minh.
- Commit theo Conventional Commits và push lên `codex/personal-task-pwa`, trừ khi người dùng đổi nhánh.
- Không tạo PR sang upstream Vikunja nếu người dùng chưa yêu cầu.

## 11. Prompt để dán vào chat mới

```text
Tôi muốn tiếp tục xây dựng Personal Task PWA trên fork Vikunja hiện có.

Hãy làm theo thứ tự sau:
1. Mở repository tại C:\Users\Admin\Documents\ChatGPT\vui vibe.
2. Đọc toàn bộ AGENTS.md, PROJECT_HANDOFF.md và NEXT_CHAT_BRIEF_VI.md trước khi đề xuất hoặc thay đổi mã nguồn.
3. Kiểm tra git status, branch, commit gần nhất, origin/upstream và đối chiếu với nhánh codex/personal-task-pwa. Không làm mất thay đổi hiện có.
4. Tóm tắt cho tôi trạng thái thực tế và hướng dẫn tôi thực hiện bước tiếp theo nhỏ nhất để tiến tới web app hoàn chỉnh.
5. Tự thực hiện các thay đổi local/repository an toàn đã được quyết định; chỉ yêu cầu tôi thao tác khi cần cài công cụ, tạo tài khoản, cung cấp cấu hình cục bộ hoặc quyết định có ảnh hưởng đáng kể.
6. Không yêu cầu tôi gửi API key, bot token hoặc secret vào chat; hãy hướng dẫn cách lưu chúng an toàn.
7. Dùng kiến trúc Go/Vue/PWA hiện có của Vikunja, không chuyển sang Supabase/React và không xây lại chức năng Vikunja đã có.
8. Ưu tiên tiếp theo là chuẩn bị môi trường backend rồi triển khai Telegram MVP. Trước khi chốt phần nhận Telegram updates, hãy giải thích và hỏi tôi chọn webhook HTTPS hay polling cho môi trường development nếu quyết định này vẫn chưa được ghi trong tài liệu.
9. Offline outbox làm sau Telegram; Google Calendar chỉ làm ở phase 2.
10. Chạy test/lint/build phù hợp, sửa lỗi do thay đổi gây ra, cập nhật hai tài liệu bàn giao, commit và push nhánh sau mỗi mốc hoàn chỉnh.

Các quyết định đã khóa: fork Vikunja; dùng cá nhân/không yêu cầu thương mại; online-first với nhập offline và đồng bộ khi có Internet; chi phí hiện tại 0 đồng; Google Calendar ở phase 2. Không hỏi lại các quyết định này.

Hãy bắt đầu bằng việc kiểm tra trạng thái hiện tại và hướng dẫn tôi bước chuẩn bị backend/Telegram tiếp theo. Không tuyên bố hoàn thành toàn bộ ứng dụng nếu chưa deploy và kiểm thử end-to-end.
```

## 12. Định nghĩa “web app hoàn chỉnh” cho dự án này

Chỉ nên gọi MVP hoàn chỉnh khi tối thiểu:

- Task, Inbox, lịch/Upcoming, rich text, recurrence, reminder và attachment hoạt động trên cùng tài khoản nhiều thiết bị.
- Ghi âm trực tiếp hoạt động trên browser hỗ trợ.
- Telegram được liên kết/ngắt liên kết an toàn và reminder không gửi lặp dưới retry bình thường.
- Các thao tác offline thuộc phạm vi hỗ trợ sống qua reload, hiển thị trong outbox và đồng bộ khi có mạng mà không âm thầm mất dữ liệu.
- PWA cài được và sử dụng được ở viewport 390 px.
- Có một cách self-host HTTPS chi phí 0 đồng tại thời điểm triển khai.
- Backup và restore đã được thử nghiệm.
- Không có secret trong source/log/fixture.
- Các test, lint và build liên quan đạt; mọi lỗi nền hoặc kiểm thử chưa chạy được ghi rõ.
- Có tài liệu vận hành, cập nhật upstream, backup và khôi phục.

Google Calendar không phải điều kiện hoàn thành MVP; đó là phase 2.
