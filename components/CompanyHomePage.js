
const HOME_FAVORITES_COUNT = 3;

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
    this._slug = '';
    this._favoritesNavBound = false;
    this._categoriesNavBound = false;
    this._selectedCategoryName = "";
    this._favorites = [];
    this._products = [];
    this._allProducts = [];
    this._categories = [];
    this._isProductsMode = false;
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./style/company-home.css" />
            <div class="home-shell">
                <company-header></company-header>
                <div class="main-view">
                    <div class="storefront">
                        <div class="search-wrap">
                            <img class="search-icon" src="./assets/icons/magnify.svg" alt="Buscar" />
                            <input type="search" class="search-input" placeholder="Buscar productos" autocomplete="off" />
                        </div>
                        <section class="section" aria-labelledby="favorites-heading" hidden>
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
    this.syncHeader();
    this.syncSearchPlaceholder();
    this._bindFavoritesNavigation();
    this._bindCategoriesNavigation();
    this._bindMainSearch();
    this._bindProductClicks();
  }

  /**
   * Wires product card clicks to hide the modal and render store markers on the map.
   */
  _bindProductClicks() {
    this.shadowRoot.addEventListener("click", async (event) => {
      const card = event.target.closest(".product-card, .category-card[data-is-product='true']");
      if (!card) return;
      const productId = card.getAttribute("data-id");
      if (!productId) return;

      const product =
        this._products.find((p) => p.id === productId) ||
        this._favorites.find((p) => p.id === productId);

      if (product) {
        // Hide modal overlay but keep modal visible
        const overlay = document.getElementById("company-modal-overlay");
        if (overlay) overlay.classList.add("is-minimized");

        // Render stores on the map via central map manager
        if (typeof window.renderStoresOnMap === "function") {
          window.renderStoresOnMap(product.listaPuntosVenta);
        }
      }
    });
  }

  /**
   * Receives the full API data and renders sections accordingly.
   * @param {Object} datos - The brand data returned by getMarca().
   */
  setData(datos) {
    if (!datos) return;

    this._favorites = Array.isArray(datos.listaFavoritos) ? datos.listaFavoritos : [];
    this._allProducts = Array.isArray(datos.listaProductos) ? datos.listaProductos : [];
    this._products = this._allProducts;
    this._categories = Array.isArray(datos.segmentos) ? datos.segmentos : [];
    this._isProductsMode = this._categories.length === 0;
    this._slug = datos.slug;


    this.renderGrids();
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
      // In products mode (no segmentos), do nothing on click
      if (this._isProductsMode) return;

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

      const fullGrid = root.getElementById("categories-full-grid");
      if (fullGrid) {
        fullGrid.innerHTML = Array(6).fill().map(() => `
          <article class="product-card" style="pointer-events: none;">
              <div class="product-thumb skeleton"></div>
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text" style="width: 70%;"></div>
          </article>
        `).join("");
      }

      const categoryPath = card.getAttribute("data-path");
      if (categoryPath) {
        import('../utils/Service.js').then(module => {
          return module.getProductsBySegment(this._slug, categoryPath);
        }).then(data => {
          let products = [];
          if (data && Array.isArray(data.listaProductos)) {
            products = data.listaProductos;
          } else if (Array.isArray(data)) {
            products = data;
          }
          this._products = products;
          this.renderCategoryProductsList();
        }).catch(err => {
          console.error("Error loading products by segment:", err);
          this._products = [];
          this.renderCategoryProductsList();
        });
      } else {
        this._products = [];
        this.renderCategoryProductsList();
      }
    });

    back?.addEventListener("click", () => {
      if (categoriesFullView) categoriesFullView.hidden = true;
      if (mainView) mainView.hidden = false;
    });

    categoriesSearchInput?.addEventListener("input", (event) => {
      const term = event.target.value || "";
      this.renderCategoryProductsList(term);
    });

    categoriesSearchInput?.addEventListener("blur", (event) => {
      if (event.target.value.trim() === "") {
        if (categoriesFullTitle && categoriesFullTitle.textContent === "Productos") {
          if (categoriesFullView) categoriesFullView.hidden = true;
          if (mainView) mainView.hidden = false;
        }
      }
    });
  }

  /**
   * Wires the main search input so that typing or focusing it opens
   * the categories full view for querying across all products.
   */
  _bindMainSearch() {
    const root = this.shadowRoot;
    const mainSearchInput = root.querySelector(".storefront .search-input");
    const mainView = root.querySelector(".storefront");
    const favoritesFullView = root.querySelector(".favorites-full-view");
    const categoriesFullView = root.querySelector(".categories-full-view");
    const categoriesSearchInput = root.querySelector(".categories-search-input");
    const categoriesFullTitle = root.querySelector(".categories-full-view .favorites-full-title");

    const handleSearchStart = () => {
      this._products = this._allProducts;
      const term = mainSearchInput.value || "";
      if (categoriesFullTitle) categoriesFullTitle.textContent = "Productos";

      mainView.hidden = true;
      if (favoritesFullView) favoritesFullView.hidden = true;
      categoriesFullView.hidden = false;

      if (categoriesSearchInput) {
        categoriesSearchInput.value = term;
        categoriesSearchInput.focus();
      }

      mainSearchInput.value = "";
      this.renderCategoryProductsList(term);
    };

    mainSearchInput?.addEventListener("focus", handleSearchStart);
    mainSearchInput?.addEventListener("input", handleSearchStart);
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

    grid.innerHTML = this._favorites.map(
      (p) =>
        `
      <a href="?marca=${this._slug}&cb=${p.codigoBarra}">
            <article class="product-card" data-id="${p.id}">
                <img class="product-thumb" src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
                <p class="product-name">${p.nombre}</p>
            </article>
        </a>
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
      ? this._products
      : this._products.filter((p) => p.nombre.toLowerCase().includes(term));

    grid.innerHTML = list
      .map(
        (p) => `
        <a href="?marca=${this._slug}&cb=${p.codigoBarra}">
            <article class="product-card" data-id="${p.id}">
                <img class="product-thumb" src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
                <p class="product-name">${p.nombre}</p>
            </article>
        </a>
        `,
      )
      .join("");
  }

  /**
   * Populates the home favorites strip (first N products) and the home categories/products grid.
   */
  renderGrids() {
    const root = this.shadowRoot;
    const favSection = root.querySelector('[aria-labelledby="favorites-heading"]');
    const fav = root.getElementById("favorites-grid");
    const cat = root.getElementById("categories-grid");
    const catHeading = root.getElementById("categories-heading");

    // --- Favorites ---
    if (!this._favorites || this._favorites.length === 0) {
      if (favSection) favSection.hidden = true;
    } else {
      if (favSection) favSection.hidden = false;
      if (fav) {
        const homeProducts = this._favorites.slice(0, HOME_FAVORITES_COUNT);
        fav.innerHTML = homeProducts
          .map(
            (p) => `
            <a href="?marca=${this._slug}&cb=${p.codigoBarra}">
              <article class="product-card" data-id="${p.id}">
                  <img class="product-thumb" src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
                  <p class="product-name">${p.nombre}</p>
              </article>
              </a>
            `,
          )
          .join("");
      }
    }

    // --- Categories or Products ---
    if (this._isProductsMode) {
      // No segmentos: show listaProductos as "Productos"
      if (catHeading) catHeading.textContent = "Productos";
      if (cat) {
        cat.innerHTML = this._products
          .map(
            (p) => `
            <a href="?marca=${this._slug}&cb=${p.codigoBarra}">
              <article class="category-card" data-id="${p.id}" data-is-product="true">
                  <img class="category-thumb" src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
                  <p class="category-name">${p.nombre}</p>
              </article>
            </a>
            `,
          )
          .join("");
      }
    } else {
      // Has segmentos: show as categories
      if (catHeading) catHeading.textContent = "Categorías";
      if (cat) {
        cat.innerHTML = this._categories
          .map(
            (c) => `
              <article class="category-card" data-path="${c.path || ''}">
                  <img class="category-thumb" src="${c.urlImagen || c.img || ''}" alt="${c.nombre || c.name || ''}" loading="lazy" />
                  <p class="category-name">${c.nombre || c.name || ''}</p>
              </article>
            `,
          )
          .join("");
      }
    }
  }
}

if (!customElements.get("company-home-page")) {
  customElements.define("company-home-page", CompanyHomePage);
}
