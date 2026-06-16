import { domToBlob } from 'modern-screenshot';
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
                <div class="w-full lg:w-1/2 flex flex-col relative h-full bg-surface-container-low/50 overflow-hidden">
                    <screen-pdf ng-if="!item.fileType || item.fileType.includes('pdf')" item="item" class="h-full w-full block"></screen-pdf>
                    <div ng-if="item.fileType && item.fileType.includes('image')" class="flex-1 w-full h-full flex items-start justify-center p-4 overflow-auto custom-scrollbar">
                        <img ng-src="{{item.pdfUrl}}" class="max-w-full max-h-[1000px] object-contain shadow-lg rounded" alt="{{item.name}}" />
                    </div>
                </div>
                <div class="w-full lg:w-1/2 flex flex-col h-full bg-slate-50/50 backdrop-blur-xl relative border-l border-whisper-border">
                    <screen-markdown item="item" is-modal-view="true" class="h-full w-full flex flex-col"></screen-markdown>
                </div>
            `;

            document.body.appendChild(container);
            this.$compile(container)(scope);

            const isImage = item.fileType && item.fileType.includes('image');

            if (isImage) {
                // For images, don't wait for PDF_RENDERED. Just wait briefly for image to load.
                this.$timeout(async () => {
                    try {
                        const blob = await domToBlob(container, {
                            scale: 1,
                            backgroundColor: '#ffffff',
                            width: 1920,
                            height: 1080
                        });
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
                }, 1500); // Give image 1.5s to fully render
            } else {
                // For PDFs, wait for the component to emit PDF_RENDERED
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cleanup = scope.$on('PDF_RENDERED', async (_event: any, itemId: string) => {
                    if (itemId === item.id) {
                        cleanup();
                        
                        try {
                            // Allow DOM to settle
                            await new Promise(r => setTimeout(r, 500));

                            const blob = await domToBlob(container, {
                                scale: 1,
                                backgroundColor: '#ffffff',
                                width: 1920,
                                height: 1080
                            });

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
            }

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
