export const QueueItemComponent: ng.IComponentOptions = {
    bindings: {
        itemState: '<'
    },
    templateUrl: '/components/queue-item/queue-item.html',
    controller: class QueueItemController {
        itemState: string = 'processing';
        
        $onInit() {
            if (!this.itemState) {
                this.itemState = 'processing';
            }
        }
    }
};
