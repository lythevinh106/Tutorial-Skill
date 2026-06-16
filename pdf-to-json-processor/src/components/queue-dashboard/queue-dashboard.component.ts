import template from './queue-dashboard.html?raw';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../services/db';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export const QueueDashboardComponent: ng.IComponentOptions = {
    template,
    bindings: {
        onSelect: '&'
    },
    controller: class QueueDashboardController {
        static $inject = ['QueueService', '$element', '$scope', 'toaster', 'CaptureService'];
        public QueueService: import('../../services/queue.service').QueueService;
        public CaptureService: import('../../services/capture.service').CaptureService;
        private $element: ng.IAugmentedJQuery;
        private $scope: ng.IScope;
        public toaster: IToasterService;
        public isSplitMode: boolean = false;
        public isConvertMode: boolean = false;

        constructor(QueueService: import('../../services/queue.service').QueueService, $element: ng.IAugmentedJQuery, $scope: ng.IScope, toaster: IToasterService, CaptureService: import('../../services/capture.service').CaptureService) {
            this.QueueService = QueueService;
            this.CaptureService = CaptureService;
            this.$element = $element;
            this.$scope = $scope;
            this.toaster = toaster;
        }

        onConvertModeChange() {
            if (this.isConvertMode) {
                this.isSplitMode = true;
            }
        }

        $postLink() {
            const fileInput = this.$element[0].querySelector('#fileUpload') as HTMLInputElement;
            const uploadZone = this.$element[0].querySelector('.upload-zone') as HTMLElement;

            if (fileInput) {
                fileInput.addEventListener('change', (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    const files = target.files;
                    if (files && files.length > 0) {
                        this.processFiles(files);
                        fileInput.value = '';
                    }
                });
            }

            if (uploadZone) {
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('border-electric-ocean', 'bg-white/75');
                });
                
                uploadZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('border-electric-ocean', 'bg-white/75');
                });
                
                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('border-electric-ocean', 'bg-white/75');
                    const files = e.dataTransfer?.files;
                    if (files && files.length > 0) {
                        this.processFiles(files);
                    }
                });
            }
        }
        
        private async processFiles(files: FileList | File[]) {
            if (this.isConvertMode) {
                const convertedFiles: File[] = [];
                this.toaster.pop('info', 'Converting PDF', 'Converting PDF pages to high-resolution images...');
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type !== 'application/pdf') {
                        convertedFiles.push(file);
                        continue;
                    }
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        const pageCount = pdfDoc.numPages;

                        for (let j = 1; j <= pageCount; j++) {
                            const page = await pdfDoc.getPage(j);
                            const viewport = page.getViewport({ scale: 2.0 });
                            
                            const canvas = document.createElement('canvas');
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
                            
                            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
                            if (blob) {
                                const newName = file.name.replace(/\.pdf$/i, `_Page_${j}.png`);
                                const splitFile = new File([blob], newName, { type: 'image/png' });
                                convertedFiles.push(splitFile);
                            }
                        }
                    } catch (err) {
                        console.error('Error converting PDF to Image', err);
                        this.toaster.pop('error', 'Error', `Failed to convert ${file.name} to images.`);
                        convertedFiles.push(file);
                    }
                }
                this.QueueService.enqueue(convertedFiles as unknown as FileList);
            } else if (this.isSplitMode) {
                const splitFiles: File[] = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type !== 'application/pdf') {
                        splitFiles.push(file);
                        continue;
                    }
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdfDoc = await PDFDocument.load(arrayBuffer);
                        const pageCount = pdfDoc.getPageCount();
                        
                        for (let j = 0; j < pageCount; j++) {
                            const newPdf = await PDFDocument.create();
                            const [copiedPage] = await newPdf.copyPages(pdfDoc, [j]);
                            newPdf.addPage(copiedPage);
                            
                            const pdfBytes = await newPdf.save();
                            const newName = file.name.replace(/\.pdf$/i, `_Page_${j + 1}.pdf`);
                            const splitFile = new File([pdfBytes as unknown as BlobPart], newName, { type: 'application/pdf' });
                            splitFiles.push(splitFile);
                        }
                    } catch (err) {
                        console.error('Error splitting PDF', err);
                        splitFiles.push(file);
                    }
                }
                this.QueueService.enqueue(splitFiles as unknown as FileList);
            } else {
                this.QueueService.enqueue(files);
            }
            this.$scope.$applyAsync();
        }
        
        clearCompleted() {
            const completed = this.QueueService.items.filter(item => item.status === 'success');
            if (completed.length > 0) {
                completed.forEach(c => db.delete(c.id));
                this.QueueService.items = this.QueueService.items.filter(item => item.status !== 'success');
                this.toaster.pop('success', '', 'All completed documents deleted successfully.');
            }
        }

        public async downloadAllCompleted() {
            const completedItems = this.QueueService.items.filter(i => i.status === 'success');
            if (completedItems.length === 0) return;

            try {
                const zip = new JSZip();
                
                for (const item of completedItems) {
                    if (!item.pdfUrl || !item.markdownData) continue;
                    
                    const folderName = item.name.replace(/\.[^/.]+$/, "");
                    const folder = zip.folder(folderName);
                    if (!folder) continue;

                    const pdfResponse = await fetch(item.pdfUrl);
                    const pdfBlob = await pdfResponse.blob();
                    folder.file(item.name, pdfBlob);

                    folder.file(`${folderName}.md`, item.markdownData);

                    try {
                        this.toaster.pop('info', '', `Generating screen capture for ${item.name}...`);
                        const pngBlob = await this.CaptureService.captureOffscreen(item);
                        folder.file(`${folderName}-capture.png`, pngBlob);
                    } catch (e) {
                        console.error(`Failed to capture PNG for ${item.name}:`, e);
                        this.toaster.pop('warning', '', `Could not generate capture for ${item.name}`);
                    }
                }

                this.toaster.pop('info', '', 'Archiving ZIP file...');
                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, 'Completed_Queue.zip');
                this.toaster.pop('success', '', 'Download complete!');
            } catch (err) {
                console.error("Error downloading all items:", err);
                this.toaster.pop('error', '', 'Error downloading queue items');
            }
        }
        
        deleteItem(item: import('../../models').PdfItem) {
            const idx = this.QueueService.items.indexOf(item);
            if (idx >= 0) {
                this.QueueService.items.splice(idx, 1);
                db.delete(item.id);
                this.toaster.pop('success', '', 'Document deleted successfully.');
            }
        }
    }
};
