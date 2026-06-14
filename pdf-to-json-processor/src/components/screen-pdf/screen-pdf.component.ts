import template from './screen-pdf.html?raw';
import type { PdfItem } from '../../models';
import * as pdfjsLib from 'pdfjs-dist';
// Bắt buộc import trực tiếp worker vào luồng chính (Main Thread) 
// để tránh lỗi CORS/Module khi tạo Web Worker hoặc khi fallback sang Fake Worker.
import 'pdfjs-dist/build/pdf.worker.mjs';

// Cấu hình không cần tải worker từ file rời nữa vì đã import trực tiếp
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export const ScreenPdfComponent: ng.IComponentOptions = {
    bindings: {
        item: '<'
    },
    template,
    controller: class ScreenPdfController {
        static $inject = ['$timeout', '$scope'];
        item!: PdfItem;
        
        public scale: number = 1.0;
        public rotation: number = 0;
        public pdfRendered: boolean = false;
        private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
        private $timeout: ng.ITimeoutService;
        private $scope: ng.IScope;

        constructor($timeout: ng.ITimeoutService, $scope: ng.IScope) {
            this.$timeout = $timeout;
            this.$scope = $scope;
        }

        get zoomPercent() {
            return Math.round(this.scale * 100);
        }

        zoomIn() {
            if (this.scale < 3.0) {
                this.scale += 0.2;
                this.renderPage();
            }
        }

        zoomOut() {
            if (this.scale > 0.4) {
                this.scale -= 0.2;
                this.renderPage();
            }
        }

        rotate() {
            this.rotation = (this.rotation + 90) % 360;
            this.renderPage();
        }

        private scrollContainer: HTMLElement | null = null;
        public isDragging = false;
        private startX = 0;
        private startY = 0;
        private scrollLeft = 0;
        private scrollTop = 0;
        private zoomDebounceTimer: ng.IPromise<void> | null = null;
        
        private onMouseDownBound = this.onMouseDown.bind(this);
        private onMouseMoveBound = this.onMouseMove.bind(this);
        private onMouseUpBound = this.onMouseUp.bind(this);
        private onWheelBound = this.onWheel.bind(this);

        private eventsBound = false;

        private bindEvents() {
            if (this.eventsBound) return;
            this.scrollContainer = document.getElementById(this.scrollContainerId);
            if (this.scrollContainer) {
                this.scrollContainer.addEventListener('mousedown', this.onMouseDownBound);
                this.scrollContainer.addEventListener('mousemove', this.onMouseMoveBound);
                this.scrollContainer.addEventListener('mouseup', this.onMouseUpBound);
                this.scrollContainer.addEventListener('mouseleave', this.onMouseUpBound);
                this.scrollContainer.addEventListener('wheel', this.onWheelBound, { passive: false });
                this.scrollContainer.style.cursor = 'grab';
                this.eventsBound = true;
            }
        }

        $postLink() {
            this.$timeout(() => this.bindEvents(), 100, false);
        }

        $onDestroy() {
            if (this.scrollContainer) {
                this.scrollContainer.removeEventListener('mousedown', this.onMouseDownBound);
                this.scrollContainer.removeEventListener('mousemove', this.onMouseMoveBound);
                this.scrollContainer.removeEventListener('mouseup', this.onMouseUpBound);
                this.scrollContainer.removeEventListener('mouseleave', this.onMouseUpBound);
                this.scrollContainer.removeEventListener('wheel', this.onWheelBound);
            }
        }

        onMouseDown(e: MouseEvent) {
            this.isDragging = true;
            if (this.scrollContainer) {
                this.scrollContainer.style.cursor = 'grabbing';
                this.startX = e.pageX - this.scrollContainer.offsetLeft;
                this.startY = e.pageY - this.scrollContainer.offsetTop;
                this.scrollLeft = this.scrollContainer.scrollLeft;
                this.scrollTop = this.scrollContainer.scrollTop;
            }
        }

        onMouseMove(e: MouseEvent) {
            if (!this.isDragging || !this.scrollContainer) return;
            e.preventDefault();
            const x = e.pageX - this.scrollContainer.offsetLeft;
            const y = e.pageY - this.scrollContainer.offsetTop;
            const walkX = (x - this.startX) * 1.5;
            const walkY = (y - this.startY) * 1.5;
            this.scrollContainer.scrollLeft = this.scrollLeft - walkX;
            this.scrollContainer.scrollTop = this.scrollTop - walkY;
        }

        onMouseUp() {
            this.isDragging = false;
            if (this.scrollContainer) {
                this.scrollContainer.style.cursor = 'grab';
            }
        }

        onWheel(e: WheelEvent) {
            if (e.ctrlKey) {
                e.preventDefault();
                const oldScale = this.scale;
                
                if (e.deltaY < 0) {
                    this.scale = Math.min(3.0, this.scale + 0.1);
                } else {
                    this.scale = Math.max(0.4, this.scale - 0.1);
                }
                
                if (oldScale !== this.scale) {
                    this.scale = Math.round(this.scale * 10) / 10;
                    this.$timeout(() => {});

                    if (this.zoomDebounceTimer) {
                        this.$timeout.cancel(this.zoomDebounceTimer);
                    }
                    this.zoomDebounceTimer = this.$timeout(() => {
                        this.renderPage();
                    }, 150);
                }
            }
        }

        private isLoadingPdf = false;
        public scrollContainerId = '';

        $onInit() {
            this.scrollContainerId = `pdf-scroll-container-${this.item.id}-${Math.random().toString(36).substr(2, 9)}`;
        }

        $doCheck() {
            if (this.item && this.item.status === 'success') {
                if (!this.pdfDoc && !this.isLoadingPdf && this.item.pdfUrl) {
                    this.isLoadingPdf = true;
                    this.loadPdf();
                }
            }
        }

        public pages: number[] = [];
        public debugMsg = '';

        async loadPdf() {
            this.debugMsg = 'Starting load...';
            try {
                const loadingTask = pdfjsLib.getDocument({ url: this.item.pdfUrl });
                this.debugMsg = 'Task created...';
                this.pdfDoc = await loadingTask.promise;
                this.debugMsg = `Loaded ${this.pdfDoc.numPages} pages`;
                this.$timeout(() => {
                    this.pages = Array.from({ length: this.pdfDoc!.numPages }, (_, i) => i + 1);
                    this.renderPage();
                });
            } catch (e: unknown) {
                const err = e as Error;
                this.debugMsg = 'Load Error: ' + (err.message || err);
                console.error("Error loading PDF via pdfjs-dist:", e);
            }
        }

        async renderPage() {
            if (!this.pdfDoc) return;
            
            this.$timeout(() => {
                this.pdfRendered = false;
                this.debugMsg = 'Starting render loop...';
            });

            try {
                this.$timeout(async () => {
                    for (const pageNum of this.pages) {
                        try {
                            this.debugMsg = `Rendering page ${pageNum}...`;
                            const page = await this.pdfDoc!.getPage(pageNum);
                            const viewport = page.getViewport({ scale: this.scale, rotation: this.rotation });
                            
                            const canvasId = `pdf-viewer-${this.scrollContainerId}-${pageNum}`;
                            let canvas = document.getElementById(canvasId) as HTMLCanvasElement;
                            
                            // Retry logic if ng-repeat hasn't rendered canvas yet
                            for (let i = 0; i < 5 && !canvas; i++) {
                                await new Promise(r => setTimeout(r, 100));
                                canvas = document.getElementById(canvasId) as HTMLCanvasElement;
                            }

                            if (!canvas) {
                                this.debugMsg = `Canvas missing for page ${pageNum}`;
                                continue;
                            }
                            
                            const context = canvas.getContext('2d');
                            if (!context) continue;

                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const renderContext: any = {
                                canvasContext: context,
                                viewport: viewport
                            };
                            
                            await page.render(renderContext).promise;
                        } catch (pageErr: unknown) {
                            const err = pageErr as Error;
                            this.debugMsg = `Render error page ${pageNum}: ` + (err.message || err);
                            console.error(`Error rendering page ${pageNum}:`, pageErr);
                        }
                    }
                    
                    this.$timeout(() => {
                        this.pdfRendered = true;
                        this.debugMsg = 'Done';
                        this.$scope.$emit('PDF_RENDERED', this.item.id);
                    });
                }, 150);
            } catch (err: unknown) {
                const error = err as Error;
                this.debugMsg = 'Loop error: ' + (error.message || err);
                console.error('Error in renderPages loop:', err);
                this.$timeout(() => {
                    this.pdfRendered = true; // fallback
                });
            }
        }
    }
};
