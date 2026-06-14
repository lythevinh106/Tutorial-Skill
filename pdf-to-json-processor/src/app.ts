import 'jquery';
import * as angular from 'angular';
import 'angular-ui-bootstrap';
import './styles/main.css';
import { MainController } from './controllers/main.controller';
import { NavbarComponent } from './components/navbar/navbar.component';
import { QueueDashboardComponent } from './components/queue-dashboard/queue-dashboard.component';
import { QueueItemComponent } from './components/queue-item/queue-item.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { ScreenPdfComponent } from './components/screen-pdf/screen-pdf.component';
import { ScreenMarkdownComponent } from './components/screen-markdown/screen-markdown.component';
import 'angular-animate';
import 'angularjs-toaster';
import 'angularjs-toaster/toaster.css';

// Initialize AngularJS Module
const app = angular.module('pdfProcessorApp', ['ui.bootstrap', 'ngAnimate', 'toaster']);

import { QueueService } from './services/queue.service';
import { ApiService } from './services/api.service';
import { CaptureService } from './services/capture.service';

app.service('QueueService', QueueService);
app.service('ApiService', ApiService);
app.service('CaptureService', CaptureService);

// Đăng ký Controller bằng Class chuẩn ES6 (Chống vỡ code khi nén)
app.controller('MainController', MainController);

// Đăng ký Components
app.component('navbar', NavbarComponent);
app.component('queueDashboard', QueueDashboardComponent);
app.component('queueItem', QueueItemComponent);
app.component('pdfViewer', PdfViewerComponent);
app.component('screenPdf', ScreenPdfComponent);
app.component('screenMarkdown', ScreenMarkdownComponent);

// Bootstrap thủ công với DOMContentLoaded (chuẩn Vite ES Module)
angular.element(document).ready(() => {
    angular.bootstrap(document.body, ['pdfProcessorApp']);
});
