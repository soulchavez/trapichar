class HeaderCompany extends HTMLElement{
    constructor(){
        super();
        const shadowRoot = this.attachShadow({mode:'open'});
        shadowRoot.innerHTML=`
            <div>
                <img class="profile-img">
                <div>

                    <div class="company-name">
                        <h1></h1>
                        <button>Contacto</button>
                    </div>
                    <a id="mail" href="mailto:"></a>
                    <div class="social-media"></div>
                
                </div>
            </div>
        `;
    }

    connectedCallback(){
        this.updateContent();
    }

    static get observedAttributes(){
        return['company', 'mail', 'collapsed', 'img','social-media'];
    }

    attributeChangedCallback(name,oldValue,newValue){
        this.updateContent();
    }

    updateContent(){
        const name= this.getAttribute('company') || '';
        const mail=this.getAttribute('mail') || '';
        const collapsed=this.getAttribute('collapsed') || '';
        const image = this.getAttribute('img');
        const comName = this.shadowRoot.querySelector('.company-name');
        comName.getElementsByTagName('h1')[0].innerHTML=name;
        this.shadowRoot.querySelector('#mail').textContent = mail;
        this.shadowRoot.querySelector('.profile-img').src=image;
        

    }

  

    
}
customElements.define('company-header', HeaderCompany);