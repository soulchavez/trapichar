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

    const onlineStores =  document.getElementById('stores');

    if(producto.listaTiendasLinea.length>0){

        producto.listaTiendasLinea.map((tienda)=>{
            const anchor = document.createElement('a');
            anchor.href = tienda.url;
            anchor.innerHTML = `<img class="online-store" alt=${tienda.nombre} src=${tienda.imagen}>`;

            onlineStores.appendChild(anchor);
            
        });

    }else{
       document.getElementById('online-stores').style.display="none";
    }

    document.getElementById('product-image').src = producto.imagen;
    const name = document.getElementById('product-name');
    console.log(producto.nombre);
    name.getElementsByClassName("name")[0].innerText = producto.nombre;
    document.getElementById("description").innerHTML = producto.descripcion;

}
/*
window.initMap = async function initMap() {
        if (!window.google || !window.google.maps) return null;

        await ensureAdvancedMarkerLibrary();

        const center = lastLatLng || DEFAULT_CENTER;
        const zoom = lastLatLng ? 15 : DEFAULT_ZOOM;

        map = new google.maps.Map(document.getElementById('map'), {
            mapId: GOOGLE_MAP_ID,
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
        });

        if (lastLatLng) {
            await setUserLocation(lastLatLng, lastAccuracyMeters ?? 80);
        }

        return map;
    };*/