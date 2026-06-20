import type { ApiResponse } from './api-response.model';

export interface IJsonHighlight {
    start: { row: number; column: number };
    end: { row: number; column: number };
    type: 'yellow' | 'red';
}

export interface PdfItem {
    id: string;
    name: string;
    pdfUrl: string;
    pdfBlob?: Blob;
    markdownData: string; // Chuỗi Markdown thô nhận từ API
    jsonData: ApiResponse | unknown; // Cấu trúc Object dữ liệu JSON
    jsonHighlights?: IJsonHighlight[]; // Danh sách các highlight trong JSON editor
    status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
    progress?: number; // Tracks completion percentage (0 - 100)
    fileSizeStr?: string; // e.g. "12.8 MB"
    errorMessage?: string;
    fileType?: string; // e.g. "image/png" or "application/pdf"
    useLocalLlm?: boolean;
    mode?: 'markdown' | 'json';
}
