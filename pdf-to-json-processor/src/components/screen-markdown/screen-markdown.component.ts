import MarkdownIt from 'markdown-it';
import hljs from 'markdown-it-highlightjs';
import DOMPurify from 'dompurify';
import type { PdfItem } from '../../models';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../services/db';
import html2canvas from 'html2canvas';
import { CaptureModalController } from '../capture-modal/capture-modal.controller';
import captureModalTemplate from '../capture-modal/capture-modal.html?raw';
// @ts-expect-error missing types for markdown-it-mark
import markPlugin from 'markdown-it-mark';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
}).use(hljs).use(markPlugin);

export class ScreenMarkdownController implements ng.IController {
    static $inject = ['$sce', '$timeout', 'toaster', '$scope', '$uibModal'];
    public item!: PdfItem;
    public onDelete?: () => void;
    public onUpdate?: () => void;
    
    public viewMode: 'beauty' | 'raw' | 'html' = 'beauty';
    public safeHtml: string = '';
    public rawHtmlString: string = '';
    public rawMarkdownString: string = '';
    public isDirty: boolean = false;
    public isCapturing: boolean = false;
    private $sce: ng.ISCEService;
    private $timeout: ng.ITimeoutService;
    private toaster: IToasterService;
    private $scope: ng.IScope;
    private $uibModal: angular.ui.bootstrap.IModalService;

    constructor($sce: ng.ISCEService, $timeout: ng.ITimeoutService, toaster: IToasterService, $scope: ng.IScope, $uibModal: angular.ui.bootstrap.IModalService) {
        this.$sce = $sce;
        this.$timeout = $timeout;
        this.toaster = toaster;
        this.$scope = $scope;
        this.$uibModal = $uibModal;
    }

    public $onInit() {
        this.$scope.$watch('$ctrl.item.markdownData', (newVal: string) => {
            if (newVal !== undefined && newVal !== this.rawMarkdownString && this.item) {
                this.processItem(this.item);
            }
        });
    }

    public $onChanges(changes: ng.IOnChangesObject): void {
        if (changes.item && changes.item.currentValue) {
            this.processItem(changes.item.currentValue);
        }
    }

    private processItem(item: PdfItem): void {
        let markdownContent = item.markdownData || '';
        
        if (item.status === 'error') {
            markdownContent = item.markdownData || '# Có lỗi xảy ra';
        }
        
        this.rawMarkdownString = markdownContent;
        
        const rawHtml = md.render(markdownContent);
        this.rawHtmlString = rawHtml;
        
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        this.safeHtml = this.$sce.trustAsHtml(cleanHtml);
    }
    
    public setViewMode(mode: 'beauty' | 'raw' | 'html') {
        this.viewMode = mode;
    }

    public onRawMarkdownChange() {
        if (!this.item) return;
        this.item.markdownData = this.rawMarkdownString;
        this.isDirty = true;
        
        // Re-render HTML manually
        const rawHtml = md.render(this.rawMarkdownString);
        this.rawHtmlString = rawHtml;
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        this.safeHtml = this.$sce.trustAsHtml(cleanHtml);
    }

    public saveChanges() {
        if (!this.item || !this.isDirty) return;
        db.put(this.item as PdfItem);
        this.isDirty = false;
        
        if (this.onUpdate) {
            this.onUpdate();
        } else {
            this.toaster.pop('warning', '', 'Queue Updated - Markdown changes saved.');
        }
    }

    public handleKeydown(event: KeyboardEvent) {
        if (event.ctrlKey && (event.key.toLowerCase() === 'd' || event.key.toLowerCase() === 'b')) {
            event.preventDefault(); // Prevent browser bookmark dialog or bold command

            const target = event.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            if (start !== end) {
                const selectedText = this.rawMarkdownString.substring(start, end);
                const beforeText = this.rawMarkdownString.substring(0, start);
                const afterText = this.rawMarkdownString.substring(end);

                const isYellow = beforeText.endsWith('<mark>') && afterText.startsWith('</mark>');
                const isRed = beforeText.endsWith('<mark class="red-mark">') && afterText.startsWith('</mark>');

                const isD = event.key.toLowerCase() === 'd';
                const isB = event.key.toLowerCase() === 'b';

                let newString = '';
                let newStart = start;
                let newEnd = end;

                // Strip existing if any
                let cleanBefore = beforeText;
                let cleanAfter = afterText;
                if (isYellow) {
                    cleanBefore = beforeText.slice(0, -6);
                    cleanAfter = afterText.slice(7);
                } else if (isRed) {
                    cleanBefore = beforeText.slice(0, -23);
                    cleanAfter = afterText.slice(7);
                }

                if ((isD && isYellow) || (isB && isRed)) {
                    // Toggle off
                    newString = cleanBefore + selectedText + cleanAfter;
                    newStart = cleanBefore.length;
                    newEnd = cleanBefore.length + selectedText.length;
                } else if (isD) {
                    // Apply Yellow (even if overriding Red)
                    newString = cleanBefore + '<mark>' + selectedText + '</mark>' + cleanAfter;
                    newStart = cleanBefore.length + 6;
                    newEnd = cleanBefore.length + 6 + selectedText.length;
                } else if (isB) {
                    // Apply Red (even if overriding Yellow)
                    newString = cleanBefore + '<mark class="red-mark">' + selectedText + '</mark>' + cleanAfter;
                    newStart = cleanBefore.length + 23;
                    newEnd = cleanBefore.length + 23 + selectedText.length;
                }

                this.rawMarkdownString = newString;
                this.onRawMarkdownChange();
                
                // Restore cursor selection after DOM updates
                this.$timeout(() => {
                    target.setSelectionRange(newStart, newEnd);
                    target.focus();
                });
            }
        }
    }

