/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueService } from './queue.service';
import { ApiService } from './api.service';

vi.mock('./api.service');

describe('QueueService', () => {
    let queueService: QueueService;
    let mockTimeout: any;

    beforeEach(() => {
        vi.resetAllMocks();
        
        mockTimeout = vi.fn((fn: () => void, delay?: number) => {
            if (!delay) {
                fn();
            }
            return 123;
        });
        (mockTimeout as any).cancel = vi.fn();
        
        queueService = new QueueService(mockTimeout as any);
        
        // Mock URL.createObjectURL để tránh lỗi trong môi trường Node (Vitest)
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-uuid');
        globalThis.crypto.randomUUID = vi.fn(() => 'test-uuid-' + Math.random()) as any;
    });

    it('thêm file vào hàng đợi và xử lý luồng thành công', async () => {
        // Giả lập ApiService.processPdf trả về Promise
        const processPromise = Promise.resolve({
            status: 'success',
            markdownData: 'test markdown',
            jsonData: { data: 'test json' }
        });
        vi.mocked(ApiService.processPdf).mockReturnValue(processPromise as any);

        const mockFile1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
        const mockFile2 = new File(['content2'], 'doc2.pdf', { type: 'application/pdf' });
        
        // Gọi hàm enqueue
        queueService.enqueue([mockFile1, mockFile2]);

        // Kiểm tra sau khi enqueue thì phần tử được đưa vào danh sách hiển thị
        expect(queueService.items.length).toBe(2);
        expect(queueService.items[0].name).toBe('doc1.pdf'); // unshift(...[doc1, doc2]) nên doc1 ở đầu
        
        // Chờ processPromise xử lý xong các file
        await processPromise;
        // Do timeout mock là đồng bộ, nhưng Promise của API giải quyết bất đồng bộ
        // Ta cần đợi một tick để microtask queue chạy hết .then()
        await new Promise(resolve => setTimeout(resolve, 0));

        // Kiểm tra xem dữ liệu đã được map chính xác chưa
        expect(queueService.items[0].status).toBe('success');
        expect(queueService.items[0].markdownData).toBe('test markdown');
        expect(queueService.items[0].jsonData).toEqual({ data: 'test json' });
        
        // activeCount phải về 0 sau khi xử lý xong
        expect(queueService.activeCount).toBe(0);
        expect(ApiService.processPdf).toHaveBeenCalledTimes(2);
    });

    it('giới hạn số lượng xử lý song song tối đa là 5 (maxConcurrency)', async () => {
        // Tạo một Promise không bao giờ resolve để giữ các jobs ở trạng thái "đang xử lý"
        vi.mocked(ApiService.processPdf).mockReturnValue(new Promise(() => {}) as any);

        const files: File[] = [];
        for (let i = 0; i < 10; i++) {
            files.push(new File(['content' + i], `doc${i}.pdf`, { type: 'application/pdf' }));
        }

        queueService.enqueue(files);

        // Cả 10 files đều vào items
        expect(queueService.items.length).toBe(10);
        
        // Nhưng chỉ có 5 files đang được active xử lý
        expect(queueService.activeCount).toBe(5);
        expect(ApiService.processPdf).toHaveBeenCalledTimes(5);
    });
});
