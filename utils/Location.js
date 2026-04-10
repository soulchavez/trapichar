function getUserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada en este navegador.'));
      return;
    }
    /*
    if (!('geolocation' in navigator)) {
      reject(new Error('La geolocalización no está soportada en este navegador.'));
      return;
    }*/

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const finalOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        resolve({
          latitude,
          longitude,
          accuracy
        });
      },
      (error) => {
        let message = '';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'El usuario no permitió el acceso a la ubicación.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'No se pudo obtener la ubicación.';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado.';
            break;
          default:
            message = 'Error desconocido al obtener la ubicación.';
        }

        reject(new Error(message));
      },
      finalOptions
    );
  });
}


async function getLocationByIP() {
  try {
    //https://api.ipify.org?format=json
    const res = await fetch('https://ipapi.co/json/');
    
    if (!res.ok) {
      throw new Error('No se pudo obtener la ubicación por IP');
    }

     const data = await res.json();
    

    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone
    };

  } catch (error) {
    throw new Error('Error al obtener ubicación por IP');
  }
}

export async function getLocation() {
  /*const location = getUserLocation().then(data => {return data}).catch(getLocationByIP().then(location => {return location}));
  console.log(location.then());
    return location;*/
   
  try {
    // intenta GPS primero
    return await getUserLocation();
  } catch {
    // fallback a IP
    return await getLocationByIP();
  }
}
