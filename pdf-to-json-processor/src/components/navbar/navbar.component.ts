import template from './navbar.html?raw';

export const NavbarComponent: ng.IComponentOptions = {
    template,
    controller: class NavbarController {
        static $inject = ['AppModeService'];
        public AppModeService: import('../../services/app-mode.service').AppModeService;

        constructor(AppModeService: import('../../services/app-mode.service').AppModeService) {
            this.AppModeService = AppModeService;
        }

        setMode(mode: 'markdown' | 'json', event: Event) {
            event.preventDefault();
            this.AppModeService.setMode(mode);
        }
    }
};
