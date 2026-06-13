À ha, lỗi tôi! Tôi hiểu sai ý ông đoạn "hộp chuyển đổi tab". Ý ông là tách biệt hẳn thành **2 màn hình giao diện/chức năng riêng biệt (2 Views độc lập)**:

1. **Màn hình 1:** PDF bên trái $\rightarrow$ Markdown Preview bên phải (Màn này làm trước).
2. **Màn hình 2:** PDF bên trái $\rightarrow$ JSON Viewer bên phải (Màn này làm sau).

Việc tách đôi thành 2 màn hình riêng biệt thế này sẽ giúp trải nghiệm người dùng tập trung hơn rất nhiều, không bị rối mắt giữa hai loại định dạng dữ liệu khác nhau.

Tôi đã điều chỉnh lại toàn bộ file kế hoạch Markdown: sửa lại cơ chế điều hướng giao diện chính (View Switcher), cập nhật cấu trúc thư mục dạng **Layout-driven** và **đảo toàn bộ Phase ưu tiên màn hình Markdown lên trước màn JSON** đúng theo yêu cầu của ông nhé!

---

```markdown
# 🚀 Kế hoạch Dự án: PDF to JSON & Markdown Processor (Two-Screen Architecture)

## 1. Tầm nhìn & Mục tiêu
* **Vấn đề cần giải quyết:** Xử lý hàng loạt file PDF thông qua một API duy nhất, trích xuất ra hai định dạng dữ liệu độc lập: Markdown (để đọc/xem trước văn bản trực quan) và JSON (để lưu trữ/phân tích hệ thống). 
* **Kết quả kỳ vọng:** Ứng dụng SPA chạy mượt mà, kiểm soát hàng đợi song song song (Max Concurrency = 5). Giao diện chia làm 2 màn hình chức năng độc lập (chuyển đổi qua thanh điều hướng chính):
  * **Màn hình PDF - Markdown (Ưu tiên số 1):** PDF bên trái, Markdown Preview chuẩn cấu trúc văn bản bên phải.
  * **Màn hình PDF - JSON (Ưu tiên số 2):** PDF bên trái, JSON Viewer dạng cây phân cấp màu sắc bên phải.

## 2. Tech Stack & Thư viện Tích hợp
* **Core Language:** TypeScript (Biên dịch sang JavaScript ES6) nghiêm ngặt.
* **Build Tool & Bundler:** ViteJS (Biên dịch TS siêu tốc, quản lý môi trường).
* **Code Quality (Linter):** ESLint (Flat Config mới nhất) + `@typescript-eslint` cấu hình nhận diện biến toàn cục legacy (`angular`, `$`).
* **Giao diện/Styling:** HTML, CSS, Tailwind CSS (PostCSS) + Plugin `@tailwindcss/typography` (bắt buộc để render Markdown đẹp tự động).
* **Môi trường & Data-binding:** Legacy AngularJS 1.8.x (Quản lý trạng thái Views và data-binding hệ thống qua hàm `.component()`) kết hợp với jQuery để xử lý DOM/Modal chi tiết.
* **Network Client:** Axios (Xử lý HTTP request đẩy file `FormData`).
* **Thư viện Hiển thị Văn bản (Ưu tiên làm trước):**
  * `marked`: Biên dịch chuỗi Markdown thô sang mã HTML tốc độ cao.
  * `dompurify`: Sanitize HTML, loại bỏ script độc hại trước khi render qua `$sce` của Angular để tránh lỗi bảo mật XSS.
* **Thư viện Hiển thị Dữ liệu (Làm sau):**
  * `json-viewer-js` hoặc tương đương (Render JSON dạng cây, đóng/mở node).
* **Cơ chế hiển thị PDF:** Dùng thẻ `<embed>` / `<iframe>` trỏ vào Blob Object URL trên RAM.

## 3. Cấu trúc Thư mục Dự án (Folder Structure)
```text
pdf-to-json-processor/
│
├── public/                          # Tài nguyên tĩnh, sao chép nguyên vẹn sang dist khi build
│   ├── favicon.ico
│   └── vendor/                      # Thư viện legacy tải trực tiếp (không qua npm bundle)
│       ├── angular.min.js
│       └── jquery.min.js
│
├── src/                             # Toàn bộ mã nguồn phát triển của ứng dụng
│   ├── app.ts                       # Entry point: Khởi tạo Angular Module, cấu hình cấu trúc View chính
│   ├── index.html                   # File HTML chính (Điểm neo cho ViteJS, chứa Thanh điều hướng màn hình)
│   │
│   ├── components/                  # Kiến trúc Component-driven (AngularJS Components)
│   │   │
│   │   ├── screen-markdown/         # [MÀN HÌNH 1 - ƯU TIÊN] Layout PDF vs Markdown Preview
│   │   │   ├── markdown-screen.component.ts
│   │   │   └── markdown-screen.html
│   │   │
│   │   ├── screen-json/             # [MÀN HÌNH 2] Layout PDF vs JSON Viewer
│   │   │   ├── json-screen.component.ts
│   │   │   └── json-screen.html
│   │   │
│   │   ├── modal-detail/            # Component xử lý Modal phóng to chi tiết
│   │   │   ├── modal.component.ts
│   │   │   └── modal.html
│   │   └── pdf-row/                 # Component cho từng hàng kết quả trong danh sách tổng
│   │       ├── row.component.ts
│   │       └── row.html
│   │
│   ├── controllers/                 # Tầng điều khiển dữ liệu gắn với View
│   │   └── main.controller.ts       # Controller tổng điều phối trạng thái RAM và Switch Màn hình (View State)
│   │
│   ├── models/                      # Định nghĩa Type/Interface cho TypeScript
│   │   ├── index.ts                 # Barrel export giúp import gọn gàng
│   │   ├── pdf-item.model.ts        # Thực thể chứa cả trường markdownData và jsonData
│   │   └── api-response.model.ts    # Khớp cấu trúc dữ liệu đôi trả về từ API
│   │
│   ├── services/                    # Tầng xử lý Logic độc lập (Pure Logic)
│   │   ├── api.service.ts           # Axios Client, Interceptors cấu hình API
│   │   └── queue.service.ts         # Thuật toán điều phối hàng đợi xử lý song song (Max = 5)
│   │
│   ├── styles/                      # Quản lý giao diện
│   │   └── main.css                 # File chứa các directive gốc `@tailwind`
│   │
│   └── utils/                       # Hàm bổ trợ dùng chung toàn dự án
│       ├── constants.ts             # Lưu hằng số (Max Concurrency = 5, API Endpoint)
│       └── helpers.ts               # Hàm sinh ID, format file size, trigger download (PDF, JSON, MD)...
│
├── .env                             # Quản lý biến môi trường (VITE_API_URL)
├── .gitignore
├── eslint.config.js                 # Cấu hình kiểm tra lỗi và chất lượng code (Flat Config)
├── postcss.config.js                # Cấu hình xử lý CSS cho Tailwind
├── tailwind.config.js               # Cấu hình quét class của Tailwind CSS (Bao gồm cả plugin typography)
├── tsconfig.json                    # Cấu hình khắt khe cho trình biên dịch TypeScript
├── vite.config.ts                   # Cấu hình ViteJS và tích hợp plugin kiểm tra ESLint
└── package.json                     # Định nghĩa script build, lint và các dependency

