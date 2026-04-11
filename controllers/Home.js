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
                    console.log(datos);

                    component.setData(datos);
                });
        });
    }
});
/*
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca = params.get("marca");
    getMarca(marca).then(datos => {
        const companyModal = document.querySelector('company-modal');
        console.log(datos);
        datos.listaProductos[0].listaPuntosVenta = [
            {
                "id": "173cbfc1-3be1-4ac6-5ba5-08de557dfcd8",
                "ubicacion": "Walmart",
                "direccion": "Navojoa - Cd Obregón 131, Central de Abastos, 85090 Cd Obregón, Son., México",
                "imagen": "https://s3.us-west-2.amazonaws.com/trapichar.archivos/Comercios/549c04a0-beee-4a73-9229-08dadd3f1948/portada_logo_walmart.png",
                "latitud": 27.4814583,
                "longitud": -109.9267856
            },
            {
                "id": "e292f0ef-10f5-4a90-b83f-08de57a7790a",
                "ubicacion": "Walmart",
                "direccion": "C. Sufragio Efectivo 901, Zona Nte Comercial, 85000 Cd Obregón, Son., México",
                "imagen": "https://s3.us-west-2.amazonaws.com/trapichar.archivos/Comercios/549c04a0-beee-4a73-9229-08dadd3f1948/portada_logo_walmart.png",
                "latitud": 27.5162735,
                "longitud": -109.9286461
            },
            {
                "id": "d5a5540e-26e2-4de8-5bb3-08de557dfcd8",
                "ubicacion": "Walmart",
                "direccion": "P.º de la Granada 33, Campestre Residencial, 85823 Navojoa, Son., México",
                "imagen": "https://s3.us-west-2.amazonaws.com/trapichar.archivos/Comercios/549c04a0-beee-4a73-9229-08dadd3f1948/portada_logo_walmart.png",
                "latitud": 27.0854935,
                "longitud": -109.4556552
            }
        ]

        if (companyModal) {
            companyModal.setData(datos);
        }
    });
};
*/