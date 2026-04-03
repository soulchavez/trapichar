async function getMarca(marca) {
  try {
    const response = await fetch(`https://dev-api-publicsearch.trapichar.com/Fabricante/Obtener?slug=${marca}`);
    const responseSegmentos = await fetch(`https://dev-api-publicsearch.trapichar.com/FabricanteSegmento/Listado?slug=${marca}`);
    const data = await response.json();
    const dataSegmentos = await response.json();
    data.segmentos = dataSegmentos.listaSegmentos;
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

