class ImageModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: none;
          z-index: 10000;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .overlay.open {
          opacity: 1;
        }

        img {
          max-width: 90%;
          max-height: 90%;
          border-radius: 12px;
          transform: scale(0.9);
          transition: transform 0.3s ease;
        }

        .overlay.open img {
          transform: scale(1);
        }

        .close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          font-size: 18px;
        }
      </style>

      <div class="overlay">
        <button class="close">✕</button>
        <img />
      </div>
    `;
  }

  connectedCallback() {
    this.overlay = this.shadowRoot.querySelector('.overlay');
    this.img = this.shadowRoot.querySelector('img');
    this.closeBtn = this.shadowRoot.querySelector('.close');

    // cerrar con botón
    this.closeBtn.addEventListener('click', () => this.close());

    // cerrar click fuera
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // cerrar con ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  open(src) {
    this.style.display = 'block';
    this.img.src = src;

    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
    });
  }

  close() {
    this.overlay.classList.remove('open');

    setTimeout(() => {
      this.style.display = 'none';
      this.img.src = '';
    }, 300);
  }
}

customElements.define('image-modal', ImageModal);