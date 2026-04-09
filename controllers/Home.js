import { getLocation } from '../utils/Location.js';
import { resolveComponent , getData} from '../utils/Service.js';


document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('content');

   const params = new URLSearchParams(window.location.search);
   const marca= params.get("marca");
   const cb = params.get('cb');

   console.log(cb);

   render({marca, cb});

  function render(data) {
    const tag = resolveComponent(data);

    console.log(tag);

    if (!tag || tag === null) {
      return;
    }

    container.appendChild(document.createElement(tag));

    const component = container.querySelector(tag);

    getLocation().then(dataLocation => {
        getData(data, dataLocation.latitude, dataLocation.longitude)
        .then(datos => {
            component.setData(datos);
        })
    })
    }
});
/*
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
*/