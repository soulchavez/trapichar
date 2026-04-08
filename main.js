/* global google */

(function () {
    const statusEl = document.getElementById('location-status');
    const modalOverlay = document.getElementById('company-modal-overlay');
    const modalCloseBtn = document.getElementById('company-modal-close');
    const topInfoText = document.getElementById('top-info-text');

    const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // CDMX
    const DEFAULT_ZOOM = 12;

    /**
     * Required for AdvancedMarkerElement. Create your own in Google Cloud Console:
     * Maps Platform → Map Management → Map IDs (type: JavaScript).
     * Google's demo ID works for local experiments; use your own for production.
     */
    const GOOGLE_MAP_ID = 'DEMO_MAP_ID';

    let map = null;
    let marker = null;
    let accuracyCircle = null;
    let lastLatLng = null;
    let lastAccuracyMeters = null;
    let AdvancedMarkerElementClass = null;
    let storeMarkers = [];
    let currentPolyline = null;

    // Fórmula de Haversine para distancia en línea recta (en km)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    async function traceRouteToClosest(originLatLng, listaPuntosVenta) {
        if (!window.google || !window.google.maps) return;

        let closest = null;
        let minDistance = Infinity;

        listaPuntosVenta.forEach(punto => {
            const lat = parseFloat(punto.latitud);
            const lng = parseFloat(punto.longitud);
            if(isNaN(lat) || isNaN(lng)) return;

            const dist = getDistance(originLatLng.lat, originLatLng.lng, lat, lng);
            if (dist < minDistance) {
                minDistance = dist;
                closest = { lat, lng };
            }
        });

        if (!closest) return;

        try {
            const routesLib = await window.google.maps.importLibrary("routes");
            const geomLib = await window.google.maps.importLibrary("geometry");

            const request = {
                origin: originLatLng,
                destination: closest,
                travelMode: "DRIVING",
                fields: ["*"]
            };

            // This is the new Google Maps SDK computeRoutes API (migrated from DirectionsService)
            const response = await routesLib.Route.computeRoutes(request);
            
            if (response && response.routes && response.routes.length > 0) {
                const routePath = response.routes[0].path;
                if (!routePath) return;

                if (currentPolyline) {
                    currentPolyline.setMap(null);
                }

                currentPolyline = new window.google.maps.Polyline({
                    path: routePath,
                    strokeColor: "#0A7AFB",
                    strokeOpacity: 0.8,
                    strokeWeight: 6,
                    map: map
                });

                // Automatically center and zoom the map to fit the route limits
                const bounds = new window.google.maps.LatLngBounds();
                routePath.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
            }
        } catch (error) {
            console.warn("Fallo al trazar ruta usando la nueva API Route.computeRoutes:", error);
        }
    }

    function setStatus(message) {
        if (!statusEl) return;
        statusEl.textContent = message;
    }

    function openCompanyModal(message = 'Elige un producto y descubre donde conseguirlo') {
        if (!modalOverlay) return;
        if (topInfoText && message) {
            topInfoText.textContent = message;
        }
        modalOverlay.classList.add('is-open');
        modalCloseBtn?.focus();
    }

    function closeCompanyModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('is-open');
    }

    async function ensureAdvancedMarkerLibrary() {
        if (AdvancedMarkerElementClass) return;
        if (google.maps.importLibrary) {
            const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
            AdvancedMarkerElementClass = AdvancedMarkerElement;
        } else {
            AdvancedMarkerElementClass = google.maps.marker.AdvancedMarkerElement;
        }
    }

    async function setUserLocation(latLng, accuracyMeters) {
        if (!window.google || !window.google.maps) {
            setStatus('Tu ubicación está lista (pero Google Maps no cargó).');
            return;
        }
        if (!map) return;

        await ensureAdvancedMarkerLibrary();

        if (marker) {
            marker.map = null;
            marker = null;
        }

        marker = new AdvancedMarkerElementClass({
            map,
            position: latLng,
            title: 'Tu ubicación',
        });

        const hasAccuracy = accuracyMeters && Number.isFinite(accuracyMeters);
        if (accuracyCircle) accuracyCircle.setMap(null);
        accuracyCircle = null;

        if (hasAccuracy) {
            const radius = Math.max(accuracyMeters, 30); // Avoid too-small circles.
            accuracyCircle = new google.maps.Circle({
                map,
                center: latLng,
                radius,
                fillColor: '#0A7AFB',
                fillOpacity: 0.15,
                strokeColor: '#0A7AFB',
                strokeOpacity: 0.5,
                strokeWeight: 1,
            });
        }

        map.setCenter(latLng);
        map.setZoom(15);
    }

    function requestLocationPermission() {
        if (!navigator.geolocation) {
            setStatus('Este navegador no soporta geolocalización.');
            openCompanyModal();
            return;
        }

        setStatus('Solicitando tu ubicación...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                lastLatLng = { lat, lng };
                lastAccuracyMeters = accuracy;

                setStatus('');
                if (map) void setUserLocation(lastLatLng, lastAccuracyMeters);
                openCompanyModal();
            },
            (error) => {
                const reason =
                    error && error.code === error.PERMISSION_DENIED
                        ? 'Permiso denegado. Mostrando mapa por defecto...'
                        : 'No se pudo obtener tu ubicación. Mostrando mapa por defecto...';

                setStatus(reason);
                lastLatLng = DEFAULT_CENTER;
                lastAccuracyMeters = null;

                openCompanyModal();
                if (typeof window.initMap === 'function') {
                    void window.initMap();
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    }

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
        window.map = map;

        if (lastLatLng) {
            await setUserLocation(lastLatLng, lastAccuracyMeters ?? 80);
        }

        return map;
    };

    window.renderStoresOnMap = async function(listaPuntosVenta) {
        console.log("Iniciando renderizado de sucursales...", listaPuntosVenta);
        if (!map || !window.google) {
            console.warn("El mapa o la API de Google no están listos.");
            return;
        }

        await ensureAdvancedMarkerLibrary();
        const PinClass = AdvancedMarkerElementClass || window.google.maps.Marker;

        // Limpiar markers viejos y rutas previas
        storeMarkers.forEach((m) => { m.map = null; });
        storeMarkers = [];
        if (currentPolyline) {
            currentPolyline.setMap(null);
            currentPolyline = null;
        }

        if (!listaPuntosVenta || listaPuntosVenta.length === 0) {
            console.warn("El producto seleccionado no tiene puntos de venta asociados.");
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        let puntosValidos = 0;

        listaPuntosVenta.forEach((punto) => {
            const lat = parseFloat(punto.latitud);
            const lng = parseFloat(punto.longitud);

            if (isNaN(lat) || isNaN(lng)) return;
            puntosValidos++;

            const pos = { lat, lng };

            try {
                const markerOptions = {
                    map: map,
                    position: pos,
                    title: punto.ubicacion || punto.direccion,
                };

                const imageUrl = punto.imagen || "https://cdn-icons-png.flaticon.com/512/8771/8771926.png";

                const isAdvanced = window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement && 
                                   (PinClass === window.google.maps.marker.AdvancedMarkerElement || PinClass.name?.includes("AdvancedMarkerElement"));
                                   
                if (isAdvanced) {
                    const img = document.createElement("img");
                    img.src = imageUrl;
                    img.title = punto.ubicacion || "Sucursal";
                    img.style.width = "40px";
                    img.style.height = "40px";
                    img.style.borderRadius = "50%";
                    img.style.border = "2px solid white";
                    img.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
                    img.style.backgroundColor = "white";
                    img.style.objectFit = "contain";
                    img.style.padding = "2px";
                    markerOptions.content = img;
                } else {
                    markerOptions.icon = {
                        url: imageUrl,
                        scaledSize: new window.google.maps.Size(40, 40)
                    };
                }

                const pin = new PinClass(markerOptions);
                storeMarkers.push(pin);
                bounds.extend(pos);
            } catch (err) {
                console.error("Error intertando crear pin:", err);
            }
        });

        console.log(`Se dibujaron ${puntosValidos} marcadores.`);
        if (puntosValidos > 0) {
            map.fitBounds(bounds);
            if (puntosValidos === 1 && !lastLatLng) {
                setTimeout(() => map.setZoom(15), 100);
            }

            // Si contamos con la ubicación del usuario, trazamos ruta a la más cercana
            if (lastLatLng) {
                traceRouteToClosest(lastLatLng, listaPuntosVenta);
            }
        }
    };

    function boot() {
        // modalCloseBtn?.addEventListener('click', closeCompanyModal);

        // modalOverlay?.addEventListener('click', (e) => {
        //     if (e.target === modalOverlay) closeCompanyModal();
        // });

        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape') closeCompanyModal();
        // });

        requestLocationPermission();
    }

    document.addEventListener('DOMContentLoaded', boot);
})();
