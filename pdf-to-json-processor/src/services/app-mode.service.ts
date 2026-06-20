export class AppModeService {
    public currentMode: 'markdown' | 'json' = 'markdown';

    public setMode(mode: 'markdown' | 'json') {
        this.currentMode = mode;
    }
}
