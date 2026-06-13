import 'jquery';
import * as angular from 'angular';
import './styles/main.css';
import { MainController } from './controllers/main.controller';
import { NavbarComponent } from './components/navbar/navbar.component';
import { QueueDashboardComponent } from './components/queue-dashboard/queue-dashboard.component';
import { QueueItemComponent } from './components/queue-item/queue-item.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { MarkdownViewerComponent } from './components/markdown-viewer/markdown-viewer.component';
import { JsonViewerComponent } from './components/json-viewer/json-viewer.component';

// Initialize AngularJS Module
const app = angular.module('pdfProcessorApp', []);

// Đăng ký Controller bằng Class chuẩn ES6 (Chống vỡ code khi nén)
app.controller('MainController', MainController);

// Đăng ký Components
app.component('navbar', NavbarComponent);
app.component('queueDashboard', QueueDashboardComponent);
app.component('queueItem', QueueItemComponent);
app.component('pdfViewer', PdfViewerComponent);
app.component('markdownViewer', MarkdownViewerComponent);
app.component('jsonViewer', JsonViewerComponent);

// Bootstrap thủ công với DOMContentLoaded (chuẩn Vite ES Module)
angular.element(document).ready(() => {
    angular.bootstrap(document.body, ['pdfProcessorApp']);
});

