class CompanyModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./style/company-modal.css" />
            <div class="modal">
                <company-home-page></company-home-page>
            </div>
        `;
    }

    /**
     * Receives the brand data object from the API and forwards
     * the relevant fields as attributes to the inner <company-home-page>.
     * @param {Object} datos - The brand data returned by getMarca().
     */
    setData(datos) {
        if (!datos) return;

        const homePage = this.shadowRoot.querySelector('company-home-page');
        if (!homePage) return;

        if (datos.nombre) {
            homePage.setAttribute('company', datos.nombre);
        }
        if (datos.correo) {
            homePage.setAttribute('mail', datos.correo);
        }
        if (datos.logo) {
            homePage.setAttribute('img', datos.logo);
        }
        if (datos.listaRedesSociales && Array.isArray(datos.listaRedesSociales)) {
            const networks = datos.listaRedesSociales.map(rs => ({
                network: rs.redSocial.toLowerCase(),
                url: rs.url,
            }));
            homePage.setAttribute('social-networks', JSON.stringify(networks));
        }

        // Forward full data so CompanyHomePage can render grids
        homePage.setData(datos);
    }
}

if (!customElements.get('company-modal')) {
    customElements.define('company-modal', CompanyModal);
}
