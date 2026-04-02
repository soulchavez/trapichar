const drawerStyles = `
:host {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
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
  height: calc(100vh - 24px - 22px);
}

.drawer.full .overflow {
  display: flex;
  flex-direction: column;
}

.handle {
  width: 50px;
  height: 5px;
  background: #ccc;
  border-radius: 10px;
  margin: 10px auto;
}

.overflow{
 display:none;
}



.content {
  flex: 1;
  overflow-y: auto;
  padding-left: clamp(10px, 5%, 16px);
  padding-right: clamp(10px, 5%, 16px);
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
    this.hasMoved = false;

    this.shadowRoot.innerHTML = `
      
      <div class="drawer">
        <div class="handle"></div>
        <div class="content">
          <slot name="summary"></slot>
          <div class="overflow">
          <slot name="complete"></slot>
          </div>
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

       if (Math.abs(diff) > 10) {
        this.hasMoved = true;
      }

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

      if (!this.hasMoved) {
        this.hasMoved = false;
        return;
      }

      const diff = this.currentY - this.startY;
      // swipe UP → full
      if (diff < -80) {
        this.expand();
      }

      // swipe DOWN → 30%
      else if (diff > 80) {
        this.collapse();
      }

      this.hasMoved = false;
    });
  }

  expand() {
    this.isFull = true;
    this.drawer.classList.add('full');
    this.shadowRoot.getElementsByName("complete")[0].classList.remove('hidden')
  }

  collapse() {
    this.isFull = false;
    this.drawer.classList.add('hidden');
  }
}

customElements.define('bottom-drawer', BottomDrawer);
