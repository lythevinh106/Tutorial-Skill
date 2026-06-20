import type { PdfItem } from '../../models';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../services/db';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export class DocumentModalController {
    static $inject = ['$uibModalInstance', 'item', 'toaster', 'CaptureService', '$timeout'];
    item: PdfItem;
    originalMarkdown: string;
    public isDownloading: boolean = false;
    private $uibModalInstance: angular.ui.bootstrap.IModalInstanceService;
    private $timeout: ng.ITimeoutService;
    private toaster: IToasterService;
    private CaptureService: import('../../services/capture.service').CaptureService;

    constructor($uibModalInstance: angular.ui.bootstrap.IModalInstanceService, item: PdfItem, toaster: IToasterService, CaptureService: import('../../services/capture.service').CaptureService, $timeout: ng.ITimeoutService) {
        this.$uibModalInstance = $uibModalInstance;
        this.item = item;
        this.toaster = toaster;
        this.CaptureService = CaptureService;
        this.$timeout = $timeout;
        this.originalMarkdown = item.markdownData || '';
    }

    close() {
        this.$uibModalInstance.dismiss('cancel');
    }

    deleteQueue() {
        this.$uibModalInstance.close('delete');
    }

    updateMarkdown() {
        db.put(this.item);
        this.originalMarkdown = this.item.markdownData || '';
        this.toaster.pop('warning', '', 'Queue Updated - Markdown changes saved.');
        this.$uibModalInstance.close('update');
    }

    updateJson(jsonData: unknown, jsonHighlights: import('../../models').IJsonHighlight[]) {
        this.item.jsonData = jsonData;
        this.item.jsonHighlights = jsonHighlights;
        db.put(this.item);
        this.toaster.pop('warning', '', 'Queue Updated - JSON changes saved.');
        this.$uibModalInstance.close('update');
    }

    async downloadQueue() {
        if (this.isDownloading) return;
        this.isDownloading = true;
        try {
            if (!this.item.pdfUrl || !this.item.markdownData) return;
            
            this.toaster.pop('info', '', 'Preparing ZIP archive...');
            const zip = new JSZip();
            const folderName = this.item.name.replace(/\.[^/.]+$/, "");
            const folder = zip.folder(folderName);
            if (!folder) return;

            const pdfResponse = await fetch(this.item.pdfUrl);
            const pdfBlob = await pdfResponse.blob();
            folder.file(this.item.name, pdfBlob);

            if (this.item.mode === 'json' && this.item.jsonData) {
                const jsonStr = typeof this.item.jsonData === 'string' ? this.item.jsonData : JSON.stringify(this.item.jsonData, null, 2);
                folder.file(`${folderName}.json`, jsonStr);
            } else if (this.item.markdownData) {
                folder.file(`${folderName}.md`, this.item.markdownData);
            }

            try {
                this.toaster.pop('info', '', `Generating screen capture...`);
                const pngBlob = await this.CaptureService.captureOffscreen(this.item);
                folder.file(`${folderName}-capture.png`, pngBlob);
            } catch (e) {
                console.error("Failed to capture PNG:", e);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${folderName}.zip`);
            
            this.toaster.pop('success', '', 'Archive downloaded successfully.');
        } catch (error) {
            console.error("Error downloading item:", error);
            this.toaster.pop('error', '', 'Error - Failed to download queue item.');
        } finally {
            this.$timeout(() => {
                this.isDownloading = false;
            });
        }
    }

    downloadJson() {
        if (!this.item.jsonData) return;
        const jsonString = JSON.stringify(this.item.jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${this.item.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
