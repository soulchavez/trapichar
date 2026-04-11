const localExtraStyles = `
:host {
    display: block;
    color: var(--text, #2A2A2A);
    font-family: 'Inter', sans-serif;
}

a{
width:100%;
text-decoration: none;
color: var(--text, #2A2A2A);
}

.title {
    font-weight: 700;
    font-size: 0.75rem;
}

.description{
    font-size: 0.625rem;

}

.extra-img {
    width: 72px;
    height: 72px;
    object-fit: cover;
}

.extra-wrapper{
 display: flex;
 flex-direction: row;
 flex: 1;
 gap: 8px;
}
`;

const localExtraSheet = (() => {
    if (
        typeof CSSStyleSheet === 'undefined' ||
        typeof CSSStyleSheet.prototype.replaceSync !== 'function'
    ) {
        return null;
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(localExtraStyles);
    return sheet;
})();

const supportsConstructableStylesForExtra =
    localExtraSheet &&
    'adoptedStyleSheets' in ShadowRoot.prototype &&
    'replaceSync' in CSSStyleSheet.prototype;

class ExtraElement extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
         <a class="extra-link" target="_blank">
            <div class="extra-wrapper">
                <img class="extra-img" />
                <div class="extra-content">
                    <div class="title"></div>
                    <div class="description"></div>                 
                </div>
            </div>
         </a>
        `;

        if (supportsConstructableStylesForExtra) {
            shadowRoot.adoptedStyleSheets = [localExtraSheet];
        } else {
            const styleEl = document.createElement('style');
            styleEl.textContent = localExtraStyles;
            shadowRoot.prepend(styleEl);
        }
    }

    connectedCallback() {
        this.updateContent();
    }

    static get observedAttributes() {
        return ['title', 'description', 'img', 'link'];
    }

    attributeChangedCallback() {
        this.updateContent();
    }

    updateContent() {
        const title = this.getAttribute('title') || '';
        const description = this.getAttribute('description') || '';
        const image = this.getAttribute('img') || '';
        const link = this.getAttribute('link')
        const titleContent = this.shadowRoot.querySelector('.title');
        const descriptionContent = this.shadowRoot.querySelector('.description');
        const imagePost = this.shadowRoot.querySelector('.extra-img');
        const anchor = this.shadowRoot.querySelector('.extra-link');

        titleContent.innerHTML = title;
        anchor.href = link ? link : '';
        imagePost.src = image;
        descriptionContent.innerHTML = description;
    }
}

if (!customElements.get('extra-element')) {
    customElements.define('extra-element', ExtraElement);
}