```

## 4. Luồng Nghiệp vụ Chi tiết (Detailed Business Logic Flow)

### 🔄 Giai đoạn 1: Tiếp nhận File & Điều phối Hàng đợi (Queue Processing)

1. **Sự kiện Upload:** Người dùng kéo thả hoặc chọn một hoặc nhiều file PDF cùng lúc ở màn hình hiện tại.
2. **Khởi tạo trạng thái trên RAM:** Hệ thống đọc từng file, cấp một `id` duy nhất (UUID), chuyển đổi file thành Object URL tạm thời (`URL.createObjectURL(file)`) để sẵn sàng hiển thị lên UI.
3. **Điều phối Song song (Max Concurrency = 5):** Đẩy file vào `Queue`, duy trì tối đa 5 luồng gọi API qua Axios đồng thời để tối ưu hiệu năng băng thông.

### 📡 Giai đoạn 2: Gọi API & Khớp nối Dữ liệu (API & Model Binding)

1. **Xử lý Phản hồi (Response Mapping):**
* **Trường hợp Thành công (200 OK):** Nhận về gói dữ liệu chứa song song cả cấu trúc dữ liệu JSON thô và chuỗi văn bản định dạng Markdown. Ánh xạ toàn bộ vào Model trên RAM của phần tử đó.
* **Trường hợp Thất bại:** Tự động sinh chuỗi Markdown thông báo lỗi dạng bảng/alert và đối tượng JSON lỗi tương ứng.


2. **Cập nhật Thứ tự Hiển thị (LIFO):** Đẩy dữ liệu mới xử lý xong lên đầu mảng hiển thị (`unshift`). Dữ liệu này sẽ tự động phân phối đến Màn hình 1 hoặc Màn hình 2 tùy thuộc vào màn hình người dùng đang đứng.

### 💻 Giai đoạn 3: Tương tác & Chuyển đổi Màn hình Chức năng

1. **Cơ chế Switch Màn hình:** Trên thanh công cụ chính (Navbar), người dùng bấm chuyển đổi giữa hai chế độ xem. Hệ thống thay đổi biến trạng thái (`currentView = 'markdown' | 'json'`). AngularJS sẽ render component màn hình tương ứng.
2. **Tại Màn hình PDF - Markdown (Ưu tiên cao nhất):**
* Giao diện chia đôi: Bên trái hiển thị file PDF qua nhúng iframe. Bên phải hiển thị kết quả biên dịch văn bản từ chuỗi Markdown.
* Chuỗi Markdown thô được xử lý qua `marked.parse` $\rightarrow$ `DOMPurify.sanitize` $\rightarrow$ bọc an toàn bằng `$sce.trustAsHtml` để hiển thị mượt mà.


3. **Tại Màn hình PDF - JSON:**
* Giao diện chia đôi: Bên trái giữ nguyên PDF. Bên phải hiển thị JSON thô đã được format dạng cây phân tầng và highlight cú pháp.


4. **Hành động Tải về (Download):** Kích hoạt tải xuống đồng thời bộ 3 file: PDF gốc, `.md` và `.json` trực tiếp từ RAM của đối tượng được chọn.
5. **Hành động Xóa & Giải phóng:** Giải phóng vùng nhớ của mảng dữ liệu, thu hồi toàn bộ Object URL (`URL.revokeObjectURL`) để tránh tràn RAM trình duyệt.

## 5. Lộ trình triển khai Chi tiết (Roadmap)

### 🛠️ Phase 1: Setup Môi trường, ViteJS & Cấu hình ESLint Bảo vệ Code

* [ ] Khởi tạo dự án, cấu hình `package.json`, cài đặt TypeScript, Tailwind CSS, Axios.
* [ ] Cài đặt gói bộ kiểm tra lỗi: `eslint`, `typescript-eslint`, `globals` và `@vitejs/plugin-eslint`.
* [ ] Tạo và thiết lập file cấu hình `eslint.config.js` (Flat Config), đăng ký các biến môi trường và biến toàn cục của mã nguồn cũ (`angular`, `$`, `jQuery`) ở trạng thái `readonly` để chặn lỗi báo đỏ vô lý.
* [ ] Thiết lập `vite.config.ts`, tích hợp `@vitejs/plugin-eslint` để tự động quét lỗi realtime ngay khi lưu code (`Ctrl + S`).
* [ ] Thiết lập file `tsconfig.json` cấu hình biên dịch TypeScript khắt khe (chặn lạm dụng kiểu `any`).
* [ ] Cấu hình `src/index.html` làm entry point cho ViteJS, nạp jQuery và AngularJS tĩnh từ `public/vendor/`. Dựng thanh Navbar điều hướng chính (Chuyển đổi View: Markdown View / JSON View).

### 🗂️ Phase 2: Định nghĩa Model & Xây dựng API Service (TypeScript)

* [ ] Cập nhật interface trong `models/pdf-item.model.ts` để lưu cấu trúc song song:
```typescript
export interface PdfItem {
    id: string;
    name: string;
    pdfUrl: string;
    markdownData: string; // Chuỗi Markdown thô nhận từ API
    jsonData: any;        // Cấu trúc Object dữ liệu JSON
    status: 'pending' | 'success' | 'error';
    errorMessage?: string;
}

