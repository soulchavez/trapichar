/* global google */

/**
 * Main application logic for the Trapichar map interface.
 * Handles user location, store marker clustering, and route computation.
 */
(function () {
    // DOM Element References
    const statusEl = document.getElementById('location-status');
    const modalOverlay = document.getElementById('company-modal-overlay');
    const modalCloseBtn = document.getElementById('company-modal-close');
    const topInfoText = document.getElementById('top-info-text');

    // Default configuration for the map center (Mexico City) and zoom level
    const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 };
    const DEFAULT_ZOOM = 12;

    /**
     * Map ID required for AdvancedMarkerElement.
     * Managed via Google Cloud Console -> Maps Platform -> Map Management.
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
     * Generates a custom directional marker (arrow) pointing at the route's path.
     * @param {number} bearingDeg - The angle to rotate the arrow asset.
     * @returns {HTMLElement} The container div for the marker content.
     */
    function createArrowMarkerContent(bearingDeg) {
        const container = document.createElement('div');
        container.style.width = '44px';
        container.style.height = '44px';
        container.style.position = 'relative';
        container.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))';

        // Animated pulsing glow for visual interest and location clarity
        const glow = document.createElement('div');
        glow.style.position = 'absolute';
        glow.style.inset = '-6px';
        glow.style.borderRadius = '50%';
        glow.style.background = 'radial-gradient(circle, rgba(10,122,251,0.3) 0%, transparent 70%)';
        glow.style.animation = 'pulseGlow 2s ease-in-out infinite';
        container.appendChild(glow);

        const img = document.createElement('img');
        img.src = './assets/icons/user_pointer.svg';
        img.alt = 'Tu ubicación';
        img.style.width = '44px';
        img.style.height = '44px';
        // asset points LEFT (270°) by default; offset +90 to align with 0° north
        const rotation = bearingDeg + 90;
        img.style.transform = `rotate(${rotation}deg)`;
        img.style.transition = 'transform 0.4s ease';
        img.style.position = 'relative';
        container.appendChild(img);

        return container;
    }

    /**
     * Converts coordinate pairs into raw pixels at a specific zoom level.
     * Essential for pixel-distance based clustering calculations.
     */
    function latLngToPixel(lat, lng, zoom) {
        const scale = Math.pow(2, zoom) * 256;
        const x = (lng + 180) / 360 * scale;
        const sinLat = Math.sin(lat * Math.PI / 180);
        const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
        return { x, y };
    }

    /**
     * Main clustering algorithm: Groups nearby valid points into clusters.
     * @param {Array} validPoints - List of store locations with lat/lng.
     * @param {number} zoom - Current map zoom level.
     * @returns {Array} List of cluster objects.
     */
    function clusterPoints(validPoints, zoom) {
        const clusters = [];
        const assigned = new Array(validPoints.length).fill(false);

        for (let i = 0; i < validPoints.length; i++) {
            if (assigned[i]) continue;

            const cluster = { points: [validPoints[i]], centerLat: validPoints[i].lat, centerLng: validPoints[i].lng };
            assigned[i] = true;

            const pixelI = latLngToPixel(validPoints[i].lat, validPoints[i].lng, zoom);

            for (let j = i + 1; j < validPoints.length; j++) {
                if (assigned[j]) continue;

                const pixelJ = latLngToPixel(validPoints[j].lat, validPoints[j].lng, zoom);
                const dx = pixelI.x - pixelJ.x;
                const dy = pixelI.y - pixelJ.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CLUSTER_PIXEL_RADIUS) {
                    cluster.points.push(validPoints[j]);
                    assigned[j] = true;
                }
            }

            // Recenter cluster at the centroid of its constituents
            if (cluster.points.length > 1) {
                let sumLat = 0, sumLng = 0;
                cluster.points.forEach(p => { sumLat += p.lat; sumLng += p.lng; });
                cluster.centerLat = sumLat / cluster.points.length;
                cluster.centerLng = sumLng / cluster.points.length;
            }

            clusters.push(cluster);
        }

        return clusters;
    }

    /**
     * Renders a cluster marker: Store SVG with a white circle and black number in the middle.
     * @param {number} count - Number of stores in this cluster.
     */
    function createClusterContent(count) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '30px'; 
        container.style.height = '49px';
        container.style.cursor = 'pointer';
        container.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        const img = document.createElement('img');
        img.src = './assets/icons/store.svg';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        container.appendChild(img);

        const badge = document.createElement('div');
        badge.textContent = count;
        badge.style.position = 'absolute';
        badge.style.left = '17px'; // Centers in the SVG hole
        badge.style.top = '17px';
        badge.style.transform = 'translate(-50%, -50%)';
        badge.style.marginLeft = '-2px'; // Small nudge for visual balance
        
        badge.style.width = '16px';
        badge.style.height = '16px';
        badge.style.lineHeight = '16px';
        badge.style.backgroundColor = 'white';
        badge.style.borderRadius = '50%';
        badge.style.color = '#000';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = '800';
        badge.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        badge.style.textAlign = 'center';
        badge.style.pointerEvents = 'none';
        container.appendChild(badge);

        return container;
    }

    /**
     * Renders a single store marker using the default store SVG.
     */
    function createSingleMarkerContent(title) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '30px';
        container.style.height = '49px';
        container.style.cursor = 'pointer';
        container.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        const img = document.createElement('img');
        img.src = './assets/icons/store.svg';
        img.title = title || 'Sucursal';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        container.appendChild(img);

        return container;
    }

    /**
     * Clears reference-held store/cluster markers from the map instance.
     */
    function clearStoreMarkers() {
        storeMarkers.forEach(m => { m.map = null; });
        storeMarkers = [];
    }

    /**
     * Re-calculates and re-renders store markers based on current zoom and store data.
     * Invoked every time the map zoom reaches a steady state.
     */
    async function renderClustered() {
        if (!map || !currentStoreData || currentStoreData.length === 0) return;

        await ensureAdvancedMarkerLibrary();
        const PinClass = AdvancedMarkerElementClass || window.google.maps.Marker;
        const isAdvanced = window.google.maps.marker &&
            window.google.maps.marker.AdvancedMarkerElement &&
            (PinClass === window.google.maps.marker.AdvancedMarkerElement ||
                PinClass.name?.includes('AdvancedMarkerElement'));

        clearStoreMarkers();

        const zoom = map.getZoom();

        // Pass only parseable coordinates to the clustering engine
        const validPoints = [];
        currentStoreData.forEach(punto => {
            const lat = parseFloat(punto.latitud);
            const lng = parseFloat(punto.longitud);
            if (isNaN(lat) || isNaN(lng)) return;
            validPoints.push({ lat, lng, punto });
        });

        if (validPoints.length === 0) return;

        const clusters = clusterPoints(validPoints, zoom);

        clusters.forEach(cluster => {
            try {
                const firstPunto = cluster.points[0].punto;
                const pos = { lat: cluster.centerLat, lng: cluster.centerLng };

                const markerOptions = {
                    map: map,
                    position: pos,
                };

                if (cluster.points.length > 1) {
                    // Render modern cluster or fallback icon
                    if (isAdvanced) {
                        markerOptions.content = createClusterContent(cluster.points.length);
                        markerOptions.title = `${cluster.points.length} sucursales`;
                    } else {
                        markerOptions.icon = {
                            url: './assets/icons/store.svg',
                            scaledSize: new window.google.maps.Size(30, 49),
                        };
                        markerOptions.label = {
                            text: String(cluster.points.length),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '800',
                        };
                        markerOptions.title = `${cluster.points.length} sucursales`;
                    }

                    const pin = new PinClass(markerOptions);

                    // User can click cluster to expand/zoom in to the specific area
                    const clickHandler = () => {
                        const clusterBounds = new window.google.maps.LatLngBounds();
                        cluster.points.forEach(p => clusterBounds.extend({ lat: p.lat, lng: p.lng }));
                        map.fitBounds(clusterBounds);
                    };

                    // Modern markers use specialized gmp-click to avoid performance overhead
                    if (isAdvanced) {
                        pin.addListener('gmp-click', clickHandler);
                    } else {
                        pin.addListener('click', clickHandler);
                    }

                    storeMarkers.push(pin);
                } else {
                    // Render single marker
                    markerOptions.title = firstPunto.ubicacion || firstPunto.direccion;

                    if (isAdvanced) {
                        markerOptions.content = createSingleMarkerContent(firstPunto.ubicacion);
                    } else {
                        markerOptions.icon = {
                            url: './assets/icons/store.svg',
                            scaledSize: new window.google.maps.Size(30, 49),
                        };
                    }

                    const pin = new PinClass(markerOptions);
                    storeMarkers.push(pin);
                }
            } catch (err) {
                console.error('Error intentando crear pin/cluster:', err);
            }
        });
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

    /**
     * Updates UI text status for location acquisition.
     */
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

    /**
     * Ensures the marker library is loaded before creating advanced markers.
     */
    async function ensureAdvancedMarkerLibrary() {
        if (AdvancedMarkerElementClass) return;
        if (google.maps.importLibrary) {
            const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
            AdvancedMarkerElementClass = AdvancedMarkerElement;
        } else {
            AdvancedMarkerElementClass = google.maps.marker.AdvancedMarkerElement;
        }
    }

    /**
     * Renders or updates the user's location marker.
     * @param {object} latLng - Geolocated coordinates.
     * @param {number} accuracyMeters - Geolocation accuracy radius.
     * @param {number|null} bearingDeg - Optional rotation for the arrow marker.
     */
    async function setUserLocation(latLng, accuracyMeters, bearingDeg) {
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

        // Global pulse animation for the arrow pointer's background glow
        if (!document.getElementById('arrow-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'arrow-pulse-style';
            style.textContent = `
                @keyframes pulseGlow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.4; }
                }
            `;
            document.head.appendChild(style);
        }

        const markerOpts = {
            map,
            position: latLng,
            title: 'Tu ubicación',
        };

        // Use custom arrow asset if destination/bearing is active, otherwise default pinpoint
        if (bearingDeg != null && Number.isFinite(bearingDeg)) {
            markerOpts.content = createArrowMarkerContent(bearingDeg);
        }

        marker = new AdvancedMarkerElementClass(markerOpts);

        // Accuracy visual circle
        const hasAccuracy = accuracyMeters && Number.isFinite(accuracyMeters);
        if (accuracyCircle) accuracyCircle.setMap(null);
        accuracyCircle = null;

        if (hasAccuracy) {
            const radius = Math.max(accuracyMeters, 30); 
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

    /**
     * Triggers the browser's geolocation flow.
     */
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

    /**
     * Main Map constructor. Invoked once core Maps library is loaded.
     */
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

    /**
     * Primary entry point for rendering store locations.
     * Handles data caching, initial bounds fitting, and zoom listener setup.
     */
    window.renderStoresOnMap = async function (listaPuntosVenta) {
        if (!map || !window.google) return;

        await ensureAdvancedMarkerLibrary();

        clearStoreMarkers();
        if (currentPolyline) {
            currentPolyline.setMap(null);
            currentPolyline = null;
        }

        if (zoomListener) {
            window.google.maps.event.removeListener(zoomListener);
            zoomListener = null;
        }

        if (!listaPuntosVenta || listaPuntosVenta.length === 0) {
            currentStoreData = null;
            return;
        }

        currentStoreData = listaPuntosVenta;

        const bounds = new window.google.maps.LatLngBounds();
        let puntosValidos = 0;

        listaPuntosVenta.forEach(punto => {
            const lat = parseFloat(punto.latitud);
            const lng = parseFloat(punto.longitud);
            if (isNaN(lat) || isNaN(lng)) return;
            puntosValidos++;
            bounds.extend({ lat, lng });
        });

        if (puntosValidos > 0) {
            map.fitBounds(bounds);
            if (puntosValidos === 1 && !lastLatLng) {
                setTimeout(() => map.setZoom(15), 100);
            }

            setTimeout(() => { renderClustered(); }, 150);

            // Debounced re-clustering happens on every zoom change to keep map clean
            zoomListener = map.addListener('zoom_changed', () => {
                clearTimeout(clusterDebounceTimer);
                clusterDebounceTimer = setTimeout(() => {
                    renderClustered();
                }, 200);
            });

            if (lastLatLng) {
                traceRouteToClosest(lastLatLng, listaPuntosVenta);
            }
        }
    };

    /**
     * Initializes the logic flow when the DOM is ready.
     */
    function boot() {
        // Modal lifecycle listeners could go here
        requestLocationPermission();
    }

    window.mapUtils = {
    traceRouteToClosest
    };

    document.addEventListener('DOMContentLoaded', boot);
})();
