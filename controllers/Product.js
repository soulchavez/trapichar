import {getLocation} from '../utils/Location.js';
import { getDetalleProducto } from '../utils/Service.js';


window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca= params.get("marca");
    const cb = params.get('cb');

    if(!cb){
        document.querySelector('botom-drawer').style.display = 'none';
        document.querySelector('company-modal').style.display = 'block';
    }else{
        document.querySelector('botom-drawer').style.display = 'block';
        document.querySelector('company-modal').style.display = 'none';
        obtenerInfoProducto(marca, cb);    
    }

    

};

async function obtenerInfoProducto (marca, cb){
    const location = await getLocation();
    const producto = await getDetalleProducto(cb,marca, location.latitude, location.longitude);
    const bottomDrawer = document.querySelector('bottom-drawer');
    console.log(producto);
    if(bottomDrawer){
        bottomDrawer.setData(producto);
    }
}

