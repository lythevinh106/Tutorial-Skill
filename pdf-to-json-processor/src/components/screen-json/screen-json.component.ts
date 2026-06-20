import template from './screen-json.html?raw';
import type { PdfItem, IJsonHighlight } from '../../models';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export const ScreenJsonComponent: ng.IComponentOptions = {
    template,
    bindings: {
        item: '<',
        onSave: '&'
    },
    controller: class ScreenJsonController {
        static $inject = ['$element', '$timeout', 'toaster'];
        
        public item!: PdfItem;
        public onSave!: (locals: { $event: { id: string; jsonData: unknown; jsonHighlights: IJsonHighlight[] } }) => void;
        
        private editor!: ace.Ace.Editor;
        private $element: ng.IAugmentedJQuery;
        private $timeout: ng.ITimeoutService;
        private toaster: IToasterService;

        public isValidJson = true;
        public parsedJsonData: unknown = null;

        constructor($element: ng.IAugmentedJQuery, $timeout: ng.ITimeoutService, toaster: IToasterService) {
            this.$element = $element;
            this.$timeout = $timeout;
            this.toaster = toaster;
        }

        $onInit() {
            if (!this.item.jsonHighlights) {
                this.item.jsonHighlights = [];
            }
        }

        $postLink() {
            this.$timeout(() => {
                this.initAceEditor();
            }, 0);
        }

        $onDestroy() {
            if (this.editor) {
                this.editor.destroy();
            }
        }

        private initAceEditor() {
            const containerId = `ace-editor-container-${this.item.id}`;
            const container = this.$element[0].querySelector(`#${containerId}`);
            
            if (!container) return;

            this.editor = ace.edit(container as HTMLElement);
            this.editor.setTheme("ace/theme/github");
            this.editor.session.setMode("ace/mode/json");
            this.editor.setOptions({
                fontSize: "14px",
                showPrintMargin: false,
                wrap: true,
                useWorker: false // Disable syntax worker to avoid cross-domain worker issues if any
            });

            // Set initial content
            let initialContent = '';
            if (typeof this.item.jsonData === 'string') {
                initialContent = this.item.jsonData;
            } else if (this.item.jsonData) {
                initialContent = JSON.stringify(this.item.jsonData, null, 2);
            }
            this.editor.setValue(initialContent, -1);
            
            // Restore markers
            this.restoreMarkers();

            // Keyboard shortcuts
            this.editor.commands.addCommand({
                name: 'highlightYellow',
                bindKey: {win: 'Ctrl-D', mac: 'Command-D'},
                exec: () => {
                    this.applyHighlight('yellow');
                }
            });

            this.editor.commands.addCommand({
                name: 'highlightRed',
                bindKey: {win: 'Ctrl-B', mac: 'Command-B'},
                exec: () => {
                    this.applyHighlight('red');
                }
            });

            // On change event to validate JSON
            this.editor.session.on('change', () => {
                this.$timeout(() => {
                    this.validateJson();
                });
            });

            // Initial validation
            this.validateJson();
        }

        private applyHighlight(type: 'yellow' | 'red') {
            const range = this.editor.getSelectionRange();
            if (range.isEmpty()) return;

            const markerClass = type === 'yellow' ? 'ace_marker_yellow' : 'ace_marker_red';
            
            // Add to Ace Session
            this.editor.session.addMarker(range, markerClass, 'text');
            
            // Persist to item model
            this.item.jsonHighlights?.push({
                start: { row: range.start.row, column: range.start.column },
                end: { row: range.end.row, column: range.end.column },
                type: type
            });
            
            this.editor.clearSelection();
            
            // Trigger digest
            this.$timeout(() => {});
        }

        private restoreMarkers() {
            if (!this.item.jsonHighlights || !this.editor) return;

            const Range = ace.require('ace/range').Range;
            this.item.jsonHighlights.forEach(h => {
                const range = new Range(h.start.row, h.start.column, h.end.row, h.end.column);
                const markerClass = h.type === 'yellow' ? 'ace_marker_yellow' : 'ace_marker_red';
                this.editor.session.addMarker(range, markerClass, 'text');
            });
        }

        private validateJson() {
            const val = this.editor.getValue();
            try {
                this.parsedJsonData = JSON.parse(val);
                this.isValidJson = true;
            } catch {
                this.parsedJsonData = null;
                this.isValidJson = false;
            }
        }

        public clearAllHighlights() {
            if (!this.editor) return;
            const markers = this.editor.session.getMarkers(true);
            for (const id in markers) {
                if (markers[id].clazz === 'ace_marker_yellow' || markers[id].clazz === 'ace_marker_red') {
                    this.editor.session.removeMarker(Number(id));
                }
            }
            this.item.jsonHighlights = [];
        }

        public handleSave() {
            if (!this.isValidJson) {
                this.toaster.pop('warning', 'Invalid JSON', 'Cannot save while JSON has syntax errors.');
                return;
            }
            
            // Extract text and pass parsed JSON
            this.item.jsonData = this.parsedJsonData;

            this.onSave({
                $event: {
                    id: this.item.id,
                    jsonData: this.parsedJsonData,
                    jsonHighlights: this.item.jsonHighlights || []
                }
            });
            
            this.toaster.pop('success', 'Saved', 'JSON edits and markers saved successfully.');
        }
    }
};
