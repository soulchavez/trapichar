import {getLocation} from '../utils/Location.js';
import { getDetalleProducto } from '../utils/Service.js';
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca= params.get("marca");
    const cb = params.get('cb');
    const location = getLocation();
    const producto = getDetalleProducto(cb,marca, location.latitude, location.longitude).then().then(datos => {return datos});
    console.log(producto);

};