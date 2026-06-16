---
trigger: always_on
description: Rule For Typescript
---

# 📘 Quy chuẩn TypeScript: Đột Phá Hiệu Năng & Tối Ưu Độ Đọc Code

## 📌 1. Triết lý Định kiểu: "Strict nhưng không Over-engineer"
TypeScript sinh ra để bảo vệ mã nguồn, không phải để làm khó anh em trong team. Tuyệt đối tránh biến code thành một đống "mê cung" của Conditional Types hay Mapped Types quá phức tạp nếu không thực sự cần thiết.

* **Type Inference (Tự động suy luận kiểu):** Hãy để TypeScript tự làm việc của nó nếu giá trị đã quá rõ ràng. Không ép viết lại kiểu thừa thãi.
    ```typescript
    // ❌ SAI - Thừa thãi, mỏi tay, giảm độ đọc
    const isVisible: boolean = true;
    const userName: string = 'Lý Thế Vinh';

    //  ĐÚNG - Hãy để TS tự hiểu
    const isVisible = true;
    const userName = 'Lý Thế Vinh';
    ```
* **Bắt buộc định kiểu tường minh khi nào?**
    * Tham số (`params`) và giá trị trả về (`return type`) của tất cả các hàm/phương thức.
    * Các thuộc tính khởi tạo của Class / Controller.
    * Dữ liệu Binding đầu vào của Component.

---

## 🛑 2. Chiến dịch "Tiêu diệt `any`" trong Thế giới Legacy
Khi làm việc với AngularJS 1.8, ông sẽ rất dễ bị cám dỗ xài `any` vì dữ liệu cũ không có kiểu. Dùng `any` đồng nghĩa với việc vứt bỏ toàn bộ sức mạnh của TypeScript.

* **Quy tắc 1:** Cấm sử dụng `any` vô tội vạ. Nếu gặp dữ liệu chưa rõ ràng (ví dụ: payload từ một bên thứ ba chưa map xong), hãy dùng **`unknown`**.
* **Quy tắc 2:** Nếu bắt buộc phải dùng `any` (do xung đột thư viện cổ), bắt buộc phải có comment giải thích lý do tại sao (`// TODO: refactor type`).

```typescript
// ❌ SAI - Mất hoàn toàn type-safety
function processData(rawData: any) {
    console.log(rawData.pdf.name); // Sẽ sập ứng dụng nếu pdf bị undefined lúc runtime
}

//  ĐÚNG - Ép lập trình viên phải kiểm tra dữ liệu trước khi xài
function processData(rawData: unknown) {
    if (rawData && typeof rawData === 'object' && 'pdf' in rawData) {
        const obj = rawData as { pdf: { name: string } };
        console.log(obj.pdf.name);
    }
}
```

---

## 🗂️ 3. Quy chuẩn Định nghĩa Cấu trúc: `interface` vs `type`

Để giữ cho code đồng bộ và dễ quét bằng mắt, team thống nhất phân chia vai trò rõ ràng:

* **Dùng `interface` cho cấu trúc dữ liệu, Model, API Response:** (Vì interface hỗ trợ mở rộng `extends` rất trực quan và báo lỗi tường minh khi trùng tên).
* **Dùng `type` cho Union, Tuple, các kiểu Alias đặc dị:**

```typescript
//  ĐÚNG - Model dùng Interface
interface IPdfItem {
    id: string;
    name: string;
    status: LoadingStatus;
}

//  ĐÚNG - Khai báo trạng thái hoặc gom nhóm dùng Type
type LoadingStatus = 'pending' | 'success' | 'error';
type CombinedId = string | number;
```

---

## 💉 4. Ánh xạ TypeScript chuẩn vào AngularJS 1.8.x

Bắt buộc tận dụng không gian tên `ng.` được cung cấp bởi thư viện `@types/angular` để kiểm soát các thành phần core.

* **Định kiểu cho Component Options:**

```typescript
import { MarkdownPreviewController } from './markdown.controller';

// Dùng ng.IComponentOptions để ép cấu hình đúng chuẩn Angular
export const MarkdownPreviewComponent: ng.IComponentOptions = {
    bindings: {
        rawMarkdown: '<'
    },
    templateUrl: '/src/components/markdown-preview/markdown.html',
    controller: MarkdownPreviewController // Ép class controller phải tương thích
};
```

* **Định kiểu cho Core Services kế thừa:**

```typescript
export class ApiService {
    // Ép kiểu chính xác cho các service hệ thống được inject vào
    static $inject = ['$http', '$q', '$timeout'];
    constructor(
        private $http: ng.IHttpService,
        private $q: ng.IQService,
        private $timeout: ng.ITimeoutService
    ) {}

    public fetchPdfMeta(id: string): ng.IPromise<any> {
        return this.$http.get(`/api/pdf/${id}`).then(res => res.data);
    }
}
```

---

## 🛡️ 5. Phòng chống Lỗi `undefined` (Null-Safety)

Lỗi `Cannot read properties of undefined` là ác mộng của frontend. Sử dụng tư duy hiện đại để triệt tiêu nó ngay từ vòng gửi xe.

* **Optional Chaining (`?.`):** Sử dụng thay thế hoàn toàn cho chuỗi `if (a && a.b && a.b.c)` rườm rà.
* **Nullish Coalescing (`??`):** Sử dụng để gán giá trị mặc định khi giá trị là `null` hoặc `undefined`. Tuyệt đối không lạm dụng toán tử HOAN HỶ `||` (vì `||` sẽ nuốt chửng số `0` hoặc chuỗi rỗng `""`).

```typescript
// ❌ SAI - Kiểu cũ, dài dòng
const name = item.pdfUrl ? item.pdfUrl.filename : 'No Name';
const count = item.retryCount || 5; // Nếu retryCount = 0, nó sẽ tự lấy giá trị 5 (Sai logic!)

//  ĐÚNG - Đọc phát hiểu luôn, an toàn
const name = item.pdfUrl?.filename ?? 'No Name';
const count = item.retryCount ?? 5; // Nếu retryCount = 0, giữ nguyên là 0
```

---

## 🏷️ 6. Quy tắc Đặt tên (Naming Conventions) để Code "Biết nói"

* **Interfaces:** Bắt đầu bằng chữ **`I`** viết hoa (Ví dụ: `IPdfItem`, `IApiResponse`) để phân biệt ngay lập tức với một Class thông thường khi đọc code logic.
* **Enums / Constant Types:** Sử dụng `PascalCase` cho tên Enum, và `UPPER_CASE` cho các phần tử bên trong.
```typescript
export enum HttpStatusCode {
    OK = 200,
    BAD_REQUEST = 400,
    SERVER_ERROR = 500
}
```

* **Hàm kiểm tra trả về Boolean:** Luôn bắt đầu bằng tiền tố `is`, `has`, `should`, `can`.
```typescript
const isValid = this.validateJson(this.rawText);
if (this.shouldRenderPreview()) { ... }
```