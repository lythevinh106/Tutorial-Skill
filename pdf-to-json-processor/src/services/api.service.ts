import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse, PdfItem } from '../models';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/cholimex/ocr' : 'http://192.168.100.117:30134/cholimex/ocr');

export class ApiService {
    /**
     * Upload file PDF lên server để thực hiện OCR
     * @param file File PDF cần OCR
     * @param useLocalLlm Sử dụng local LLM để xử lý OCR
     * @param mode Chế độ xử lý: 'markdown' hoặc 'json'
     * @returns PdfItem (một phần dữ liệu) chứa kết quả markdown, json và trạng thái
     */
    static async processPdf(file: File, useLocalLlm: boolean = false, mode: 'markdown' | 'json' = 'markdown'): Promise<Partial<PdfItem>> {
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

                const jsonPrompt = `You are an expert Document Data Extraction Assistant specializing in supply chain documents, specifically Purchase Orders (PO) and Invoices. 
Your objective is to extract information from the provided document image/text and output it STRICTLY as a valid JSON object matching the Data Type, Structure, and EXACT descriptions defined below.

### CRITICAL EXTRACTION RULES:
1. **Strict Fidelity:** Extract data EXACTLY as it appears in the document. Do not correct spelling, translate, or rephrase.
2. **Null Fallback for Optionals:** If a field is defined as "Optional" (e.g., "string | null") and the requested information is not explicitly found in the document, you MUST return \`null\`. Do NOT invent, guess, or calculate missing values.
3. **Strict Type Adherence:** Output the exact data type requested (string, integer, array, or object).
4. **Adhere strictly to the field descriptions:** Use the provided description for each field as your sole rule for extracting that specific value. 

### EXPECTED RESPONSE FORMAT (JSON SCHEMA):
Your output must be a single JSON object matching this exact structure and logic:

{
  "vendor_name": "string (Required) - Vendor name",
  "invoices": [
    {
      "page_number": "string | null - Page number",
      "total_page": "string | null - Total page",
      "header_name": "string | null - The main title or document type name printed at the top of the page. This field usually goes under or after these labels: 'ĐƠN ĐẶT HÀNG', 'PURCHASE ORDER', 'STORE ORDER', 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG', 'ĐƠN MUA HÀNG', 'ORD SHEET', 'CHI TIẾT ĐƠN HÀNG', 'PHIẾU NHẬN HÀNG TỔNG HỢP', 'PHIẾU GIAO HÀNG'.",
      "order_id": "string (Required) - The unique identification number for the purchase order document. This field usually goes under or after these labels: 'order id', 'order code', 'order number', 'po number', 'p/o number', 'po no.', 'order no', 'P.O. #', 'số đơn hàng', 'mã đơn hàng', 'đơn đặt hàng số', 'số hiệu đơn hàng', 'số thứ tự đơn đặt hàng', 'Số phiếu', 'Mã nhận hàng tổng hợp'.",
      "po_number": "string | null - PO number",
      "created_by": "string | null - The name, ID, or identifier of the person who created the document. Only extract and populate this field if the header section of the document explicitly contains one of these exact field labels: 'Created by', 'Tạo bởi'; otherwise, return null.",
      "order_date": "string | null - The official date when the purchase order was issued, strictly extracting only the date component and excluding any time values. This field typically appears near or after labels such as, e.g., 'Order Date', 'ngày đặt hàng', 'Ngày đặt hàng/Date', 'Entry Date', 'Order By / Date', 'Ord dt', 'PO date', 'Ngày tổng hợp phiếu nhận hàng', or similar headers. If the order date is not explicitly present on the document, return null.",
      "delivery_date": "string | null - The expected, requested, or estimated date for delivering the goods, strictly extracting only the date component and excluding any time values. This field typically appears near or after labels such as, e.g., 'delivery date', 'Ngày giao hàng', 'Delivery Date Requested', 'Ngày yêu cầu giao hàng', 'Est. Delivery date', 'Ngày giao', 'Giao hàng ngày', 'Expected Receipt Date', 'Delivery Date Suggested', 'Delivery Date To Store', 'Ngày NCC giao hàng', or similar headers. If the delivery date is not explicitly present on the document, return null.",
      "supplier_code": "string | null - Supplier code",
      "order_type": "string | null - Order type",
      "so_number": "string | null - The value of the 'SO' field located in the document header. Only extract and populate this field if the header section explicitly contains a field label matching 'SO number', 'SO No.', 'SO Number'; otherwise, return null.",
      "seller": {
        "name": "string | null - The full legal name of the seller or supplier. This field usually goes under or after these labels: 'Seller Name', 'Tên nhà cung cấp', 'Supplier name', 'Tên đơn vị gửi hàng'.",
        "address": "string | null - The complete physical address of the seller. This field usually goes under or after these labels: 'Seller Address', 'Địa chỉ nhà cung cấp', 'Supplier address', 'Address of supplier'",
        "tax_code": "string | null - Tax code",
        "contact_person": "string | null - Contact person",
        "phone": "string | null - Phone",
        "fax": "string | null - Fax",
        "email": "string | null - Email",
        "vendor_code": "string | null - Vendor code"
      },
      "buyer": {
        "name": "string | null - Buyer name",
        "tax_code": "string | null - Tax code",
        "phone": "string | null - Phone",
        "store_code": "string | null - The unique identifier code of the store. This field usually goes under or after these labels: 'Mã Cửa Hàng', 'store code', 'str'. Otherwise, it can be extracted from within larger blocks like 'địa chỉ giao hàng', 'địa chỉ nhận hàng', 'địa chỉ', 'địa điểm'.",
        "store_name": "string | null - The full name of the store. This field usually goes under or after these labels: 'Tên Cửa Hàng', 'store name', 'Nm', 'ILN', 'Tên cửa hàng/đơn vị mua'. Otherwise, it can be extracted from within larger blocks like 'địa chỉ giao hàng', 'địa chỉ nhận hàng', 'địa chỉ', 'địa điểm'.",
        "warehouse_code": "string | null - The identifier code of the warehouse. This field usually goes under or after these labels: 'Mã kho', 'warehouse code'. Otherwise, it can be extracted from within larger blocks like 'địa chỉ giao hàng', 'địa chỉ nhận hàng', 'địa chỉ', 'địa điểm'.",
        "warehouse_name": "string | null - The full name of the warehouse. This field usually goes under or after these labels: 'Tên kho', 'warehouse name', 'warehouse name', 'Kho NCC giao hàng', 'Địa chỉ kho nhận'. Otherwise, it can be extracted from within larger blocks like 'địa chỉ giao hàng', 'địa chỉ nhận hàng', 'địa chỉ', 'địa điểm'.",
        "address": "string | null - The legal or registered address of the buyer. This field usually goes under or after labels like 'Address', 'Địa chỉ', 'Địa chỉ đơn vị mua', 'Buyer Address', 'Billing Address'.",
        "delivery_to": "string | null - The name or destination entity of the delivery. This field usually goes under or after labels like 'Để giao hàng', 'Giao tới', 'delivery to', 'ship to'. Special rule: If a block labeled exactly 'Ordered By' is present side-by-side in the layout, extract the entire text block of the delivery section exactly as printed.",
        "delivery_to_address": "string | null - The complete physical address of the delivery destination, including the store and warehouse name if present. This field usually goes under or after labels like 'address ', 'Địa chỉ kho NCC giao', 'Địa chỉ/Address', 'địa điểm giao hàng', 'Địa chỉ giao hàng', 'Delivery Address'.",
        "buyer_code": "string | null - Buyer code",
        "tel": "string | null - Telephone",
        "fax": "string | null - Fax",
        "email": "string | null - Email",
        "delivered_by": "string | null - Delivered by",
        "document_type": "string | null - Document type",
        "approved_by": "string | null - The name or identifier of the person who approved the document. Only extract and populate this field if the header section of the document explicitly contains one of these exact field labels: 'Approved by', 'Được Chấp Thuận Bởi'; otherwise, return null.",
        "for_store": "string | null - The complete delivery destination block text containing the entity name and address elements. Only extract and populate this field if the document explicitly contains the label or keyword 'for store'; otherwise, return null."
      },
      "items": [
        {
          "product_code": "string | null - The unique internal item or product code. This field usually goes under or after these labels: 'artical', 'CK Item Code', 'product code', 'SKU Number', 'Article Code', 'Prod cd', 'Mã sản phẩm người mua', 'Mã hàng','Mã hàng NCC', 'item code', 'SSV Product Id'. If a dedicated column does not exist, intelligently parse and extract this code from within other composite text blocks (such as the product description column).",
          "barcode": "string | null - The standard product barcode (EAN/UPC). This field usually goes under or after these labels: 'barcode', 'Mã vạch', 'unitbarrd code', 'Sale cd', 'EAN sản phẩm', 'Mã vạch UPC'. If a dedicated column does not exist, intelligently parse and extract this barcode from within other combined code or text blocks.",
          "product_name": "string | null - The full commercial description or name of the product item within the line items table row. This field usually goes under these column headers: 'Article Desc', 'Tên sản phẩm', 'TÊN HÀNG HÓA', 'Descriptions', 'Unit Barcode Description', 'Prod nm', 'Hàng Hóa'.",
          "packing_quantity": "string | null - The number of individual items within a single packaging unit. Extract only the numeric value. This field usually goes under these column headers: 'Uom','SKU/OU', 'Buy/UM', 'Qty. inBox','Quy cách'. For double-row column layouts, look for 'Kích Thước' specifically where it is stacked directly underneath 'SL/KHI' within the same column header block.",
          "unit_of_measure": "string | null - The unit of measurement used for the product quantity. This field usually goes under these column headers: 'Đơn vị tính', 'ĐVT', 'Unit', 'ĐVT Unit', 'PO Unit', 'Ord unit', 'Đơn vị', 'UOM Đvt', 'Đ/V', 'Đơn vị cơ sở (Base Unit)'. For double-row column layouts, look for 'Màu' specifically where it is stacked directly underneath 'Đơn Vị Tính' within the same column header block.",
          "quantity": "string | null - The ordered or delivered quantity of the product item. Extract only the numeric value as a string. This field usually goes under these column headers: 'Số lượng đặt', 'SL', 'SL ĐẶT HÀNG', 'Order Qty', 'Qty Ord/Cs', 'PO Qty', 'Số lượng', 'SL thực nhận theo đơn vị cơ sở', 'OU Qty'",
          "unit_price": "string | null - The unit price or selling cost of a single product item. Extract only the numeric value as a string. This field usually goes under these column headers: 'Net Purchase Price', 'Unit Price', 'Đơn giá', 'Đơn giá chiết khấu', 'Net Buy Cost', 'Pur.Price - VAT', 'Sply prc', 'Cost Price after Discount'.",
          "total_amount": "string | null - The total monetary amount for this specific item line. Extract only the numeric value as a string. This field usually goes under these column headers: 'Thành tiền', 'Total Net Purchase Price', 'TẠM TÍNH', 'Sub Total', 'Extended Cost', 'Amount (-VAT)', 'Sply amt', 'Số tiền', 'Net amount', 'Tổng tiền'",
          "note": "string | null - Any line-specific comments, remarks, or promotional references associated with this product item. This field usually goes under these column headers: 'Note', 'Ghi chú (trên grid)', 'Ghi Chú Note', 'Free PO', 'Tài liệu tham khảo khuyến mãi'.",
          "unit_price_after_discount": "string | null - Unit price after discount",
          "vat_rate": "string | null - VAT rate",
          "vat_amount": "string | null - VAT amount",
          "discount_rate": "string | null - Discount rate",
          "discount_amount": "string | null - Discount amount",
          "store_code": "string | null - Store code",
          "store_name": "string | null - Store name",
          "buy_cost": "string | null - The original purchase cost per case. Only extract and populate this field if the column header explicitly matches 'Buy Cost' (including multi-line stacked headers like 'Buy' over 'Cost'); otherwise, return null.",
          "order_quantity_pcs": "string | null - The ordered quantity in pieces or base units. Only extract and populate this field if the column header explicitly matches 'Qty Ord/Pcs' (including multi-line stacked headers like 'Qty Ord/' over 'Pcs'); otherwise, return null.",
          "order_quantity_cs": "string | null - The ordered quantity in cases (CS). Only extract and populate this field if the column header explicitly matches 'Qty Ord/Cs' (including multi-line stacked headers like 'Qty Ord/' over 'Cs' or 'Qty Ord/CS'); otherwise, return null.",
          "order_quantity_base_unit_of_measure": "string | null - The Order Quantity by Base Unit. Only extract and populate this field if the column header explicitly matches 'SL Đặt Hàng Theo Đơn Vị Cơ Sở' OR a case-insensitive multi-line layout with 'SL Đặt Hàng' stacked over 'Theo Đơn Vị Cơ Sở'; otherwise, return null.",
          "base_unit": "string | null - The base unit of measure for the product. Only extract and populate this field if the column header explicitly matches 'Đơn Vị Cơ Sở', 'Base Unit', or a multi-line stacked layout where 'Đơn Vị' is on top, 'Cơ Sở' is in the middle, and '(Base Unit)' is at the bottom (case-insensitive). Extract the value directly below this header (e.g., 'Gói','Túi'); otherwise, return null.",
          "actual_receipt_quantity": "string | null - The Actual Receipt Quantity by Base Unit. Only extract and populate this field if the column header explicitly matches 'SL Thực Nhận Theo Đơn Vị Cơ Sở' OR a case-insensitive multi-line layout with 'SL Thực Nhận' stacked over 'Theo Đơn Vị Cơ Sở'; otherwise, return null.",
          "ou_type": "string | null - The operating or order unit type. Only extract and populate this field if the column header explicitly matches one of these exact names: 'OU Type'; otherwise, return null.",
          "free_quantity": "string | null - The free or promotional quantity. Only extract and populate this field if the column header explicitly matches one of these exact names: 'Free Qty'; otherwise, return null.",
          "lv": "string | null - The level indicator for the item line. Only extract and populate this field if the column header explicitly matches one of these exact names: 'LV'; otherwise, return null.",
          "sply_qty": "string | null - The quantity actually supplied or delivered by the supplier. Only extract and populate this field if the column header explicitly matches 'Sply qty' (case-insensitive); otherwise, return null.",
          "lotte_uom_quantity": "string | null - The packaging quantity code. Only extract and populate this field if the column header explicitly matches 'Uom' (case-insensitive); otherwise, return null.",
          "so_number": "string | null - SO number",
          "item_no": "integer | null - Item no"
        }
      ],
      "total_item_quantity": "string | null - Total item quantity",
      "total_item_amount": "string | null - Total item amount",
      "total_amount": "string | null - The total monetary amount calculated before VAT and discounts (net value). Strict rule: Extract only the explicitly printed value on the document; do not calculate or infer it, otherwise return null.",
      "vat_rate": "string | null - VAT rate",
      "vat_amount": "string | null - The total value-added tax (VAT) amount for the entire order summary. Strict rule: Extract only the explicitly printed value on the document; do not calculate or infer it, otherwise return null.",
      "discount_rate": "string | null - Discount rate",
      "discount_amount": "string | null - Discount amount",
      "total_payment": "string | null - The final gross payment amount including VAT and discounts (grand total). Strict rule: Extract only the explicitly printed value on the document; do not calculate or infer it, otherwise return null.",
      "total_quantity": "string | null - Total quantity",
      "total_cartons": "string | null - Total cartons",
      "total_number_items": "string | null - Total number items",
      "note": "string | null - The general order note or instructions located in the document header or footer section. This field usually goes under or after these labels: 'note', 'notes', 'ghi chú', 'Note | Ghi chú', 'Ghi chú / Other Comments or Special Instructions', 'Lưu ý / Attention', 'Lotte Mart'. If none of these labels are present, return null.",
      "important_note": "string | null - Crucial compliance or special requirements for the supplier. Only extract and populate this field if the document section explicitly contains the label: 'Nhà cung cấp lưu ý' (case-insensitive); otherwise, return null.",
      "remark": "string | null - General remarks or additional metadata for the order. Only extract and populate this field if the document explicitly contains a field label matching 'remark' or 'remarks' (case-insensitive); otherwise, return null.",
      "start_page": "integer | null - The start page (0-based) of this invoice in the PDF.",
      "end_page": "integer | null - The end page (0-based) of this invoice in the PDF."
    }
  ]
}

Output ONLY valid raw JSON. Do not wrap the JSON in markdown code blocks (e.g., do not use \`\`\`json ... \`\`\`). Do not include any conversational text, explanations, or metadata.`;

                const payload = {
                    "model": "local-std-03",
                    "max_tokens": 16000,
                    "temperature": 0.1,
                    "chat_template_kwargs": {"enable_thinking": false},
                    "messages": [{"role":"user","content":[
                      {"type":"image_url",
                      "image_url":{"url": base64DataUrl}},
                      {"type": "text", "text": mode === 'json' ? jsonPrompt : "# ROLE\nYou are an expert OCR and Data Extraction Assistant. Your task is to process images or PDFs of invoices, purchase notes, and receipts, extracting the content with 100% fidelity and formatting it into a strict Hybrid Markdown-HTML structure.\n\n# OBJECTIVE\nExtract all visible text and data from the provided document. You must preserve the logical reading order and apply specific formatting rules depending on whether the data is unstructured (free text) or structured (tabular data).\n\n# STRICT FORMATTING RULES\n\n1.  **Plain Text & Headers (Unstructured Data):**\n    * Standard paragraphs, warning notes (e.g., \"NHA CUNG CAP LUU Y...\"), page numbers, and footers MUST be output as plain text. Do not wrap them in HTML.\n    * Main document titles (e.g., \"PURCHASE NOTE\") MUST be formatted as Markdown Heading 1 (e.g., `# PURCHASE NOTE`).\n\n2.  **Key-Value Pairs & Totals:**\n    * Summary blocks outside of tables (like VAT calculations or Total amounts) MUST be formatted using Markdown Bold. \n    * Format: `**KEY : VALUE**` (e.g., `**TOTAL BF.TAX : 2.630.901**`).\n\n3.  **HTML Tables (Strictly for Structured Data):**\n    * ONLY data that is presented in a grid or table format in the original document may be converted to HTML.\n    * You MUST use standard HTML table tags: `<table border=\"1\">`, `<tr>`, `<th>` (for headers), and `<td>` (for data cells).\n    * **Multiline Cells:** If a single cell contains multiple lines of text (e.g., Addresses like \"CTY TNHH DV EB\\nSO 163...\"), you MUST replace the line breaks with `<br>` tags within the `<td>`.\n    * **Merged Cells:** If a row acts as a grouped summary (e.g., \"SALTY GROCERY(420)\"), you MUST use the `colspan` attribute appropriately (e.g., `<td colspan=\"5\" align=\"right\">`).\n    * Do NOT use Markdown tables (using `|`). ONLY use HTML for tables.\n\n4.  **No Conversational Text:**\n    * DO NOT include any conversational filler (e.g., \"Here is the extracted text...\", \"Sure!\"). Output ONLY the requested extraction.\n\n# FEW-SHOT EXAMPLE\nTo understand the exact expected output format, refer to the structure below:\n\n[User Input: An image of a Purchase Note]\n\n[Expected Output]\nEvaluation Warning : The document was created with Spire.PDF for .NET.\nNHA CUNG CAP LUU Y: NEU CO BAT KY SAI BIET GIA MUA, QUY CACH DAT HANG...\nNHA CUNG CAP PHAI DIEU CHINH VOI TRUNG TAM THU MUA BIG C TRUOC KHI GIAO HANG\npage 1 of 1\n\n# PURCHASE NOTE\n\n<table border=\"1\">\n  <tr>\n    <th>Order No</th>\n    <th>Order Date</th>\n    <th>Supplier Code</th>\n    <th>Com.Contract</th>\n    <th>Ad.Ch</th>\n  </tr>\n  <tr>\n    <td>2622056313735</td>\n    <td>30/05/26 07:40</td>\n    <td>0350139</td>\n    <td>N4040134</td>\n    <td>1</td>\n  </tr>\n</table>\n\n<table border=\"1\">\n  <tr>\n    <th>Ordered By</th>\n    <th>Delivered To</th>\n    <th>For Store</th>\n    <th>By Supplier</th>\n  </tr>\n  <tr>\n    <td>CTY TNHH DV EB<br>SO 163, DUONG PHAN DANG LUU<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>TOPS MARKET THAO DIEN (134)<br>TH LUNG, TN THAO DIEN PEARL, SO 12<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>TOPS MARKET THAO DIEN<br>TH LUNG, TN THAO DIEN PEARL, SO 12<br>HO CHI MINH<br><br>Vietnam</td>\n    <td>CONG TY CP TP CHOLIMEX<br>Lô C40-43/I, C51-55/II Ðu?ng S? 7,<br>Thành Ph? H? Chí Minh<br><br>Vietnam</td>\n  </tr>\n</table>\n\n**TOTAL BF.TAX : 2.630.901**\n**VAT 5% : 0**\n\nLuu Y: - Ncc vui long giao hang va xuat hoa don theo tung don hang va theo tung nhom hang.\n\n---\nNow, please process the attached document according to these strict rules."}
                    ]}]
                };

                const response = await axios.post('http://192.168.100.117:30414/v1/chat/completions', payload, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = response.data;
                const content = data.choices?.[0]?.message?.content || '';

                if (mode === 'json') {
                    let jsonContent = content;
                    
                    // Thử tìm block ```json ... ```
                    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch && jsonMatch[1]) {
                        jsonContent = jsonMatch[1].trim();
                    } else {
                        // Cắt bỏ text dư thừa, tìm từ { hoặc [ đầu tiên tới } hoặc ] cuối cùng
                        const firstBrace = content.indexOf('{');
                        const lastBrace = content.lastIndexOf('}');
                        const firstBracket = content.indexOf('[');
                        const lastBracket = content.lastIndexOf(']');
                        
                        let startIdx = firstBrace;
                        if (startIdx === -1 || (firstBracket !== -1 && firstBracket < startIdx)) startIdx = firstBracket;
                        
                        let endIdx = lastBrace;
                        if (endIdx === -1 || (lastBracket !== -1 && lastBracket > endIdx)) endIdx = lastBracket;
                        
                        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
                            jsonContent = content.substring(startIdx, endIdx + 1).trim();
                        }
                    }
                    
                    let parsedJson;
                    try {
                        parsedJson = JSON.parse(jsonContent);
                    } catch {
                        parsedJson = { raw: content };
                    }
                    return {
                        status: 'success',
                        markdownData: '',
                        jsonData: parsedJson,
                        errorMessage: undefined
                    };
                }

                return {
                    status: 'success',
                    markdownData: content,
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
                markdownData: mode === 'json' ? '' : errorMarkdown,
                jsonData: error.response?.data || { error: errorMessage },
                errorMessage: errorMessage
            };
        }
    }
}
