const drawerStyles = `
:host {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
  font-family: 'Inter', sans-serif;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  opacity: 1;
  transition: opacity 0.25s ease;
}

.drawer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 30vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
  transform: translateY(0);
  transition: transform 0.3s ease, height 0.3s ease;
  touch-action: none;
  display: flex;
  flex-direction: column;
}

.drawer.full {
  height: 100vh;
}

.handle {
  width: 50px;
  height: 5px;
  background: #ccc;
  border-radius: 10px;
  margin: 10px auto;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
`;

const sheet = (() => {
  try {
    const s = new CSSStyleSheet();
    s.replaceSync(drawerStyles);
    return s;
  } catch {
    return null;
  }
})();

const supportsSheets =
  sheet && 'adoptedStyleSheets' in ShadowRoot.prototype;

class BottomDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.startY = 0;
    this.currentY = 0;
    this.dragging = false;
    this.isFull = false;

    this.shadowRoot.innerHTML = `
      
      <div class="drawer">
        <div class="handle"></div>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.drawer = this.shadowRoot.querySelector('.drawer');

    // estilos
    if (supportsSheets) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement('style');
      style.textContent = drawerStyles;
      this.shadowRoot.prepend(style);
    }

    // 👇 inicia abierto en 30%
    this.isFull = false;

    this.drawer.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.startY = e.clientY;
      this.drawer.style.transition = 'none';
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;

      this.currentY = e.clientY;
      const diff = this.currentY - this.startY;

      // solo permitir arrastrar hacia abajo si está full
      if (this.isFull && diff > 0) {
        this.drawer.style.transform = `translateY(${diff}px)`;
      }

      // permitir subir si está en 30%
      if (!this.isFull && diff < 0) {
        this.drawer.style.transform = `translateY(${diff}px)`;
      }
    });

    window.addEventListener('pointerup', () => {
      if (!this.dragging) return;

      this.dragging = false;
      this.drawer.style.transition = '';
      this.drawer.style.transform = '';

      const diff = this.currentY - this.startY;

      // swipe UP → full
      if (diff < -80) {
        this.expand();
      }

      // swipe DOWN → 30%
      else if (diff > 80) {
        this.collapse();
      }
    });
  }

  expand() {
    this.isFull = true;
    this.drawer.classList.add('full');
  }

  collapse() {
    this.isFull = false;
    this.drawer.classList.remove('full');
  }
}

customElements.define('bottom-drawer', BottomDrawer);
