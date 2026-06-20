import type { PdfItem } from '../models';
import { ApiService } from './api.service';
import { db } from './db';

type QueueItem = PdfItem & { _file?: File, _progressTimer?: ng.IPromise<void> };

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export class QueueService {
    static $inject = ['$timeout'];
    
    public items: QueueItem[] = [];
    public activeCount = 0;
    private maxConcurrency = 5;
    private pendingQueue: QueueItem[] = [];
    private $timeout: ng.ITimeoutService;

    constructor($timeout: ng.ITimeoutService) {
        this.$timeout = $timeout;
        this.initDb();
    }

    private async initDb() {
        try {
            const savedItems = await db.getAll();
            if (savedItems && savedItems.length > 0) {
                savedItems.forEach(item => {
                    if (item.pdfBlob) {
                        item.pdfUrl = URL.createObjectURL(item.pdfBlob);
                    }
                    if (item.status === 'uploading' || item.status === 'processing') {
                        item.status = 'pending';
                        item.progress = 0;
                    }
                });
                
                this.$timeout(() => {
                    // Sort descending by ID to simulate recent first
                    this.items = savedItems.sort((a, b) => b.id.localeCompare(a.id));
                    const pending = this.items.filter(i => i.status === 'pending');
                    if (pending.length > 0) {
                        this.pendingQueue.push(...pending);
                        this.processNext();
                    }
                });
            }
        } catch (e) {
            console.error("Error loading items from DB", e);
        }
    }

    private cleanItem(item: QueueItem): PdfItem {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _file, _progressTimer, ...clean } = item;
        return clean as PdfItem;
    }

    public enqueue(files: FileList | File[], useLocalLlm: boolean = false, mode: 'markdown' | 'json' = 'markdown'): void {
        const newItems: QueueItem[] = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const id = crypto.randomUUID();
            const pdfUrl = URL.createObjectURL(file);
            
            const item: QueueItem = {
                id,
                name: file.name,
                pdfUrl,
                pdfBlob: file,
                markdownData: '',
                jsonData: null,
                status: 'pending',
                progress: 0,
                fileSizeStr: formatBytes(file.size),
                fileType: file.type,
                useLocalLlm,
                mode
            };
            
            item._file = file; 
            newItems.push(item);
            db.put(this.cleanItem(item));
        }

        this.$timeout(() => {
            this.items.unshift(...newItems);
            this.pendingQueue.push(...newItems);
            this.processNext();
        });
    }

    private startFakeProgress(item: QueueItem) {
        const tick = () => {
            if (!item || (item.status !== 'uploading' && item.status !== 'processing')) return;
            
            if (item.status === 'uploading') {
                item.progress = (item.progress || 0) + 15;
                if (item.progress >= 100) {
                    item.progress = 0;
                    item.status = 'processing';
                }
            } else if (item.status === 'processing') {
                if ((item.progress || 0) < 95) {
                    item.progress = (item.progress || 0) + (Math.random() * 5 + 1);
                }
            }
            
            item._progressTimer = this.$timeout(tick, 300);
        };
        tick();
    }

    private processNext(): void {
        while (this.activeCount < this.maxConcurrency && this.pendingQueue.length > 0) {
            this.activeCount++;
            const item = this.pendingQueue.shift()!;
            const file = item._file as File;
            
            item.status = 'uploading';
            item.progress = 0;
            this.startFakeProgress(item);
            
            ApiService.processPdf(file, item.useLocalLlm, item.mode).then(result => {
                this.$timeout(() => {
                    if (item._progressTimer) {
                        this.$timeout.cancel(item._progressTimer);
                    }
                    
                    Object.assign(item, result);
                    item.progress = 100;
                    if (result.status !== 'error') {
                        delete item._file;
                    }
                    
                    db.put(this.cleanItem(item));

                    this.activeCount--;
                    this.processNext();
                });
            });
        }
    }
    
    public retry(item: QueueItem): void {
        if (item.status === 'error' && item._file) {
            item.status = 'pending';
            item.errorMessage = undefined;
            item.progress = 0;
            
            // Move to pending queue
            this.pendingQueue.push(item);
            db.put(this.cleanItem(item));
            this.processNext();
        }
    }
}
