import template from './queue-item.html?raw';
import type { PdfItem } from '../../models';
import documentModalTemplate from '../document-modal/document-modal.html?raw';
import { DocumentModalController } from '../document-modal/document-modal.controller';
import { db } from '../../services/db';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export const QueueItemComponent: ng.IComponentOptions = {
    bindings: {
        item: '<',
        modalType: '@?', // 'document' (default) or 'json'
        onDelete: '&',
        onRetry: '&'
    },
    template,
    controller: class QueueItemController {
        static $inject = ['$uibModal', 'toaster'];
        item!: PdfItem;
        modalType?: string;
        onDelete!: () => void;
        onRetry!: () => void;
        
        private $uibModal: angular.ui.bootstrap.IModalService;
        private toaster: IToasterService;

        constructor($uibModal: angular.ui.bootstrap.IModalService, toaster: IToasterService) {
            this.$uibModal = $uibModal;
            this.toaster = toaster;
        }

        get roundedProgress() {
            return Math.round(this.item.progress || 0);
        }

        openModal() {
            this.$uibModal.open({
                animation: false,
                template: documentModalTemplate,
                controller: DocumentModalController,
                controllerAs: '$ctrl',
                windowClass: 'fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8',
                backdropClass: 'bg-slate-900/40 backdrop-blur-md',
                resolve: {
                    item: () => this.item
                }
            }).result.then((result) => {
                if (result === 'delete') {
                    this.onDelete();
                }
            }).catch(() => {
                // Modal dismissed
            });
        }

        updateJson(jsonData: unknown, jsonHighlights: import('../../models').IJsonHighlight[]) {
            this.item.jsonData = jsonData;
            this.item.jsonHighlights = jsonHighlights;
            db.put(this.item);
            this.toaster.pop('warning', '', 'Queue Updated - JSON changes saved.');
        }
    }
};
