import template from './queue-item.html?raw';
import type { PdfItem } from '../../models';
import modalTemplate from '../document-modal/document-modal.html?raw';
import { DocumentModalController } from '../document-modal/document-modal.controller';

export const QueueItemComponent: ng.IComponentOptions = {
    bindings: {
        item: '<',
        onDelete: '&',
        onRetry: '&'
    },
    template,
    controller: class QueueItemController {
        static $inject = ['$uibModal'];
        item!: PdfItem;
        onDelete!: () => void;
        onRetry!: () => void;
        
        private $uibModal: angular.ui.bootstrap.IModalService;

        constructor($uibModal: angular.ui.bootstrap.IModalService) {
            this.$uibModal = $uibModal;
        }

        get roundedProgress() {
            return Math.round(this.item.progress || 0);
        }

        openModal() {
            this.$uibModal.open({
                animation: false,
                template: modalTemplate,
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
    }
};
