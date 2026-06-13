---
trigger: model_decision
description: Code Rule For AngularJS 1.8.x
---

# 📑 Quy chuẩn Phát triển AngularJS 1.8.x + TypeScript

## 📌 1. Triết lý Thiết kế: Component-Driven Architecture
Để tránh mã nguồn biến thành "bãi rác" spaghetti, toàn bộ ứng dụng phải tuân thủ kiến trúc hướng thành phần (Component-Driven). Tuyệt đối khai tử cách viết Controller và Directive kiểu cũ.

*   **Quy tắc:** 100% giao diện mới hoặc giao diện tái sử dụng phải được viết bằng phương thức `.component()`.
*   **Tư duy:** Coi mỗi Component của AngularJS như một Component của React hay Angular hiện đại.
*   **ControllerAs:** Mặc định cơ chế `.component()` sử dụng `controllerAs: '$ctrl'`. Trên View HTML, tuyệt đối không gọi biến khơi khơi, bắt buộc phải đi qua tiền tố `$ctrl.`.

---

## 🔒 2. Quản lý Scope (`$scope`) & Trạng thái (State)
Bản chất bên dưới hệ thống vẫn chạy bằng `$scope`, nhưng chúng ta phải giấu nó đi để code tường minh.

*   **Không nhét thuộc tính hiển thị vào `$scope`:** Toàn bộ dữ liệu, hàm xử lý phải gán trực tiếp vào ngữ cảnh Class (`this.myData = ...`).
*   **Khi nào được phép inject `$scope`?** Chỉ inject `$scope` khi cần sử dụng các tính năng đặc hiệu của hệ thống:
    *   Lắng nghe sự kiện toàn cục: `$scope.$on('EVENT_NAME', ...)`
    *   Hủy lắng nghe sự kiện để tránh leak: `$scope.$on('$destroy', ...)`
*   **Cấm lạm dụng `$watch`:** Hạn chế tối đa việc dùng `$scope.$watch()` để theo dõi biến động ngầm. Hãy thay thế bằng Lifecycle Hooks `$onChanges()`.

---

## ⚡ 3. Quy chuẩn Binding Dữ liệu (Component Inputs)
Việc chọn sai kiểu Binding trong block `bindings` là nguyên nhân hàng đầu gây loạn mạch dữ liệu và làm giảm hiệu năng hệ thống.

```typescript
// Kiểu mẫu chuẩn cho bindings
bindings: {
    pdfItem: '<',    // ONE-WAY BINDING: Truyền dữ liệu một chiều từ cha xuống (Bắt buộc dùng)
    title: '@',      // STRING BINDING: Truyền chuỗi tĩnh, không thay đổi
    onDelete: '&'    // EXPRESSION BINDING: Truyền callback function từ cha xuống cho con gọi ngược lên
}
```

* **Tuyệt đối không dùng `=` (Two-way binding):** Nó tạo ra liên kết hai chiều vô định hình, tự động kích hoạt Digest Cycle liên tục một cách vô tội vạ, cực kỳ khó debug.
* **Xử lý Object/Mảng qua `<`:** Do JavaScript truyền tham chiếu (reference), nếu component con tự ý chỉnh sửa thuộc tính bên trong Object của binding `<` thì component cha cũng sẽ bị đổi. **Quy tắc:** Nếu muốn chỉnh sửa, hãy clone ra vùng nhớ mới trước khi thao tác (Immutability).

---

## 🔄 4. Thực thi Nghiêm ngặt Lifecycle Hooks

Controller không phải là nơi muốn viết gì vào thì viết. Code phải được đặt đúng vị trí trong vòng đời của thành phần:

1. **`$onInit()`:** Nơi duy nhất để khởi tạo giá trị ban đầu cho các biến. Tuyệt đối không khởi tạo biến trong hàm khởi dựng `constructor()`.
2. **`$onChanges(changesObj)`:** Sử dụng để bắt sự kiện khi component cha thay đổi dữ liệu truyền xuống qua liên kết `<`.
3. **`$postLink()`:** Nơi duy nhất được phép sử dụng **jQuery** để thao tác DOM, gắn plugin, khởi tạo hiệu ứng hoặc cấu hình Modal.
4. **`$onDestroy()`:** Nghĩa vụ bắt buộc của dev. Phải dọn dẹp sạch sẽ tài nguyên:
* Gọi `URL.revokeObjectURL()` để giải phóng file PDF trên RAM.
* Gỡ bỏ sự kiện jQuery (`$element.off()`).
* Hủy các bộ định thời (`$interval`, `$timeout`).
* *Nếu quên, trình duyệt sẽ bị tràn bộ nhớ (Memory Leak) sau vài lần upload.*

