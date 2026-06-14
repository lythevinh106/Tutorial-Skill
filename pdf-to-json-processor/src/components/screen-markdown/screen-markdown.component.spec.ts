import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScreenMarkdownController } from './screen-markdown.component';
import type { PdfItem } from '../../models';

/* eslint-disable @typescript-eslint/no-explicit-any */

vi.mock('dompurify', () => {
    return {
        default: {
            sanitize: (html: string) => html
        }
    };
});

describe('ScreenMarkdownController', () => {
    let controller: ScreenMarkdownController;
    let mockSce: any;
    let mockTimeout: any;
    let mockToaster: any;
    let mockScope: any;
    let mockUibModal: any;

    beforeEach(() => {
        // Mock $sce service của AngularJS
        mockSce = {
            trustAsResourceUrl: vi.fn((url) => 'safe:' + url),
            trustAsHtml: vi.fn((html) => 'safe:' + html)
        };
        mockTimeout = vi.fn((fn) => fn && fn());
        mockToaster = {
            pop: vi.fn()
        };
        mockScope = {
            $watch: vi.fn(),
            $applyAsync: vi.fn()
        };
        mockUibModal = {
            open: vi.fn()
        };
        const mockCaptureService = {
            captureOffscreen: vi.fn()
        };
        
        controller = new ScreenMarkdownController(mockSce, mockTimeout, mockToaster, mockScope, mockUibModal, mockCaptureService as any);
    });

    it('hiển thị lỗi khi status = error', () => {
        const item: PdfItem = {
            id: '1',
            name: 'test.pdf',
            pdfUrl: 'blob:test',
            status: 'error',
            markdownData: '',
            jsonData: null
        };

        controller.$onChanges({ item: { currentValue: item } } as any);
        expect(mockSce.trustAsHtml).toHaveBeenCalledWith(expect.stringContaining('<h1>Có lỗi xảy ra</h1>'));
    });

    it('lọc DOMPurify và parse Markdown khi status = success', () => {
        const item: PdfItem = {
            id: '1',
            name: 'test.pdf',
            pdfUrl: 'blob:test',
            status: 'success',
            markdownData: '# Heading 1',
            jsonData: null
        };

        controller.$onChanges({ item: { currentValue: item } } as any);
        expect(mockSce.trustAsHtml).toHaveBeenCalledWith(expect.stringContaining('<h1>Heading 1</h1>'));
    });
});
