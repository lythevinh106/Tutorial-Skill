export class MainController implements ng.IController {
    static $inject = [];
    
    public currentView: 'markdown' | 'json';

    constructor() {
        // Mặc định khởi tạo view
        this.currentView = 'markdown';
    }

    public $onInit(): void {
        console.log('MainController initialized via Component-Driven strict class');
    }

    public switchView(view: 'markdown' | 'json'): void {
        this.currentView = view;
    }
}
