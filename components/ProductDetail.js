//tipos de archivos
const TA_IMAGEN = "IMAGEN";
const TA_VIDEO = "VIDEO";

class ProductDetail extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.loading = true;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
    <link rel="stylesheet" href="./style/product.css" />

    <div id="gallery-skeleton">
  <div class="skeleton skeleton-img"></div>
  <div class="skeleton skeleton-img"></div>
  <div class="skeleton skeleton-img"></div>
</div>

<div id="extras-container-skeleton">
  <div class="skeleton skeleton-title"></div>

  <div id="extras-skeleton">
    <div class="extra-skeleton">
      <div class="skeleton skeleton-extra-img"></div>
      <div class="extra-content">
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </div>

    <div class="extra-skeleton">
      <div class="skeleton skeleton-extra-img"></div>
      <div class="extra-content">
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </div>
  </div>
</div>


        <image-gallery id="gallery">
        </image-gallery>
        <div id="extras-container">
          <h3>Conoce más</h3>
          <div id="extras">
        </div>
        </div>
        </div>
        `;
  }

  setData(data) {
    if (!data) return;

    this.data = data;
    this.loading = false;
    this.render();
  }

  render() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    if (this.loading) {
      $("gallery-skeleton").classList.remove("hidden");
      $("extras-container-skeleton").classList.remove("hidden");
      $("extras").classList.add("hidden");
      $("gallery").classList.add("hidden");
      return;
    }

    $("gallery-skeleton").classList.add("hidden");
    $("extras-container-skeleton").classList.add("hidden");
    $("gallery").classList.remove("hidden");
    $("extras").classList.remove("hidden");

    const modal = document.getElementById('imgModal');
    const extrasContainer = this.shadowRoot.getElementById('extras-container');

    const gallery = this.shadowRoot.getElementById("gallery");

    if(this.data.listaArchivos){

    const galeria = this.data.listaArchivos.filter(e => e.tipoArchivo === TA_IMAGEN || e.tipoArchivo === TA_VIDEO);
    // datos
    if (galeria.length > 0) {
       galeria.map((element) => {
        if(element.tipoArchivo === TA_IMAGEN){
            const image = document.createElement("img");
            image.src = element.urlArchivo;
            image.addEventListener('click', () => {
                 modal.open(image.src);
            });

            gallery.appendChild(image);
        }
        if(element.tipoArchivo === TA_VIDEO){
            const video = document.createElement("iframe");
            video.src = element.urlArchivo;
            video.frameBorder="0";
            video.referrerPolicy="strict-origin-when-cross-origin";
            video.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            video.allowFullscreen = true;
            gallery.appendChild(video);
        }
       });
    } else {
      gallery.style.display = "none";
    }
    const extrasWrapper = this.shadowRoot.getElementById("extras");
    const extras = this.data.listaArchivos.filter(e => e.tipoArchivo !== TA_IMAGEN && e.tipoArchivo !== TA_VIDEO);
    if (extras.length > 0) {
      extras.map((element) => {
        const extra = document.createElement("extra-element");
        //['title', 'description', 'img', 'link'];
        extra.setAttribute('title', element.nombre || "");
        extra.setAttribute('description', element.descripcion || "");
        extra.setAttribute('img', element.preview || "");
        extra.setAttribute('link', element.urlArchivo || "");
        
        extrasWrapper.appendChild(extra);
      });
    } else {
      extrasContainer.style.display = "none";
    }

    }
    else{
        extrasContainer.style.display = "none";
        gallery.style.display = "none";
    }
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return [];
  }

  attributeChangedCallback() {
    this.render();
  }
}

if (!customElements.get("product-detail")) {
  customElements.define("product-detail", ProductDetail);
}
