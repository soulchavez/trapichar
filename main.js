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

    // State variables
    let map = null;
    let marker = null;                  // User location marker (dot or arrow)
    let accuracyCircle = null;          // Accuracy radius circle around user
    let lastLatLng = null;              // Last known user position
    let lastAccuracyMeters = null;      // Last known geolocation accuracy
    let AdvancedMarkerElementClass = null; // Class reference for modern markers
    let closestDestination = null;      // Coords of the nearest store
    let storeMarkers = [];              // Currently rendered store/cluster markers
    let currentPolyline = null;         // Current driving route line
    let currentStoreData = null;        // Store list cache for re-clustering
    let zoomListener = null;            // Map zoom changed event listener
    let clusterDebounceTimer = null;    // Timer to prevent excessive clustering calcs

    // Pixel-distance radius within which markers will be grouped into clusters
    const CLUSTER_PIXEL_RADIUS = 60;

    function setStatus(message) {
        if (!statusEl) return;
        statusEl.textContent = message;
    }

    function openCompanyModal(message = 'Elige un producto y encuentra donde comprar') {
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
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
        AdvancedMarkerElementClass = AdvancedMarkerElement;
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

        if (lastLatLng) {
            await setUserLocation(lastLatLng, lastAccuracyMeters ?? 80);
        }

        return map;
    };

    /**
     * Calculates the rectilinear distance between two geographical points using the Haversine formula.
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Computes the initial bearing (angle) from point A to point B.
     * Used for orienting the directional user pointer.
     * @returns {number} Angle in degrees (0-360)
     */
    function getBearing(lat1, lng1, lat2, lng2) {
        const toRad = (deg) => deg * Math.PI / 180;
        const toDeg = (rad) => rad * 180 / Math.PI;
        const dLng = toRad(lng2 - lng1);
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const x = Math.sin(dLng) * Math.cos(φ2);
        const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
        const θ = Math.atan2(x, y);
        return (toDeg(θ) + 360) % 360;
    }




    /**
     * Calculates the driving route from origin to the closest store location.
     * Uses the modern computeRoutes SDK method.
     */
    async function traceRouteToClosest(originLatLng, listaPuntosVenta) {
        if (!window.google || !window.google.maps) return;

        let closest = null;
        let minDistance = Infinity;

        // Find the store with the shortest straight-line distance to user
        listaPuntosVenta.forEach(punto => {
            const lat = parseFloat(punto.latitud);
            const lng = parseFloat(punto.longitud);
            if (isNaN(lat) || isNaN(lng)) return;

            const dist = getDistance(originLatLng.lat, originLatLng.lng, lat, lng);
            if (dist < minDistance) {
                minDistance = dist;
                closest = { lat, lng };
            }
        });

        if (!closest) return;

        closestDestination = closest;

        try {
            const routesLib = await window.google.maps.importLibrary("routes");
            
            const request = {
                origin: originLatLng,
                destination: closest,
                travelMode: "DRIVING",
                fields: ["*"]
            };

            const response = await routesLib.Route.computeRoutes(request);
            
            if (response && response.routes && response.routes.length > 0) {
                const routePath = response.routes[0].path;
                if (!routePath || routePath.length === 0) return;

                // Cleanup previous route line
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

                // Orient user pointer along the first significant road segment of the route
                const lookAheadIdx = Math.min(5, routePath.length - 1);
                const target = routePath[lookAheadIdx];
                const targetLat = typeof target.lat === 'function' ? target.lat() : target.lat;
                const targetLng = typeof target.lng === 'function' ? target.lng() : target.lng;
                const bearing = getBearing(originLatLng.lat, originLatLng.lng, targetLat, targetLng);
                await setUserLocation(originLatLng, lastAccuracyMeters, bearing);

                // Ensure the entire route fits within the map viewport
                const bounds = new window.google.maps.LatLngBounds();
                routePath.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
            } else {
                // Point straight at the store if no road route is available
                const bearing = getBearing(originLatLng.lat, originLatLng.lng, closest.lat, closest.lng);
                await setUserLocation(originLatLng, lastAccuracyMeters, bearing);
            }
        } catch (error) {
            console.warn("Fallo al trazar ruta usando la nueva API Route.computeRoutes:", error);
            const bearing = getBearing(originLatLng.lat, originLatLng.lng, closest.lat, closest.lng);
            await setUserLocation(originLatLng, lastAccuracyMeters, bearing);
        }
    }


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

    window.mapUtils = {
    traceRouteToClosest
    };

    document.addEventListener('DOMContentLoaded', boot);
})();
