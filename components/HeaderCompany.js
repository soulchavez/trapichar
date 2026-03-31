const localHeaderStyles = `
:host {
    display: block;
    color: var(--text, #2A2A2A);
    font-family: 'Inter', sans-serif;
}

.header-wrapper {
    align-items: center;
    display: flex;
    gap: var(--company-space-4);
}

.profile-img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    background: #efefef;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.company-name {
    align-items: center;
    display: flex;
    gap: 12px;
}

.company-name h1 {
    margin: 0;
    font-size: 1.5rem;
}

#mail {
    color: var(--highlight-blue, #0A7AFB);
}

.social-media {
    align-items: center;
    display: flex;
    gap: 8px;
}

.btn-primary {
    border: none;
    border-radius: 999px;
    background: var(--background-lightgray);
    color: var(--text);
    cursor: pointer;
    font: inherit;
    padding: 8px 16px;
}
`;

const localHeaderSheet = (() => {
    if (
        typeof CSSStyleSheet === 'undefined' ||
        typeof CSSStyleSheet.prototype.replaceSync !== 'function'
    ) {
        return null;
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(localHeaderStyles);
    return sheet;
})();

const supportsConstructableStyles =
    localHeaderSheet &&
    'adoptedStyleSheets' in ShadowRoot.prototype &&
    'replaceSync' in CSSStyleSheet.prototype;

class HeaderCompany extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <div class="header-wrapper">
                <img class="profile-img" alt="Company logo">
                <div class="content">
                    <div class="company-name">
                        <h1></h1>
                        <button class="btn-primary" type="button">Contacto</button>
                    </div>
                    <a id="mail" href="mailto:"></a>
                    <div class="social-media"></div>
                </div>
            </div>
        `;

        if (supportsConstructableStyles) {
            shadowRoot.adoptedStyleSheets = [localHeaderSheet];
        } else {
            const styleEl = document.createElement('style');
            styleEl.textContent = localHeaderStyles;
            shadowRoot.prepend(styleEl);
        }
    }

    connectedCallback() {
        this.updateContent();
    }

    static get observedAttributes() {
        return ['company', 'mail', 'collapsed', 'img', 'social-media'];
    }

    attributeChangedCallback() {
        this.updateContent();
    }

    updateContent() {
        const name = this.getAttribute('company') || '';
        const mail = this.getAttribute('mail') || '';
        const image = this.getAttribute('img') || '';
        const socialMedia = this.getAttribute('social-media') || '';
        const companyName = this.shadowRoot.querySelector('.company-name h1');
        const mailLink = this.shadowRoot.querySelector('#mail');
        const profileImage = this.shadowRoot.querySelector('.profile-img');
        const socialMediaContainer = this.shadowRoot.querySelector('.social-media');

        companyName.textContent = name;
        mailLink.textContent = mail;
        mailLink.href = mail ? `mailto:${mail}` : 'mailto:';
        profileImage.src = image;
        socialMediaContainer.innerHTML = socialMedia;
    }
}

if (!customElements.get('company-header')) {
    customElements.define('company-header', HeaderCompany);
}