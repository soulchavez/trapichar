import { getLocation } from '../utils/Location.js';
import { resolveComponent, getData } from '../utils/Service.js';


document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('content');

    const params = new URLSearchParams(window.location.search);
    const marca = params.get("marca");
    const cb = params.get('cb');

    render({ marca, cb });

    function render(data) {
        const tag = resolveComponent(data);

        if (!tag || tag === null) {
            return;
        }

        const overlay = document.getElementById("company-modal-overlay");

        if (overlay) {
            if (tag.includes('drawer')) {
                overlay.classList.add("is-minimized");
            }
        }

        container.appendChild(document.createElement(tag));

        const component = container.querySelector(tag);

        getLocation().then(dataLocation => {
            getData(data, dataLocation.latitude, dataLocation.longitude)
                .then(datos => {
                    component.setData(datos);
                });
        });
    }
});
