function socialIconSvg(network) {
    const socialIcons = {
        facebook: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/960px-2023_Facebook_icon.svg.png',
        instagram: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/1280px-Instagram_icon.png',
        linkedin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png',
        twitter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/X_icon.svg/250px-X_icon.svg.png',
        youtube: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/960px-YouTube_full-color_icon_%282017%29.svg.png',
        whatsapp: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/WhatsApp_Logo_green.svg/250px-WhatsApp_Logo_green.svg.png',
    }
    return `<img class='social-link-img' src='${socialIcons[network]}' alt='${network}' />`;
}

const localHeaderStyles = `
:host {
    display: block;
    color: var(--text, #2A2A2A);
    font-family: 'Inter', sans-serif;
}

.header-wrapper {
    align-items: center;
    display: flex;
    flex-wrap: nowrap;
    gap: var(--company-space-4, 12px);
    min-width: 0;
    padding: var(--padding-value);
}

.profile-img {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    background: #efefef;
    margin-top: 2px;
    transition: width 0.22s ease, height 0.22s ease;
}

.header-wrapper.is-contact-expanded .profile-img {
    width: 78px;
    height: 78px;
}

.content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.company-name {
    align-items: center;
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    min-width: 0;
}

.company-name h1 {
    margin: 0;
    font-size: 1.25rem;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: font-size 0.22s ease;
}

.header-wrapper.is-contact-expanded .company-name h1 {
    font-size: 1.0625rem;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.contact-details[hidden] {
    display: none !important;
}

.mail-link {
    font-size: 0.875rem;
    text-decoration: none;
    color: var(--highlight-blue, #0A7AFB);
    word-break: break-all;
}

.mail-link:hover {
    text-decoration: underline;
}

.social-media {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.social-link-img {
    width: 22px;
    height: 22px;
}

.social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text, #2A2A2A);
    text-decoration: none;
}

.social-link:hover {
    color: var(--highlight-blue, #0A7AFB);
}

.social-link svg {
    display: block;
    width: 22px;
    height: 22px;
}

.btn-primary {
    flex-shrink: 0;
    border: none;
    border-radius: 999px;
    background: var(--background-lightgray);
    color: var(--text);
    cursor: pointer;
    font: inherit;
    padding: 6px 12px;
    font-size: 0.7rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.header-wrapper.is-contact-expanded .btn-primary {
    padding: 6px 8px;
}

.contact-btn-label {
    display: inline;
}

.header-wrapper.is-contact-expanded .contact-btn-label {
    display: none;
}

.contact-arrow {
    width: 12px;
    height: 12px;
    display: block;
    flex-shrink: 0;
    transition: transform 0.22s ease;
}

.header-wrapper.is-contact-expanded .contact-arrow {
    transform: rotate(180deg);
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
        this._contactOpen = false;
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <div class="header-wrapper">
                <img class="profile-img" alt="Logo de la empresa">
                <div class="content">
                    <div class="company-name">
                        <h1></h1>
                        <button class="btn-primary" type="button" aria-expanded="false" aria-controls="contact-details-panel" aria-label="Mostrar información de contacto">
                            <span class="contact-btn-label">Contacto</span><img class="contact-arrow" src="./assets/icons/down_arrow.svg" alt="" />
                        </button>
                    </div>
                    <div class="contact-details" id="contact-details-panel" hidden>
                        <a id="mail" class="mail-link" href="mailto:"></a>
                        <div class="social-media"></div>
                    </div>
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

        shadowRoot.querySelector('.btn-primary').addEventListener('click', () => {
            const mail = this.getAttribute('mail') || '';
            const hasSocial = this._hasSocialLinks();
            const hasSomething = Boolean(mail || hasSocial);
            if (this._contactOpen) {
                this._contactOpen = false;
            } else if (hasSomething) {
                this._contactOpen = true;
            }
            this._syncContactPanel();
        });
    }

    connectedCallback() {
        this.updateContent();
    }

    static get observedAttributes() {
        return ['company', 'mail', 'collapsed', 'img', 'social-media', 'social-networks'];
    }

    attributeChangedCallback() {
        this.updateContent();
    }

    _contactPanelVisible() {
        const mail = this.getAttribute('mail') || '';
        return this._contactOpen && Boolean(mail || this._hasSocialLinks());
    }

    _syncContactPanel() {
        const shadowRoot = this.shadowRoot;
        const details = shadowRoot.querySelector('.contact-details');
        const wrapper = shadowRoot.querySelector('.header-wrapper');
        const btn = shadowRoot.querySelector('.btn-primary');
        const mailEl = shadowRoot.querySelector('#mail');

        if (btn) {
            btn.setAttribute('aria-expanded', String(this._contactOpen));
            const expanded = this._contactPanelVisible();
            btn.setAttribute(
                'aria-label',
                expanded
                    ? 'Ocultar información de contacto'
                    : 'Mostrar información de contacto'
            );
        }

        if (wrapper) {
            wrapper.classList.toggle(
                'is-contact-expanded',
                this._contactPanelVisible()
            );
        }

        if (details) {
            const mail = this.getAttribute('mail') || '';
            const hasSocial = this._hasSocialLinks();
            const hasSomething = mail || hasSocial;
            if (!this._contactOpen || !hasSomething) {
                details.hidden = true;
            } else {
                details.hidden = false;
            }
        }

        if (mailEl) {
            mailEl.hidden = !this.getAttribute('mail');
        }

        const socialWrap = shadowRoot.querySelector('.social-media');
        if (socialWrap) {
            const socialRowHasContent = socialWrap.childElementCount > 0;
            socialWrap.hidden = !socialRowHasContent;
        }
    }

    _hasSocialLinks() {
        const jsonAttr = this.getAttribute('social-networks');
        const legacy = this.getAttribute('social-media');
        if (jsonAttr) {
            try {
                const links = JSON.parse(jsonAttr);
                return Array.isArray(links) && links.some((l) => l && (l.url || l.href));
            } catch {
                return false;
            }
        }
        return Boolean(legacy && legacy.trim());
    }

    _renderSocial() {
        const container = this.shadowRoot.querySelector('.social-media');
        if (!container) return;

        container.textContent = '';
        const jsonAttr = this.getAttribute('social-networks');
        const legacyHtml = this.getAttribute('social-media');

        if (jsonAttr) {
            try {
                const links = JSON.parse(jsonAttr);
                if (Array.isArray(links)) {
                    for (const item of links) {
                        const url = item.url || item.href;
                        if (!url || typeof url !== 'string') continue;
                        const network = (item.network || item.name || 'link').toLowerCase();
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.className = 'social-link';
                        a.setAttribute(
                            'aria-label',
                            item.label || item.network || item.name || 'Enlace'
                        );
                        a.innerHTML = socialIconSvg(network);
                        container.appendChild(a);
                    }
                }
            } catch {
                /* JSON inválido */
            }
        } else if (legacyHtml) {
            container.innerHTML = legacyHtml;
        }
    }

    updateContent() {
        const name = this.getAttribute('company') || '';
        const image = this.getAttribute('img') || '';
        const companyName = this.shadowRoot.querySelector('.company-name h1');
        const profileImage = this.shadowRoot.querySelector('.profile-img');
        const mailLink = this.shadowRoot.querySelector('#mail');

        if (companyName) companyName.textContent = name;
        if (profileImage) profileImage.src = image;

        if (mailLink) {
            const mail = this.getAttribute('mail') || '';
            mailLink.textContent = mail;
            mailLink.href = mail ? `mailto:${mail}` : 'mailto:';
        }

        this._renderSocial();
        this._syncContactPanel();
    }
}

if (!customElements.get('company-header')) {
    customElements.define('company-header', HeaderCompany);
}
