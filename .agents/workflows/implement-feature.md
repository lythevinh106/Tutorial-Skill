---
name: implement-feature
description: Quy trình triển khai tính năng mới dựa trên cấu trúc dự án và bộ kỹ năng hiện tại
---

# 🚀 Quy trình Triển khai Tính năng (Feature Implementation Workflow)

Bạn là AI Agent thực hiện nhiệm vụ phát triển tính năng cho dự án. Hãy tuân thủ nghiêm ngặt quy trình dưới đây để đảm bảo mọi mã nguồn đều đồng nhất với ngữ cảnh dự án và bộ quy tắc đã được thiết lập.

### Bước 1: Nắm bắt Ngữ cảnh & Triết lý cốt lõi
- **Hành động bắt buộc:** 
  1. Luôn luôn đọc qua file kế hoạch tổng thể `docs/plans/plan-general.md` để hiểu rõ ngữ cảnh của dự án, tiến độ hiện tại và mục tiêu của task đang làm.
  2. Xuyên suốt quá trình làm việc, **LUÔN LUÔN** áp dụng các nguyên lý cốt lõi từ `kapathy skill/SKILL.md` (Simplicity First, Surgical Changes, Goal-Driven).

### Bước 2: Tiếp nhận Yêu cầu & Tối ưu Prompt (Tùy chọn)
- **Hành động:** Nhận các yêu cầu tính năng từ người dùng.
- **Điều kiện rẽ nhánh:**
  - Nếu người dùng *có yêu cầu* làm rõ, sửa chữa hoặc cải thiện các prompt (cho AI, Midjourney, v.v.): Khai thác kỹ năng `prompt-master/SKILL.md` để tối ưu prompt.
  - Nếu người dùng *không yêu cầu*: Bỏ qua bước này và đi thẳng vào phân tích và triển khai kỹ thuật.

### Bước 3: Triển khai Kỹ thuật & Giao diện (Implementation)
- **Hành động:** Viết mã nguồn và triển khai tính năng theo luồng.
- **Điều kiện rẽ nhánh (Xử lý UI):**
  - Nếu task có liên quan đến việc xây dựng, chỉnh sửa giao diện người dùng (UI): **BẮT BUỘC** gọi và áp dụng các kỹ năng thiết kế từ `frontend-design/SKILL.md` để đảm bảo chất lượng giao diện hiển thị.
  - Nếu task thuần tuý xử lý logic, dữ liệu hoặc API: Bỏ qua kỹ năng frontend-design.

### Bước 4: Kiểm thử Chất lượng (QA & Testing)
- **Hành động:** 
  - Sau khi code xong, nếu người dùng *yêu cầu kiểm thử (test)*: Hãy thực thi theo hướng dẫn của `testing-qa/SKILL.md` để viết kịch bản và chạy các bài Unit/Integration test tương ứng.
  - Nếu người dùng *không yêu cầu*: Có thể dừng bước triển khai tại đây.
- **Lưu ý đặc biệt cho UI Testing:** 
  - Nếu task có đi kèm kiểm thử giao diện (UI Testing), hãy ưu tiên sử dụng các MCP Servers chuyên dụng đã được tích hợp sẵn như **Playwright** hoặc **Puppeteer** (nếu có thể) để tương tác trực tiếp với giao diện và tự động hoá việc xác minh DOM.
