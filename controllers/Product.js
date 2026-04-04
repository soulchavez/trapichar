import {getLocation} from '../utils/Location.js';
import { getDetalleProducto } from '../utils/Service.js';
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const marca= params.get("marca");
    const cb = params.get('cb');

    obtenerInfoProducto(marca, cb);

};

async function obtenerInfoProducto (marca, cb){
    const location = await getLocation();
    const producto = await getDetalleProducto(cb,marca, location.latitude, location.longitude);
    showData(producto);
}

function showData(producto){
    document.title = `${producto.nombre} - Ubicaciones`;
    if(producto.listaPuntosVenta.length>0){
        const closestLocation = producto.listaPuntosVenta[0];
        document.getElementById("closest-location").innerHTML=closestLocation.ubicacion;
    }else{
        document.getElementsByClassName("closest-location-wrapper")[0].style.display="none";
    }

    if(producto.listaTiendasLinea.length>0){

    }else{
        document.getElementById('online-stores').style.display="none";
    }

    const productSection = document.getElementById("product");
    document.getElementById('product-image').src = producto.imagen;
    const name = document.getElementById('product-name');
    console.log(producto.nombre);
    name.getElementsByClassName("name")[0].innerText = producto.nombre;
    productSection.getElementById("description").innerHTML = producto.descripcion;
    


}