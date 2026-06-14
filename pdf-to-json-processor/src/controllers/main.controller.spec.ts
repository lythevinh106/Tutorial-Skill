import { describe, it, expect, beforeEach } from 'vitest';
import { MainController } from './main.controller';
import { QueueService } from '../services/queue.service';

describe('MainController', () => {
    let mainController: MainController;
    let mockQueueService: QueueService;

    beforeEach(() => {
        // Tạo một mock instance của QueueService
        mockQueueService = {} as unknown as QueueService;
        mainController = new MainController(mockQueueService);
    });

    it('khởi tạo với view mặc định là markdown', () => {
        expect(mainController.currentView).toBe('markdown');
    });

    it('lưu trữ đối tượng QueueService được inject', () => {
        expect(mainController.QueueService).toBe(mockQueueService);
    });

    it('có thể chuyển đổi view chính xác', () => {
        // Chuyển sang json
        mainController.switchView('json');
        expect(mainController.currentView).toBe('json');

        // Chuyển lại markdown
        mainController.switchView('markdown');
        expect(mainController.currentView).toBe('markdown');
    });
});
