import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse, PdfItem } from '../models';

const API_URL = import.meta.env.VITE_API_URL || '/api/cholimex/ocr';

export class ApiService {
    /**
     * Upload file PDF lên server để thực hiện OCR
     * @param file File PDF cần OCR
     * @returns PdfItem (một phần dữ liệu) chứa kết quả markdown, json và trạng thái
     */
    static async processPdf(file: File): Promise<Partial<PdfItem>> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response: AxiosResponse<ApiResponse> = await axios.post(API_URL, formData, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

            // Xử lý markdownData: kết hợp tất cả các trang
            let markdownData = '';
            if (data.pages && data.pages.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                markdownData = data.pages.map((p: any) => p.markdown).join('\n\n---\n\n');
            }

            return {
                status: 'success',
                markdownData: markdownData,
                jsonData: data,
                errorMessage: undefined
            };

        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            console.error('Lỗi khi gọi API OCR:', error);
            
            const errorMessage = error.response?.data?.error || error.message || 'Lỗi hệ thống không xác định';
            
            // Tự động chuẩn hóa chuỗi Markdown thông báo lỗi khi API gặp sự cố
            const errorMarkdown = `# Lỗi xử lý API\n\nXin lỗi, đã có lỗi xảy ra trong quá trình xử lý tài liệu này. Vui lòng thử lại sau.\n\n**Chi tiết lỗi:** ${errorMessage}`;

            return {
                status: 'error',
                markdownData: errorMarkdown,
                jsonData: error.response?.data || { error: errorMessage },
                errorMessage: errorMessage
            };
        }
    }
}
