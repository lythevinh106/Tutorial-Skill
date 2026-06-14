import template from './navbar.html?raw';

export const NavbarComponent: ng.IComponentOptions = {
    template,
    controller: class NavbarController {
        $onInit() {
            // Navbar logic here
        }
    }
};
