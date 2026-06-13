import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

export const MarkdownViewerComponent: ng.IComponentOptions = {
    bindings: {
        content: '<'
    },
    templateUrl: '/components/markdown-viewer/markdown-viewer.html',
    controller: class MarkdownViewerController {
        static $inject = ['$sce'];
        
        public content!: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public safeHtml: any;
        private $sce: ng.ISCEService;
        
        constructor($sce: ng.ISCEService) {
            this.$sce = $sce;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $onChanges(changes: any) {
            if (changes.content && changes.content.currentValue) {
                const rawHtml = md.render(changes.content.currentValue);
                // Bỏ qua bước sanitize theo yêu cầu, tin tưởng tuyệt đối vào HTML sinh ra
                this.safeHtml = this.$sce.trustAsHtml(rawHtml);
            }
        }
    }
};
