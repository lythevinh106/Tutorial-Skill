import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse, PdfItem } from '../models';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/cholimex/ocr' : 'http://192.168.100.117:30134/cholimex/ocr');

export class ApiService {
    /**
     * Upload file PDF lên server để thực hiện OCR
     * @param file File PDF cần OCR
     * @param useLocalLlm Sử dụng local LLM để xử lý OCR
     * @returns PdfItem (một phần dữ liệu) chứa kết quả markdown, json và trạng thái
     */
    static async processPdf(file: File, useLocalLlm: boolean = false): Promise<Partial<PdfItem>> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            if (useLocalLlm) {
                // Convert file to base64
                const base64DataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const payload = {
                    "model": "local-std-03",
                    "max_tokens": 16000,
                    "temperature": 0.1,
                    "chat_template_kwargs": {"enable_thinking": false},
                    "messages": [{"role":"user","content":[
                      {"type":"image_url",
                      "image_url":{"url": base64DataUrl}},
                      {"type": "text", "text": "# ROLE\nYou are an expert OCR and Data Extraction Assistant. Your task is to process images or PDFs of invoices, purchase notes, and receipts, extracting the content with 100% fidelity and formatting it into a strict Hybrid Markdown-HTML structure.\n\n# OBJECTIVE\nExtract all visible text and data from the provided document. You must preserve the logical reading order and apply specific formatting rules depending on whether the data is unstructured (free text) or structured (tabular data).\n\n# STRICT FORMATTING RULES\n\n1.  **Plain Text & Headers (Unstructured Data):**\n    * Standard paragraphs, warning notes (e.g., \"NHA CUNG CAP LUU Y...\"), page numbers, and footers MUST be output as plain text. Do not wrap them in HTML.\n    * Main document titles (e.g., \"PURCHASE NOTE\") MUST be formatted as Markdown Heading 1 (e.g., `# PURCHASE NOTE`).\n\n2.  **Key-Value Pairs & Totals:**\n    * Summary blocks outside of tables (like VAT calculations or Total amounts) MUST be formatted using Markdown Bold. \n    * Format: `**KEY : VALUE**` (e.g., `**TOTAL BF.TAX : 2.630.901**`).\n\n3.  **HTML Tables (Strictly for Structured Data):**\n    * ONLY data that is presented in a grid or table format in the original document may be converted to HTML.\n    * You MUST use standard HTML table tags: `<table border=\"1\">`, `<tr>`, `<th>` (for headers), and `<td>` (for data cells).\n    * **Multiline Cells:** If a single cell contains multiple lines of text (e.g., Addresses like \"CTY TNHH DV EB\\nSO 163...\"), you MUST replace the line breaks with `<br>` tags within the `<td>`.\n    * **Merged Cells:** If a row acts as a grouped summary (e.g., \"SALTY GROCERY(420)\"), you MUST use the `colspan` attribute appropriately (e.g., `<td colspan=\"5\" align=\"right\">`).\n    * Do NOT use Markdown tables (using `|`). ONLY use HTML for tables.\n\n4.  **No Conversational Text:**\n    * DO NOT include any conversational filler (e.g., \"Here is the extracted text...\", \"Sure!\"). Output ONLY the requested extraction.\n\n# FEW-SHOT EXAMPLE\nTo understand the exact expected output format, refer to the structure below:\n\n[User Input: An image of a Purchase Note]\n\n[Expected Output]\nEvaluation Warning : The document was created with Spire.PDF for .NET.\nNHA CUNG CAP LUU Y: NEU CO BAT KY SAI BIET GIA MUA, QUY CACH DAT HANG...\nNHA CUNG CAP PHAI DIEU CHINH VOI TRUNG TAM THU MUA BIG C TRUOC KHI GIAO HANG\npage 1 of 1\n\n# PURCHASE NOTE\n\n<table border=\"1\">\n  <tr>\n    <th>Order No</th>\n    <th>Order Date</th>\n    <th>Supplier Code</th>\n    <th>Com.Contract</th>\n    <th>Ad.Ch</th>\n  </tr>\n  <tr>\n    <td>2622056313735</td>\n    <td>30/05/26 07:40</td>\n    <td>0350139</td>\n    <td>N4040134</td>\n    <td>1</td>\n  </tr>\n</table>\n\n<table border=\"1\">\n  <tr>\n    <th>Ordered By</th>\n    <th>Delivered To</th>\n    <th>For Store</th>\n    <th>By Supplier</th>\n  </tr>\n  <tr>\n    <td>CTY TNHH DV EB<br>SO 163, DUONG PHAN DANG LUU<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>TOPS MARKET THAO DIEN (134)<br>TH LUNG, TN THAO DIEN PEARL, SO 12<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>TOPS MARKET THAO DIEN<br>TH LUNG, TN THAO DIEN PEARL, SO 12<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>CONG TY CP TP CHOLIMEX<br>Lô C40-43/I, C51-55/II Ðu?ng S? 7,<br>Thành Ph? H? Chí Minh<br><br>Vietnam</td>\n  </tr>\n</table>\n\n**TOTAL BF.TAX : 2.630.901**\n**VAT 5% : 0**\n\nLuu Y: - Ncc vui long giao hang va xuat hoa don theo tung don hang va theo tung nhom hang.\n\n---\nNow, please process the attached document according to these strict rules."}
                    ]}]
                };

                const response = await axios.post('http://192.168.100.117:30414/v1/chat/completions', payload, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = response.data;
                const markdownData = data.choices?.[0]?.message?.content || '';

                return {
                    status: 'success',
                    markdownData: markdownData,
                    jsonData: data,
                    errorMessage: undefined
                };
            }
            const response: AxiosResponse<ApiResponse> = await axios.post(API_URL, formData, {
                headers: {
                    'accept': 'application/json'
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
