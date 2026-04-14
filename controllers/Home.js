import { getLocation } from '../utils/Location.js';
import { resolveComponent, getData } from '../utils/Service.js';
import {handleAllProducts} from '../utils/History.js';


document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const marca = params.get("marca");
    const cb = params.get('cb');
    const cat = params.get('categoria');


    render({ marca, cb, cat });
});

export function render(data) {
        const container = document.getElementById('content');
        container.innerHTML= '';
        const tag = resolveComponent(data);

        if (!tag || tag === null) {
            return;
        }

        const overlay = document.getElementById("company-modal-overlay");

        const backButton = document.getElementsByClassName('top-button')[0];
        if (overlay) {
            if (tag.includes('drawer')) {
                overlay.classList.add("is-minimized");
                if(backButton){
                    backButton.style.display = 'block';
                    backButton.addEventListener('click', ()=>{
                        handleAllProducts();
                    })
                }
            }else{
                if(backButton){
                    backButton.style.display = 'none';
                }
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

