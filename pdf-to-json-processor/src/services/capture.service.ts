import html2canvas from 'html2canvas';
import type { PdfItem } from '../models';

export class CaptureService {
    static $inject = ['$compile', '$rootScope', '$timeout'];
    private $compile: ng.ICompileService;
    private $rootScope: ng.IRootScopeService;
    private $timeout: ng.ITimeoutService;

    constructor($compile: ng.ICompileService, $rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService) {
        this.$compile = $compile;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
    }

    async captureOffscreen(item: PdfItem): Promise<Blob> {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const scope = this.$rootScope.$new(true) as any;
            scope.item = item;

            // Create offscreen container
            const container = document.createElement('div');
            container.id = `offscreen-capture-${item.id}`;
            container.className = 'flex flex-col lg:flex-row flex-grow overflow-hidden bg-white/10 min-h-0 capture-zone';
            container.style.position = 'fixed';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            container.style.width = '1920px';
            container.style.height = '1080px';
            container.style.opacity = '1';
            container.style.pointerEvents = 'none';

            container.innerHTML = `
                <div class="w-full lg:w-1/2 flex flex-col relative h-full">
                    <screen-pdf item="item" class="h-full w-full"></screen-pdf>
                </div>
                <div class="w-full lg:w-1/2 flex flex-col h-full bg-slate-50/50 backdrop-blur-xl relative border-l border-whisper-border">
                    <screen-markdown item="item" is-modal-view="true" class="h-full w-full flex flex-col"></screen-markdown>
                </div>
            `;

            document.body.appendChild(container);
            this.$compile(container)(scope);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cleanup = scope.$on('PDF_RENDERED', async (_event: any, itemId: string) => {
                if (itemId === item.id) {
                    cleanup();
                    
                    try {
                        // Allow DOM to settle
                        await new Promise(r => setTimeout(r, 500));

                        const canvasObj = await html2canvas(container, {
                            useCORS: true,
                            allowTaint: true,
                            scale: 1,
                            logging: false,
                            backgroundColor: '#ffffff',
                            width: 1920,
                            height: 1080
                        });

                        const blob = await new Promise<Blob | null>(res => canvasObj.toBlob(res, 'image/png'));
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob from canvas'));
                        }
                    } catch (err) {
                        reject(err);
                    } finally {
                        if (document.body.contains(container)) {
                            document.body.removeChild(container);
                        }
                        scope.$destroy();
                    }
                }
            });

            // Timeout fallback
            this.$timeout(() => {
                cleanup();
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
                scope.$destroy();
                reject(new Error('Timeout waiting for PDF to render'));
            }, 15000);
        });
    }
}
