import { getLocation } from '../utils/Location.js';
import { getMarca } from '../utils/Service.js';

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca = params.get("marca");
    getMarca(marca).then(datos => {
        const companyModal = document.querySelector('company-modal');
        if (companyModal) {
            companyModal.setData(datos);
        }
    });
};
