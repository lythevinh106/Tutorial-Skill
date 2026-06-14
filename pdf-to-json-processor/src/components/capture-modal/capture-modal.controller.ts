import { saveAs } from 'file-saver';

interface IToasterService {
    pop(type: string, title: string, body: string): void;
}

export class CaptureModalController {
    static $inject = ['$uibModalInstance', 'imageUrl', 'toaster'];
    
    public imageUrl: string;
    public scale: number = 1;
    public rotation: number = 0;
    public translateX: number = 0;
    public translateY: number = 0;
    public isDragging: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    
    private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance;
    private toaster: IToasterService;

    constructor($uibModalInstance: angular.ui.bootstrap.IModalServiceInstance, imageUrl: string, toaster: IToasterService) {
        this.$uibModalInstance = $uibModalInstance;
        this.imageUrl = imageUrl;
        this.toaster = toaster;
    }

    close() {
        this.$uibModalInstance.dismiss('cancel');
    }

    startDrag($event: MouseEvent) {
        this.isDragging = true;
        this.startX = $event.clientX - this.translateX;
        this.startY = $event.clientY - this.translateY;
    }

    onDrag($event: MouseEvent) {
        if (!this.isDragging) return;
        $event.preventDefault();
        this.translateX = $event.clientX - this.startX;
        this.translateY = $event.clientY - this.startY;
    }

    stopDrag() {
        this.isDragging = false;
    }

    zoomIn() {
        this.scale += 0.1;
    }

    zoomOut() {
        if (this.scale > 0.2) {
            this.scale -= 0.1;
        }
    }

    rotate() {
        this.rotation = (this.rotation + 90) % 360;
    }

    async copyToClipboard() {
        try {
            const response = await fetch(this.imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            this.toaster.pop('success', '', 'Image copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy image: ', error);
            this.toaster.pop('error', '', 'Failed to copy image to clipboard.');
        }
    }

    private convertDataUrlToJpeg(pngDataUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No canvas context');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = reject;
            img.src = pngDataUrl;
        });
    }

    private convertDataUrlToSvg(pngDataUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}">
<image href="${pngDataUrl}" width="${img.width}" height="${img.height}" />
</svg>`;
                const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            };
            img.onerror = reject;
            img.src = pngDataUrl;
        });
    }

    async export(format: 'png' | 'jpeg' | 'svg') {
        try {
            let dataUrl = '';
            if (format === 'png') {
                dataUrl = this.imageUrl;
            } else if (format === 'jpeg') {
                dataUrl = await this.convertDataUrlToJpeg(this.imageUrl);
            } else if (format === 'svg') {
                dataUrl = await this.convertDataUrlToSvg(this.imageUrl);
            }

            saveAs(dataUrl, `capture-${Date.now()}.${format}`);
            this.toaster.pop('success', '', `Exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error(`Failed to export ${format}: `, error);
            this.toaster.pop('error', '', `Failed to export ${format.toUpperCase()}`);
        }
    }
}
