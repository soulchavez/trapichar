import {getLocation} from '../utils/Location.js';
import { getMarca } from '../utils/Service.js';

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca= params.get("marca");
    const datosMarca = getMarca(marca).then().then(datos => {return datos});
    console.log(datosMarca);

};