    public async downloadItem() {
        try {
            if (!this.item.pdfUrl || !this.item.markdownData) return;
            
            const zip = new JSZip();
            const folderName = this.item.name.replace(/\.[^/.]+$/, "");
            const folder = zip.folder(folderName);
            if (!folder) return;

            const pdfResponse = await fetch(this.item.pdfUrl);
            const pdfBlob = await pdfResponse.blob();
            folder.file(this.item.name, pdfBlob);

            folder.file(`${folderName}.md`, this.item.markdownData);

            // Capture the on-screen element directly
            const captureZone = document.getElementById(`capture-zone-${this.item.id}`);
            if (captureZone) {
                try {
                    const canvasObj = await html2canvas(captureZone, {
                        useCORS: true,
                        allowTaint: true,
                        scale: 1,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });
                    const pngBlob = await new Promise<Blob | null>(res => canvasObj.toBlob(res, 'image/png'));
                    if (pngBlob) {
                        folder.file(`${folderName}-capture.png`, pngBlob);
                    }
                } catch (e) {
                    console.error("Failed to capture PNG:", e);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${folderName}.zip`);
            
            // Show success toast
            this.toaster.pop('success', '', 'API Call Successful - Data synchronized.');
        } catch (error) {
            console.error("Error downloading item:", error);
            // Show error toast
            this.toaster.pop('error', '', 'Error - Failed to download queue item.');
        }
    }

    public copyMarkdown() {
        if (!this.rawMarkdownString) return;
        navigator.clipboard.writeText(this.rawMarkdownString).then(() => {
            this.$timeout(() => {
                this.toaster.pop('success', '', 'Markdown copied to clipboard!');
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.$timeout(() => {
                this.toaster.pop('error', '', 'Failed to copy markdown to clipboard.');
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async captureQueue($event: any) {
        const target = $event.target as HTMLElement;
        const node = target.closest('.capture-zone') as HTMLElement;
        if (!node) {
            this.toaster.pop('error', '', 'Could not find the capture area.');
            return;
        }

        // Generate a unique ID for the modal to use for exporting if needed,
        // or just let the modal know the dataUrl. The modal needs the elementId to export SVG/PNG again?
        // Wait, the modal exports from the DOM node! If the modal is open, the original node might be in the background.
        // It's safe to give the node an ID temporarily.
        let elementId = node.id;
        if (!elementId) {
            elementId = `capture-zone-${Date.now()}`;
            node.id = elementId;
        }

        this.isCapturing = true;
        this.toaster.pop('info', '', 'Capturing workspace...');

        try {
            // Force a digest to update UI if needed
            this.$scope.$applyAsync();
            
            // Allow DOM to settle before capturing
            await new Promise(r => setTimeout(r, 100));
            
            const canvasObj = await html2canvas(node, {
                useCORS: true,
                allowTaint: true,
                scale: 1,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const dataUrl = canvasObj.toDataURL('image/png');
            
            // Try to copy to clipboard
            try {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                this.toaster.pop('success', '', 'Image captured and copied to clipboard!');
            } catch (err) {
                console.warn('Failed to auto-copy image to clipboard', err);
            }

            this.$uibModal.open({
                animation: false,
                template: captureModalTemplate,
                controller: CaptureModalController,
                controllerAs: '$ctrl',
                size: 'xl',
                windowClass: 'capture-modal-window',
                resolve: {
                    imageUrl: () => dataUrl
                }
            });
        } catch (error) {
            const err = error as { message?: string };
            console.error('Error capturing screen:', err);
            this.toaster.pop('error', '', `Capture Failed: ${err?.message || JSON.stringify(err) || err}`);
        } finally {
            this.$timeout(() => {
                this.isCapturing = false;
            });
        }
    }
}

export const ScreenMarkdownComponent: ng.IComponentOptions = {
    bindings: {
        item: '<',
        onDelete: '&?',
        onUpdate: '&?',
        isModalView: '<?'
    },
    controller: ScreenMarkdownController,
    template: `
        <div class="p-4 border-b border-whisper-border flex flex-col gap-4 bg-white/30 backdrop-blur-md">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-electric-ocean">markdown</span>
                    <div class="flex flex-col">
                        <span class="text-[12px] font-bold text-charcoal-ink">Markdown Preview</span>
                        <span class="text-[10px] text-muted-steel">Parsed Output</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button ng-click="$ctrl.captureQueue($event)" ng-disabled="$ctrl.isCapturing" ng-class="{'opacity-50 cursor-not-allowed': $ctrl.isCapturing}" class="bg-white border border-outline-variant/30 px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 hover:bg-surface-variant transition-colors shadow-sm">
                        <span class="material-symbols-outlined text-[14px]">photo_camera</span> 
                        {{ $ctrl.isCapturing ? 'Capturing...' : 'Capture' }}
                    </button>
                    <button ng-if="$ctrl.isDirty && !$ctrl.onUpdate" ng-click="$ctrl.saveChanges()" class="bg-[#10B981] text-white px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[14px]">save</span> Save
                    </button>
                    <button ng-click="$ctrl.copyMarkdown()" class="bg-white border border-outline-variant/30 px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 hover:bg-surface-variant transition-colors shadow-sm">
                        <span class="material-symbols-outlined text-[14px]">content_copy</span> Copy
                    </button>
                </div>
            </div>
            <!-- View Mode Toggles -->
            <div class="flex bg-white/50 p-1 rounded-lg self-start border border-white/40 shadow-sm">
                <button ng-click="$ctrl.setViewMode('beauty')" ng-class="{'bg-white shadow-sm text-electric-ocean': $ctrl.viewMode === 'beauty', 'text-muted-steel hover:text-charcoal-ink': $ctrl.viewMode !== 'beauty'}" class="px-3 py-1 rounded-md text-[12px] font-medium transition-all">Beauty (Rendered)</button>
                <button ng-click="$ctrl.setViewMode('raw')" ng-class="{'bg-white shadow-sm text-electric-ocean': $ctrl.viewMode === 'raw', 'text-muted-steel hover:text-charcoal-ink': $ctrl.viewMode !== 'raw'}" class="px-3 py-1 rounded-md text-[12px] font-medium transition-all">Raw Markdown</button>
                <button ng-click="$ctrl.setViewMode('html')" ng-class="{'bg-white shadow-sm text-electric-ocean': $ctrl.viewMode === 'html', 'text-muted-steel hover:text-charcoal-ink': $ctrl.viewMode !== 'html'}" class="px-3 py-1 rounded-md text-[12px] font-medium transition-all">HTML Source</button>
            </div>
        </div>
        
        <div class="flex-1 p-8 overflow-y-auto custom-scrollbar font-code-md text-[13px] leading-relaxed relative">
            <!-- Rendered Output -->
            <div ng-if="$ctrl.viewMode === 'beauty'" class="prose max-w-none text-charcoal-ink text-[13px]" ng-bind-html="$ctrl.safeHtml"></div>
            
            <!-- Raw Markdown -->
            <textarea ng-if="$ctrl.viewMode === 'raw'" 
                ng-model="$ctrl.rawMarkdownString" 
                ng-change="$ctrl.onRawMarkdownChange()" 
                ng-keydown="$ctrl.handleKeydown($event)" 
                class="w-full h-full whitespace-pre-wrap font-code-md text-muted-steel bg-white/40 p-4 rounded-xl border border-white/60 shadow-inner overflow-y-auto resize-none outline-none focus:border-electric-ocean transition-colors"
                placeholder="Type your markdown here... Select text and press Ctrl+D to highlight."
            ></textarea>
            
            <!-- HTML Source -->
            <pre ng-if="$ctrl.viewMode === 'html'" class="whitespace-pre-wrap font-code-md text-muted-steel bg-white/40 p-4 rounded-xl border border-white/60 shadow-inner h-full overflow-y-auto">{{ $ctrl.rawHtmlString }}</pre>
        </div>
        
        <div ng-if="!$ctrl.isModalView" class="p-4 bg-white/50 border-t border-whisper-border flex justify-between items-center shrink-0">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" ng-class="{'bg-[#10B981]': $ctrl.item.status === 'success', 'bg-error': $ctrl.item.status === 'error'}"></div>
                <span class="text-[11px] font-medium text-muted-steel">
                    {{ $ctrl.item.status === 'success' ? 'Parsing Complete' : 'Parsing Failed' }}
                </span>
            </div>
            <div class="flex items-center gap-3">
                <button ng-if="$ctrl.onDelete" ng-click="$ctrl.onDelete()" class="p-2 rounded-full border border-whisper-border bg-white/50 text-error hover:bg-error-container transition-colors flex items-center justify-center w-10 h-10 shadow-sm" title="Delete Queue">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
                <button ng-if="$ctrl.onUpdate && $ctrl.isDirty" ng-click="$ctrl.saveChanges()" class="px-5 py-2 rounded-full bg-surface-container-lowest border border-whisper-border text-charcoal-ink font-medium text-[12px] hover:bg-white shadow-sm transition-transform active:translate-y-px">Update Markdown</button>
                <button ng-click="$ctrl.downloadItem()" class="bg-electric-ocean text-white rounded-full px-6 py-2 font-label-sm text-[12px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
                    <span class="material-symbols-outlined text-[16px]">download</span> Download Queue
                </button>
            </div>
        </div>
    `
};
