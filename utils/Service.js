import { API_URL } from "./consts.js";

export async function getMarca(marca) {
  try {
    const response = await fetch(`${API_URL}Fabricante/Obtener?slug=${marca}`);
    const responseSegmentos = await fetch(`${API_URL}FabricanteSegmento/Listado?slug=${marca}`);
    const data = await response.json();
    const dataSegmentos = await responseSegmentos.json();
    data.segmentos = dataSegmentos.listaSegmentos;
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

export async function getDetalleProducto(cb, marca,lat, long,){
  try{
  const response = await fetch(`${API_URL}Producto/Obtener?codigoBarra=${cb}`);
  const data = await response.json();
  if(response.status === 404){
    return null;
  } 

  const responseStores = await fetch(`${API_URL}Producto/tiendasCercanas?productoId=${data.id}&lat=${lat}&lng=${long}`);
  
  const dataStores = await responseStores.json();

  data.listaPuntosVenta = dataStores.listaPuntosVenta;
  data.listaTiendasLinea = dataStores.listaTiendasLinea;
  data.latitude = lat;
  data.longitude = long;

  return data;
  }catch(error) {
    console.error('Error:', error);
  }

}

