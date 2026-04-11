const localSummaryProductStyles = `
:host {
    display: block;
    color: var(--text, #2A2A2A);
    font-family: 'Inter', sans-serif;
}

.skeleton {
    background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
    border-radius: 6px;
    }

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
    }

    .hidden {
    display: none;
    }


#product-summary{
    display: flex;
    flex-direction: column;
    gap: 8px;
}

#product-info{
  display: flex;
  align-items: center;
  gap: 12px;

}

#go-to{
  height:2.2rem;
}

.open{
    flex-direction: column-reverse !important;
}

@media(min-width:1024px){

   #more-button{
    display:none !important;
   }
}

`;

const localSummarySheet = (() => {
  if (
    typeof CSSStyleSheet === "undefined" ||
    typeof CSSStyleSheet.prototype.replaceSync !== "function"
  ) {
    return null;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(localSummaryProductStyles);
  return sheet;
})();

const supportsConstructableStyles2 =
  localSummarySheet &&
  "adoptedStyleSheets" in ShadowRoot.prototype &&
  "replaceSync" in CSSStyleSheet.prototype;

class ProductSummary extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.loading = true;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
    <link rel="stylesheet" href="./style/product.css" />
    <div id="product-summary">

        <!-- Skeleton -->
        <div id="skeleton">
          <div class="skeleton" style="height: 20px; width: 60%; margin-bottom:10px;"></div>
          <div class="skeleton" style="height: 16px; width: 40%; margin-bottom:10px;"></div>
          <div class="skeleton" style="height: 80px; width: 100%;"></div>
        </div>

        <!-- Content -->
        <div id="content" class="hidden">

          <div class="closest-location-wrapper">
            <div>
              <span>Ubicación más cercana</span>
              <div id="closest-location"></div>
            </div>
            <button id="go-to">Cómo llegar <img src="./assets/icons/go_to.svg" alt="go to icon"/></button>
          </div>

          <a id="more-locations">Más ubicaciones</a>

          <div id="online-stores">
            <span>Disponible en línea</span>
            <div id="stores"></div>
          </div>

          <div id="product">
            <div id="product-info">
              <img id="product-image">
                <div>
                  <div id="product-name">
                    <span class="name"></span>
                    <div class="tag"></div>
                  </div>

                  <div id="description"></div>
                </div>
            </div>

            <button id="more-button" class="filled">
                <span class="label">Más</span>
                <img class="arrow" src="./assets/icons/white_arrow.svg" alt="flecha"/>
            </button>
          </div>

        </div>
      </div>
        `;

    if (supportsConstructableStyles2) {
      shadowRoot.adoptedStyleSheets = [localSummarySheet];
    } else {
      const styleEl = document.createElement("style");
      styleEl.textContent = localSummarySheet;
      shadowRoot.prepend(styleEl);
    }
  }

  render() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    if (this.loading) {
      $("skeleton").classList.remove("hidden");
      $("content").classList.add("hidden");
      return;
    }

    $("skeleton").classList.add("hidden");
    $("content").classList.remove("hidden");

    // datos
    if (this.data.listaPuntosVenta.length > 0) {
      const closestLocation = this.data.listaPuntosVenta[0];
      this.shadowRoot.getElementById("closest-location").innerHTML =
        closestLocation.ubicacion;

        
        this.shadowRoot.getElementById('go-to').addEventListener('click', () => {
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${this.data.latitude},${this.data.longitude}&destination=${closestLocation.latitud},${closestLocation.longitud}&dir_action=navigate`, '_blank');
        });
    } else {
      this.shadowRoot.getElementsByClassName(
        "closest-location-wrapper",
      )[0].style.display = "none";
    }

    const onlineStores = this.shadowRoot.getElementById("stores");
    onlineStores.innerHTML = '';

    if (this.data.listaTiendasLinea.length > 0) {
      this.data.listaTiendasLinea.map((tienda) => {
        const anchor = document.createElement("a");
        anchor.href = tienda.url;
        anchor.innerHTML = `<img class="online-store" alt=${tienda.nombre} src=${tienda.imagen}>`;

        onlineStores.appendChild(anchor);
      });
    } else {
      this.shadowRoot.getElementById("online-stores").style.display = "none";
    }

    $("product-image").src = this.data.imagen || "";
    $("description").textContent = this.data.descripcion || "";

    this.shadowRoot.querySelector(".name").textContent = this.data.nombre || "";

    if (!this.data.segmento || this.data.segmento === "") {
      this.shadowRoot.querySelector(".tag").style.display = "none";
    } else {
      this.shadowRoot.querySelector(".tag").textContent =
        this.data.segmento || "";
    }
    const moreBtn =  $("more-button");

    if(this.data.listaArchivos === null || this.data.listaArchivos.length === 0){
        moreBtn.style.display = 'none';
    }

    mapUtils.traceRouteToClosest({lat: this.data.latitude, lng: this.data.longitude}, this.data.listaPuntosVenta).then(()=>{
    });
   
  }

  setData(data) {
    if (!data) return;

    this.data = data;
    this.loading = false;
    this.render();
  }

  connectedCallback() {
    this.render();
        const drawer = document.querySelector('bottom-drawer');
        const moreBtn = this.shadowRoot.getElementById('more-button');
        this.updateOpenState();
        this.updateButtonOpenState();
        if(moreBtn){
          moreBtn.addEventListener('click', () => {
            drawer.toggle();
          });
        }

        const moreLocations = this.shadowRoot.getElementById("more-locations");
        if(moreLocations){
          moreLocations.addEventListener('click', () => {
            window.setZoom(10);
          });
        }

  }

  updateOpenState() {
  const el = this.shadowRoot.getElementById("content");
  const description = this.shadowRoot.getElementById('description');

  if (!el) return;

  const isOpen = this.hasAttribute("open");

  el.classList.toggle("open", isOpen);
  description.classList.toggle("full-text", isOpen);
}

updateButtonOpenState(){
   const moreBtn = this.shadowRoot.getElementById('more-button');
   if(!moreBtn) return;
   const isOpen = this.hasAttribute("open");

   moreBtn.classList.toggle("is-collapsed", isOpen);

}

  static get observedAttributes() {
    return ["open"];
  }

attributeChangedCallback(name, oldValue, newValue) {
  if (name === "open") {
    this.updateOpenState();
    this.updateButtonOpenState();
  }
}
}

if (!customElements.get("product-summary")) {
  customElements.define("product-summary", ProductSummary);
}
