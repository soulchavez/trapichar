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
