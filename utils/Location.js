function getUserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La geolocalización no está soportada en este navegador.'));
      return;
    }

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
    const res = await fetch('https://api.ipify.org?format=json');
    /*
    if (!response.ok) {
      throw new Error('No se pudo obtener la ubicación por IP');
    }*/

     const data = await res.json();
     const res2 = await fetch(`https://ipinfo.io/${data.ip}`);
     const data2 = await res2.json();
     console.log(data);
    

    return {
    city: data.city,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude
    };

  } catch (error) {
    console.log(error);
    throw new Error('Error al obtener ubicación por IP');
  }
}

export async function getLocation() {
  const location = getUserLocation().then(data => {return data}).catch(getLocationByIP().then(location => {return location}));
  console.log(location.then());
    return location;
}