
const EXAMPLE_PRODUCTS = [
  { name: "Taza de cerámica", img: "https://picsum.photos/seed/mug/400/400" },
  {
    name: "Lámpara de escritorio",
    img: "https://picsum.photos/seed/lamp/400/400",
  },
  { name: "Set de cuadernos", img: "https://picsum.photos/seed/note/400/400" },
  { name: "Botella de agua", img: "https://picsum.photos/seed/bottle/400/400" },
  { name: "Reloj de pared", img: "https://picsum.photos/seed/clock/400/400" },
  {
    name: "Cojín decorativo",
    img: "https://picsum.photos/seed/pillow/400/400",
  },
  { name: "Tetera", img: "https://picsum.photos/seed/kettle/400/400" },
  { name: "Auriculares", img: "https://picsum.photos/seed/headphones/400/400" },
  { name: "Manta", img: "https://picsum.photos/seed/blanket/400/400" },
];

const HOME_FAVORITES_COUNT = 3;

const EXAMPLE_CATEGORIES = [
  {
    name: "Hogar y decoración",
    img: "https://picsum.photos/seed/hogar/400/400",
  },
  { name: "Oficina", img: "https://picsum.photos/seed/oficina/400/400" },
  { name: "Regalos", img: "https://picsum.photos/seed/regalos/400/400" },
  { name: "Temporada", img: "https://picsum.photos/seed/temporada/400/400" },
];

/**
 * Home screen for a company: header, search, favorites (preview + full list),
 * and categories (grid + full list with search). Renders inside a shadow root.
 *
 * @extends HTMLElement
 */
