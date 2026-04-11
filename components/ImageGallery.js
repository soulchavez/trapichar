class ImageGallery extends HTMLElement {
  constructor() {
    super();
    this.currentIndex = 0;

    const shadow = this.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .gallery {
          position: relative;
          overflow: hidden;
        }

        .track {
          display: flex;
          transition: transform 0.4s ease;
        }

        ::slotted(*) {
          flex: 0 0 100%;
          max-width: 100%;
          aspect-ratio: 16/9;
        }

        /* contenido interno */
        ::slotted(img),
        ::slotted(video) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        ::slotted(iframe) {
          width: 100%;
          height: 100%;
          border: none;
        }

        button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.5);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
        }

        .prev { left: 8px; }
        .next { right: 8px; }
      </style>

      <div class="gallery">
        <button class="prev">&#8249;</button>
        <div class="track">
          <slot></slot>
        </div>
        <button class="next">&#8250;</button>
      </div>
    `;
  }
  connectedCallback() {
    this.track = this.shadowRoot.querySelector(".track");
    this.slotEl = this.shadowRoot.querySelector("slot");

    this.prevBtn = this.shadowRoot.querySelector(".prev");
    this.nextBtn = this.shadowRoot.querySelector(".next");

    this.prevBtn.addEventListener("click", () => this.prev());
    this.nextBtn.addEventListener("click", () => this.next());

    if (this.slotEl) {
      this.items = this.slotEl.assignedElements();

      this.slotEl.addEventListener("slotchange", () => {
        this.items = this.slotEl.assignedElements();
        this.update();
      });
    } else {
      this.items = [];
    }

    this.update();
  }

  update() {
    const offset = this.currentIndex * this.offsetWidth;
    this.track.style.transform = `translateX(-${offset}px)`;
  }

  next() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.update();
    }else{
        if(this.currentIndex === this.items.length-1){
            this.currentIndex = 0;
            this.update();
        }
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.update();
    }
  }
}

customElements.define("image-gallery", ImageGallery);
