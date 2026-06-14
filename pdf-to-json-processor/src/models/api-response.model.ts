export interface OcrPage {
    page_index: number;
    markdown: string;
}

export interface OcrAudit {
    workflow_id: string;
    processed_at: string;
    ocr_provider: string;
    total_pages: number;
    accepted_pages: number;
    processing_time_ms: number;
    stage_timings: {
        preprocess_ms: number | null;
        ocr_ms: number | null;
        extract_ms: number | null;
        validate_ms: number | null;
    };
}

export interface ApiResponse {
    project: string;
    status: string;
    pages: OcrPage[];
    audit: OcrAudit;
    error: unknown;
}
