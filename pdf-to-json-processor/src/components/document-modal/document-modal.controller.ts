import type { PdfItem } from '../../models';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../services/db';
import html2canvas from 'html2canvas';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export class DocumentModalController {
    static $inject = ['$uibModalInstance', 'item', 'toaster', 'CaptureService'];
    item: PdfItem;
    originalMarkdown: string;
    private $uibModalInstance: angular.ui.bootstrap.IModalInstanceService;
    private toaster: IToasterService;
    private CaptureService: import('../../services/capture.service').CaptureService;

    constructor($uibModalInstance: angular.ui.bootstrap.IModalInstanceService, item: PdfItem, toaster: IToasterService, CaptureService: import('../../services/capture.service').CaptureService) {
        this.$uibModalInstance = $uibModalInstance;
        this.item = item;
        this.toaster = toaster;
        this.CaptureService = CaptureService;
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

    async downloadQueue() {
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

            folder.file(`${folderName}.md`, this.item.markdownData);

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
