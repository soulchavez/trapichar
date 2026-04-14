import { render } from "../controllers/Home.js";

export function handleClickOnProduct(cb){
  const params = new URLSearchParams(window.location.search);
    params.set("cb", cb);
    const nuevaUrl = `${window.location.pathname}?${params.toString()}`;
    const marca = params.get("marca");
    const cat = params.get('categoria');
    history.pushState({}, "", nuevaUrl);
    render({ marca, cb, cat });
}

export function handleAllProducts(){
    const params = new URLSearchParams(window.location.search);
    params.delete("cb");
    const marca = params.get("marca");
    const cat = params.get('categoria');
    const cb = '';
    const nuevaUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, "", nuevaUrl);
    render({ marca, cb, cat });
}