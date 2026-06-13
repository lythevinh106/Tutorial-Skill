import JSONFormatter from 'json-formatter-js';

export const JsonViewerComponent: ng.IComponentOptions = {
    bindings: {
        data: '<'
    },
    template: '<div class="json-viewer-container w-full h-full overflow-auto bg-white p-4 rounded-lg font-mono text-sm border border-gray-200 shadow-inner"></div>',
    controller: class JsonViewerController {
        static $inject = ['$element'];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public data: any;
        private $element: ng.IAugmentedJQuery;
        
        constructor($element: ng.IAugmentedJQuery) {
            this.$element = $element;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $onChanges(changes: any) {
            if (changes.data && changes.data.currentValue) {
                this.renderJson();
            }
        }

        private renderJson() {
            const container = this.$element[0].querySelector('.json-viewer-container');
            if (container) {
                container.innerHTML = '';
                // Tham số: JSON Object, số cấp mở rộng (1), cấu hình
                const formatter = new JSONFormatter(this.data, 2, {
                    theme: '',
                    hoverPreviewEnabled: true,
                    hoverPreviewArrayCount: 100,
                    hoverPreviewFieldCount: 5,
                    animateOpen: true,
                    animateClose: true
                });
                container.appendChild(formatter.render());
            }
        }
    }
};