```


* [ ] Định nghĩa interface cấu trúc dữ liệu phản hồi đôi từ server trong `models/api-response.model.ts`.
* [ ] Viết `services/api.service.ts` bằng Axios cấu hình header `multipart/form-data`.
* [ ] Xây dựng bộ bắt lỗi tập trung trong Service để tự động chuẩn hóa cả cấu trúc JSON lỗi lẫn chuỗi Markdown thông báo lỗi khi API gặp sự cố.

### ⚙️ Phase 3: Thuật toán Hàng đợi xử lý song song & Main Controller (Core Logic)

* [ ] Viết `services/queue.service.ts` quản lý mảng hàng đợi công việc bất đồng bộ, giới hạn tối đa chạy song song 5 file cùng lúc (`maxConcurrency = 5`).
* [ ] Viết logic đẩy phần tử vừa hoàn thành lên đầu danh sách hiển thị theo quy tắc LIFO (`unshift`).
* [ ] Thiết lập `controllers/main.controller.ts` quản lý biến trạng thái màn hình hiện tại (`currentView`), liên kết dữ liệu giữa Queue Service và Scope hiển thị của AngularJS.

### 🎨 Phase 4: Hiện thực hóa MÀN HÌNH 1 (PDF vs Markdown Preview) - ƯU TIÊN SỐ 1

* [ ] Cài đặt các thư viện xử lý chuỗi văn bản qua npm: `npm install marked dompurify` và các file type định nghĩa `@types/dompurify`. Tích hợp thư viện `@tailwindcss/typography` vào file cấu hình Tailwind.
* [ ] Sử dụng hàm `.component()` của AngularJS 1.8.x tạo ra component `screenMarkdown` trong thư mục `src/components/screen-markdown/`.
* [ ] Dựng Layout chia đôi bằng Tailwind: Bên trái nhúng `<iframe ng-src="..."/>` hiển thị PDF, bên phải chứa phân vùng class `prose` của Tailwind Typography để hiển thị nội dung Markdown.
* [ ] Viết logic cho controller của component: Tiếp nhận danh sách dữ liệu từ Main Controller, lấy chuỗi `markdownData` của file được chọn, dùng `marked.parse()` để chuyển đổi sang HTML, bọc qua `DOMPurify.sanitize()` để lọc sạch mã độc, và gán qua `$sce.trustAsHtml()` để đẩy ra view qua chỉ thị `ng-bind-html`.
* [ ] Kiểm thử toàn bộ luồng tải file, xử lý hàng đợi và hiển thị mượt mà trên Màn hình Markdown trước khi sang màn hình tiếp theo.

### 📊 Phase 5: Hiện thực hóa MÀN HÌNH 2 (PDF vs JSON Viewer) - LÀM SAU

* [ ] Sử dụng hàm `.component()` tạo ra component `screenJson` trong thư mục `src/components/screen-json/`.
* [ ] Dựng Layout tương tự màn 1, nhưng phân vùng bên phải thay thế bằng khung chứa dữ liệu cấu trúc JSON.
* [ ] Tích hợp thư viện Beautify JSON (`json-viewer-js`) vào component, xử lý render dữ liệu dạng cây có màu, hỗ trợ đóng/mở node linh hoạt khi người dùng xem thông tin chi tiết.
* [ ] Thiết lập component `pdf-row` dùng chung hiển thị danh sách dòng kết quả thu gọn ở góc màn hình để người dùng có thể click đổi file cần xem nhanh chóng.

### 🛠️ Phase 6: Hoàn thiện Tiện ích Tương tác & Tối ưu bộ nhớ RAM cho cả 2 Màn hình

* [ ] Viết component `modal-detail` dùng chung cho cả 2 màn hình, sử dụng jQuery để bắt sự kiện click phóng to xem chi tiết toàn màn hình khi cần thiết.
* [ ] Viết hàm giải phóng bộ nhớ (`URL.revokeObjectURL`) khi thực hiện hành động Xóa đơn lẻ hoặc Xóa toàn bộ dữ liệu trên RAM để tránh rò rỉ bộ nhớ trình duyệt khi làm việc với lượng lớn file PDF.
* [ ] Viết hàm xử lý nút Tải về (Download) sinh cùng lúc 3 trigger tải xuống: file PDF gốc, file JSON kết quả, và file `.md` chứa mã Markdown thô tương ứng.
* [ ] Phát triển tính năng cho phép sửa trực tiếp văn bản Markdown (ở màn 1) hoặc JSON thô (ở màn 2) ngay ngoài giao diện, kiểm tra tính hợp lệ trước khi cập nhật ngược lại vào mảng RAM.

```

***


