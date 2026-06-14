import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ApiService } from './api.service';

// Giả lập thư viện axios
vi.mock('axios');

describe('ApiService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('trả về đúng định dạng PdfItem khi gọi API thành công (status: success)', async () => {
        // Dữ liệu mock giống hệt cấu trúc được cung cấp trong requirements
        const mockApiResponse = {
            data: {
                project: "cholimex",
                status: "success",
                pages: [
                    {
                        page_index: 0,
                        markdown: "# Page 1 Markdown\nHello from page 1."
                    },
                    {
                        page_index: 1,
                        markdown: "# Page 2 Markdown\nHello from page 2."
                    }
                ],
                audit: {
                    workflow_id: "cholimex-ocr-test",
                    processed_at: "2026-06-14T04:08:28",
                    ocr_provider: "chandra",
                    total_pages: 2,
                    accepted_pages: 2,
                    processing_time_ms: 1000,
                    stage_timings: {
                        preprocess_ms: 100,
                        ocr_ms: 900,
                        extract_ms: null,
                        validate_ms: null
                    }
                },
                error: null
            }
        };

        // Gán giả lập cho phương thức post của axios
        vi.mocked(axios.post).mockResolvedValue(mockApiResponse);

        const mockFile = new File(['dummy_content'], 'test_document.pdf', { type: 'application/pdf' });
        const result = await ApiService.processPdf(mockFile);

        // Kiểm tra đúng luồng success
        expect(result.status).toBe('success');
        expect(result.errorMessage).toBeUndefined();
        
        // Kiểm tra markdownData kết hợp tất cả các trang
        expect(result.markdownData).toBe("# Page 1 Markdown\nHello from page 1.\n\n---\n\n# Page 2 Markdown\nHello from page 2.");
        
        // Kiểm tra jsonData chứa nguyên vẹn response API
        expect(result.jsonData).toEqual(mockApiResponse.data);

        // Đảm bảo axios post đã được gọi với FormData
        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('tự động chuẩn hóa lỗi và markdownData khi gọi API thất bại (status: error)', async () => {
        // Mock một lỗi điển hình từ API trả về
        const mockApiError = {
            response: {
                data: {
                    error: "Token đã hết hạn hoặc không hợp lệ."
                }
            }
        };

        vi.mocked(axios.post).mockRejectedValue(mockApiError);

        const mockFile = new File(['dummy_content'], 'test_document.pdf', { type: 'application/pdf' });
        const result = await ApiService.processPdf(mockFile);

        // Kiểm tra luồng báo lỗi
        expect(result.status).toBe('error');
        expect(result.errorMessage).toBe("Token đã hết hạn hoặc không hợp lệ.");
        
        // Cấu trúc lỗi json được truyền thẳng xuống jsonData
        expect(result.jsonData).toEqual(mockApiError.response.data);

        // Chuỗi markdown thông báo lỗi chuẩn hóa
        expect(result.markdownData).toContain("# Lỗi xử lý API");
        expect(result.markdownData).toContain("Token đã hết hạn hoặc không hợp lệ.");
    });
});
