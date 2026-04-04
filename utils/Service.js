export async function getMarca(marca) {
  try {
    const response = await fetch(`https://dev-api-publicsearch.trapichar.com/Fabricante/Obtener?slug=${marca}`);
    const responseSegmentos = await fetch(`https://dev-api-publicsearch.trapichar.com/FabricanteSegmento/Listado?slug=${marca}`);
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
  const response = await fetch(`https://dev-api-publicsearch.trapichar.com/Fabricante/Obtener?slug=${marca}`);
  const data = await response.json();
  if(response.status === 404){
    return null;
  } 

  const result = data.listaProductos.filter(e => e.codigoBarra === cb);
  if(result.length === 0){
    return null;
  }
  const producto = {...result[0]};

  const responseStores = await fetch(`https://dev-api-publicsearch.trapichar.com/Producto/tiendasCercanas?productoId=${producto.id}&lat=${lat}&lng=${long}`);
  
  const dataStores = await responseStores.json();

  producto.listaPuntosVenta = dataStores.listaPuntosVenta;
  producto.listaTiendasLinea = dataStores.listaTiendasLinea;

  return producto;
  }catch(error) {
    console.error('Error:', error);
  }

}

