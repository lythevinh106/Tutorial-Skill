import { IndexedDBHelper } from '../utils/indexed-db.helper';
import type { PdfItem } from '../models';

export const db = new IndexedDBHelper<PdfItem>('PdfProcessorDB', 'pdf_queue', 1, 'id');
