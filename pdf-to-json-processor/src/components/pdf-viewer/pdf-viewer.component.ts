import * as pdfjsLib from 'pdfjs-dist';

// Khởi tạo worker qua CDN để tránh lỗi Vite bundling cho Web Workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

import template from './pdf-viewer.html?raw';

export const PdfViewerComponent: ng.IComponentOptions = {
    bindings: {
        url: '<'
    },
    template,
    controller: class PdfViewerController {
        static $inject = ['$timeout'];
        
        public url!: string;
        public loading: boolean = false;
        public pageNum: number = 1;
        public totalPages: number = 0;
        public uniqueId: string = Math.random().toString(36).substring(7);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private pdfDoc: any = null;
        private $timeout: ng.ITimeoutService;
        
        constructor($timeout: ng.ITimeoutService) {
            this.$timeout = $timeout;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $onChanges(changes: any) {
            if (changes.url && changes.url.currentValue) {
                this.loadPDF(changes.url.currentValue);
            }
        }

        private async loadPDF(url: string) {
            this.$timeout(() => { this.loading = true; });
            try {
                const loadingTask = pdfjsLib.getDocument({ url: url });
                this.pdfDoc = await loadingTask.promise;
                this.$timeout(() => { 
                    this.totalPages = this.pdfDoc.numPages;
                    this.pageNum = 1; 
                });
                await this.renderPage(this.pageNum);
            } catch (err) {
                console.error("Lỗi tải PDF:", err);
            } finally {
                this.$timeout(() => { this.loading = false; });
            }
        }

        private async renderPage(num: number) {
            if (!this.pdfDoc) return;
            const page = await this.pdfDoc.getPage(num);
            
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas: HTMLCanvasElement = document.getElementById(`pdf-canvas-${this.uniqueId}`) as HTMLCanvasElement;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: ctx!,
                viewport: viewport
            };
            await page.render(renderContext).promise;
        }

        public nextPage() {
            if (this.pageNum >= this.totalPages) return;
            this.pageNum++;
            this.renderPage(this.pageNum);
        }

        public prevPage() {
            if (this.pageNum <= 1) return;
            this.pageNum--;
            this.renderPage(this.pageNum);
        }
    }
};
