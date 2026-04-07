import {getLocation} from '../utils/Location.js';

const GOOGLE_MAP_ID = 'DEMO_MAP_ID';
let map = null;
const COLOR_PIN_BACKGROUND = '#FF6969';
const COLOR_PIN_BORDER= "#FFFFFF";
let AdvancedMarkerElementClass = null;
let PinElementClass = null;


async function ensureAdvancedMarkerLibrary() {
    if (AdvancedMarkerElementClass) return;
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');
    AdvancedMarkerElementClass = AdvancedMarkerElement;
    PinElementClass = PinElement;
}


async function setUserLocation(latitude, longitude){
    if(!map) return;

    await ensureAdvancedMarkerLibrary();

    const marker = new AdvancedMarkerElementClass({
            map,
            position: {lat:latitude, lng: longitude},
            title: 'Tu ubicación',
        });

}

export async function initMap(node) {

    const location = await getLocation();

    map = new google.maps.Map(node, {
    center: {lat: location.latitude, lng: location.longitude},
    zoom: 15,
    mapId: GOOGLE_MAP_ID,
  });

  map.setOptions({
        mapTypeControl: false,
    });


  await setUserLocation(location.latitude, location.longitude);

}

export async function createMarkers(listMarkers, map){

    await ensureAdvancedMarkerLibrary();
    listMarkers.map((location) =>{
        const pin = new PinElement({
            background: COLOR_PIN_BACKGROUND,
            borderColor: COLOR_PIN_BORDER,
            glyphColor: COLOR_PIN_BORDER
        });
        const marker = new AdvancedMarkerElement({
        map: map,
        content: markerContent(location),
        position: { lat: location.latitud, lng: location.longitud },
        title: location.ubicacion
        });
        
    });
   

}

function markerContent(location) {
    const content = document.createElement('div');
    content.classList.add('property');
    content.innerHTML = `
    <div class="icon">
        <div aria-hidden="true" class="circle"></div>
    </div>
    <div class="details">
        <div class="nombre">${location.ubicacion}</div>
        <div class="address">${location.direccion}</div>
    </div>
    `;
    return content;
}