---

## 💉 5. Dependency Injection (DI) & Chống Vỡ Mã Nguồn (Minification)

ViteJS khi build production sẽ tiến hành tối ưu và nén mã nguồn (minify), làm thay đổi tên các tham số của hàm (ví dụ: `private $timeout` sẽ biến thành `private a`). AngularJS sẽ sập ngay lập tức vì không tìm thấy service `a`.

* **Quy tắc:** Toàn bộ Component, Service, Controller bắt buộc phải sử dụng thuộc tính tĩnh `static $inject` để khai báo chuỗi tường minh.

```typescript
// ĐÚNG - Chuẩn Senior Dev
export class MainController {
    static $inject = ['$timeout', 'ApiService', 'QueueService'];
    constructor(
        private $timeout: ng.ITimeoutService, 
        private ApiService: any, 
        private QueueService: any
    ) {}
}
```

---

## 🚀 6. Đồng bộ Giao diện bên ngoài (Outside the Angular World)

Khi tích hợp các thư viện bên ngoài như **Axios** (gọi API) hoặc **jQuery** (bắt sự kiện DOM), AngularJS không thể tự nhận biết dữ liệu thay đổi để vẽ lại giao diện.

* **Quy tắc:** Bất kỳ thao tác gán dữ liệu nào diễn ra bên trong callback của Axios, jQuery, hoặc các hàm xử lý bất đồng bộ thuần, đều phải được bọc trong dịch vụ `$timeout` của AngularJS để kích hoạt **Digest Cycle** một cách an toàn.

```typescript
// ĐÚNG
Axios.post('/api/extract', formData).then(response => {
    this.$timeout(() => {
        this.items.unshift(response.data); // UI cập nhật ngay lập tức
    });
});
```

---

## 🛡️ 7. An toàn Bảo mật & Render HTML Động (XSS Prevention)

Dự án có tính năng biên dịch Markdown sang HTML và render trực tiếp ra màn hình. AngularJS rất nghiêm ngặt trong vấn đề này.

* **Cấm lạm dụng việc tắt bảo mật:** Tuyệt đối không sử dụng `$sce.trustAsHtml()` một cách bừa bãi trên chuỗi văn bản thô chưa qua kiểm duyệt.
* **Quy trình chuẩn 3 bước:**
1. Biên dịch bằng thư viện chuyên dụng (`marked.parse(markdownString)`).
2. Lọc sạch mã độc Script ẩn bằng thư viện **DOMPurify** (`DOMPurify.sanitize(htmlString)`).
3. Bọc bằng `$sce.trustAsHtml(cleanHtml)` và đưa ra ngoài giao diện thông qua chỉ thị `ng-bind-html`.

---

## 📊 8. Tối ưu Hiệu năng Render (`ng-repeat`)

Khi hiển thị danh sách hàng loạt file PDF và kết quả văn bản, vòng lặp `ng-repeat` nếu không được cấu hình đúng sẽ khiến trình duyệt bị giật lag (đặc biệt là khi cập nhật mảng liên tục theo cơ chế LIFO).

* **Quy tắc:** Luôn luôn sử dụng cú pháp `tracking by` đi kèm với một định danh duy nhất (Ví dụ: `id` kiểu UUID).

```html
<!-- ĐÚNG -->
<div ng-repeat="item in $ctrl.pdfItems track by item.id">
    <pdf-row item="item"></pdf-row>
</div>
```

* **Lợi ích:** Angular sẽ tái sử dụng lại các phần tử DOM cũ, chỉ vẽ lại phần tử nào thực sự thay đổi hoặc thêm mới, giúp tăng tốc độ render lên gấp 10 lần.
