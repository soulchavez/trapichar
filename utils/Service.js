import { API_URL } from "./consts.js";

// Caché en memoria para persistir datos durante la sesión sin recargar la página
const AppCache = {
  marcas: {},
  segmentos: {},
  productos: {}
};

export async function getMarca(marca) {
  if (AppCache.marcas[marca]) {
    return AppCache.marcas[marca];
  }

  try {
    const response = await fetch(`${API_URL}Fabricante/Obtener?slug=${marca}`);
    const responseSegmentos = await fetch(`${API_URL}FabricanteSegmento/Listado?slug=${marca}`);
    const data = await response.json();
    const dataSegmentos = await responseSegmentos.json();
    data.segmentos = dataSegmentos.listaSegmentos;

    AppCache.marcas[marca] = data; // Guardamos en caché

    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

export async function getProductsBySegment(marca, segment) {
  const cacheKey = `${marca}_${segment}`;
  if (AppCache.segmentos[cacheKey]) {
    return AppCache.segmentos[cacheKey];
  }

  try {
    const response = await fetch(`${API_URL}FabricanteSegmento/Obtener?slug=${marca}&path=${segment}`);
    const data = await response.json();

    AppCache.segmentos[cacheKey] = data; // Guardamos en caché

    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

export async function getDetalleProducto(cb, marca, lat, long,) {
  const cacheKey = `${cb}_${lat}_${long}`;
  if (AppCache.productos[cacheKey]) {
    return AppCache.productos[cacheKey];
  }

  try {
    const response = await fetch(`${API_URL}Producto/Obtener?codigoBarra=${cb}`);
    const data = await response.json();
    if (response.status === 404) {
      return null;
    }

    const responseStores = await fetch(`${API_URL}Producto/tiendasCercanas?productoId=${data.id}&lat=${lat}&lng=${long}`);

    const dataStores = await responseStores.json();

    const uniqueStores = dataStores.listaPuntosVenta.filter((store, index, self) =>
      index === self.findIndex((s) => s.latitud === store.latitud && s.longitud === store.longitud)
    );

    data.listaPuntosVenta = uniqueStores;
    data.listaTiendasLinea = dataStores.listaTiendasLinea;
    data.latitude = lat;
    data.longitude = long;

    AppCache.productos[cacheKey] = data; // Guardamos en caché

    return data;
  } catch (error) {
    console.error('Error:', error);
  }

}

export function resolveComponent(data) {
  if (data.marca && data.cb && data.marca !== null && data.cb !== null) return 'bottom-drawer';
  if (data.marca && data.marca !== null) return 'company-modal';
  return null;
}

export async function getData(data, lat, long) {
  if (data.marca && data.cb) {
    const datos = await getDetalleProducto(data.cb, data.marca, lat, long);
    await renderStoresOnMap(datos.listaPuntosVenta);
    return datos;
  }
  if (data.marca) {
    return await getMarca(data.marca);
  }
}