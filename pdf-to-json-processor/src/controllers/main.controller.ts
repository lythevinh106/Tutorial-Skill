import type { QueueService } from '../services/queue.service';
import type { PdfItem } from '../models';

export class MainController implements ng.IController {
    static $inject = ['QueueService'];
    
    public currentView: 'markdown' | 'json';
    public QueueService: QueueService;
    public selectedItem: PdfItem | null = null;

    constructor(QueueService: QueueService) {
        this.QueueService = QueueService;
        // Mặc định khởi tạo view ưu tiên 1: markdown
        this.currentView = 'markdown';
    }

    public $onInit(): void {
        console.log('MainController initialized via Component-Driven strict class');
    }

    public switchView(view: 'markdown' | 'json'): void {
        this.currentView = view;
    }

    public selectItem(item: PdfItem): void {
        this.selectedItem = item;
    }
}