class CompanyHomePage extends HTMLElement {
  /**
   * Attaches shadow DOM, injects markup, and applies styles (constructable stylesheet or a style element).
   */
  constructor() {
    super();
    this._favoritesNavBound = false;
    this._categoriesNavBound = false;
    this._selectedCategoryName = "";
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./style/CompanyHomePage.css" />
            <div class="home-shell">
                <company-header></company-header>
                <div class="main-view">
                    <div class="storefront">
                        <div class="search-wrap">
                            <img class="search-icon" src="./assets/icons/magnify.svg" alt="Buscar" />
                            <input type="search" class="search-input" placeholder="Buscar productos" autocomplete="off" />
                        </div>
                        <section class="section" aria-labelledby="favorites-heading">
                            <div class="section-header">
                                <h2 class="section-title" id="favorites-heading">Favoritos</h2>
                                <button type="button" class="see-more">
                                    Ver más
                                    <img class="see-more-icon" src="./assets/icons/down_arrow.svg" alt="Ver más" />
                                </button>
                            </div>
                            <div class="favorites-grid" id="favorites-grid"></div>
                        </section>
                        <section class="section" aria-labelledby="categories-heading">
                            <h2 class="section-title" id="categories-heading">Categorías</h2>
                            <div class="categories-grid" id="categories-grid"></div>
                        </section>
                    </div>
                    <div class="favorites-full-view" hidden>
                        <div class="favorites-full-toolbar">
                            <button type="button" class="favorites-back">
                            <img class="favorites-back-icon" src="./assets/icons/down_arrow.svg" alt="Inicio" />
                            Inicio
                            </button>
                            <h2 class="favorites-full-title">Favoritos</h2>
                        </div>
                        <div class="favorites-full-grid" id="favorites-full-grid"></div>
                    </div>
                    <div class="categories-full-view" hidden>
                        <div class="favorites-full-toolbar">
                            <button type="button" class="categories-back">
                            <img class="favorites-back-icon" src="./assets/icons/down_arrow.svg" alt="Inicio" />
                            Inicio
                            </button>
                            <h2 class="favorites-full-title">Categorías</h2>
                        </div>
                        <div class="search-wrap">
                            <img class="search-icon" src="./assets/icons/magnify.svg" alt="Buscar" />
                            <input
                                type="search"
                                class="search-input categories-search-input"
                                placeholder="Buscar productos"
                                autocomplete="off"
                            />
                        </div>
                        <div class="categories-full-grid" id="categories-full-grid"></div>
                    </div>
                </div>
            </div>
        `;


  }

  /**
   * Initial paint: grids, header sync, placeholders, and one-time event wiring for favorites/categories navigation.
   */
  connectedCallback() {
    this.renderGrids();
    this.syncHeader();
    this.syncSearchPlaceholder();
    this._bindFavoritesNavigation();
    this._bindCategoriesNavigation();
  }

  /**
   * Wires "Ver más" (favorites) and back: toggles between main view and the full favorites grid (2 columns).
   * Runs once per element instance.
   */
  _bindFavoritesNavigation() {
    if (this._favoritesNavBound) return;
    this._favoritesNavBound = true;

    const root = this.shadowRoot;
    const seeMore = root.querySelector(".see-more");
    const back = root.querySelector(".favorites-back");
    const mainView = root.querySelector(".storefront");
    const fullView = root.querySelector(".favorites-full-view");

    seeMore?.addEventListener("click", () => {
      const categoriesFullView = root.querySelector(".categories-full-view");
      mainView.hidden = true;
      if (categoriesFullView) categoriesFullView.hidden = true;
      fullView.hidden = false;
      this.renderFavoritesFullList();
    });

    back?.addEventListener("click", () => {
      fullView.hidden = true;
      mainView.hidden = false;
    });
  }

  /**
   * Wires category card clicks and back; opens full categories view with search filter under the title.
   * Runs once per element instance.
   */
  _bindCategoriesNavigation() {
    if (this._categoriesNavBound) return;
    this._categoriesNavBound = true;

    const root = this.shadowRoot;
    const categoriesGrid = root.getElementById("categories-grid");
    const mainView = root.querySelector(".storefront");
    const favoritesFullView = root.querySelector(".favorites-full-view");
    const categoriesFullView = root.querySelector(".categories-full-view");
    const back = root.querySelector(".categories-back");
    const categoriesSearchInput = root.querySelector(
      ".categories-search-input",
    );
    const categoriesFullTitle = root.querySelector(
      ".categories-full-view .favorites-full-title",
    );

    categoriesGrid?.addEventListener("click", (event) => {
      const card = event.target.closest(".category-card");
      if (!card) return;
      if (!mainView || !categoriesFullView) return;
      const categoryName =
        card.querySelector(".category-name")?.textContent?.trim() ||
        "Categoría";

      this._selectedCategoryName = categoryName;
      if (categoriesFullTitle) categoriesFullTitle.textContent = categoryName;
      mainView.hidden = true;
      if (favoritesFullView) favoritesFullView.hidden = true;
      categoriesFullView.hidden = false;
      if (categoriesSearchInput) categoriesSearchInput.value = "";
      this.renderCategoryProductsList();
    });

    back?.addEventListener("click", () => {
      if (categoriesFullView) categoriesFullView.hidden = true;
      if (mainView) mainView.hidden = false;
    });

    categoriesSearchInput?.addEventListener("input", (event) => {
      const term = event.target.value || "";
      this.renderCategoryProductsList(term);
    });
  }

  /**
   * Host attributes that should update the inner `company-header` or search placeholder.
   * @returns {string[]}
   */
  static get observedAttributes() {
    return [
      "company",
      "mail",
      "img",
      "social-media",
      "social-networks",
      "search-placeholder",
    ];
  }

  /**
   * Reacts to attribute changes on the host (header props, search placeholder).
   */
  attributeChangedCallback() {
    this.syncHeader();
    this.syncSearchPlaceholder();
  }

  /**
   * Sets the main storefront search input placeholder from `search-placeholder` or default copy.
   */
  syncSearchPlaceholder() {
    const input = this.shadowRoot.querySelector(".search-input");
    if (!input) return;
    input.placeholder =
      this.getAttribute("search-placeholder") || "Buscar productos";
  }

  /**
   * Copies relevant host attributes onto the nested `company-header` (company, mail, img, social).
   */
  syncHeader() {
    const header = this.shadowRoot.querySelector("company-header");
    if (!header) return;
    for (const attr of [
      "company",
      "mail",
      "img",
      "social-media",
      "social-networks",
    ]) {
      const v = this.getAttribute(attr);
      if (v != null) {
        header.setAttribute(attr, v);
      } else {
        header.removeAttribute(attr);
      }
    }
  }

  /**
   * Fills the full favorites grid with all example products (used when "Ver más" is pressed).
   */
  renderFavoritesFullList() {
    const grid = this.shadowRoot.getElementById("favorites-full-grid");
    if (!grid) return;

    grid.innerHTML = EXAMPLE_PRODUCTS.map(
      (p) => `
            <article class="product-card">
                <img class="product-thumb" src="${p.img}" alt="${p.name}" loading="lazy" />
                <p class="product-name">${p.name}</p>
            </article>
        `,
    ).join("");
  }

  /**
   * Renders products for the selected category, optionally filtered by product name.
   * @param {string} [searchTerm=''] - Filter text from the category products search input.
   */
  renderCategoryProductsList(searchTerm = "") {
    const grid = this.shadowRoot.getElementById("categories-full-grid");
    if (!grid) return;

    const term = searchTerm.trim().toLowerCase();
    const list = !term
      ? EXAMPLE_PRODUCTS
      : EXAMPLE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(term));

    grid.innerHTML = list
      .map(
        (p) => `
            <article class="product-card">
                <img class="product-thumb" src="${p.img}" alt="${p.name}" loading="lazy" />
                <p class="product-name">${p.name}</p>
            </article>
        `,
      )
      .join("");
  }

  /**
   * Populates the home favorites strip (first N products) and the home categories grid.
   */
  renderGrids() {
    const fav = this.shadowRoot.getElementById("favorites-grid");
    const cat = this.shadowRoot.getElementById("categories-grid");
    if (!fav || !cat) return;

    const homeProducts = EXAMPLE_PRODUCTS.slice(0, HOME_FAVORITES_COUNT);
    fav.innerHTML = homeProducts
      .map(
        (p) => `
            <article class="product-card">
                <img class="product-thumb" src="${p.img}" alt="${p.name}" loading="lazy" />
                <p class="product-name">${p.name}</p>
            </article>
        `,
      )
      .join("");

    cat.innerHTML = EXAMPLE_CATEGORIES.map(
      (c) => `
            <article class="category-card">
                <img class="category-thumb" src="${c.img}" alt="${c.name}" loading="lazy" />
                <p class="category-name">${c.name}</p>
            </article>
        `,
    ).join("");
  }
}

if (!customElements.get("company-home-page")) {
  customElements.define("company-home-page", CompanyHomePage);
}
