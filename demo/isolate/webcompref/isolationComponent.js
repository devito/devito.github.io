(function() {

    class DocumentWrapper {
        #host
        constructor(host) {
            this.#host = host;
            this.body = this.#host.shadowRoot;            
        }

        querySelector(...args) {
            return this.body.querySelector(...args);
        }

        querySelectorAll(...args) {
            return this.body.querySelectorAll(...args);
        }
    }

    class ShadowDomHelper {
        #host;
        constructor(host){
            this.#host = host;
            this.document = new DocumentWrapper(this.#host);            
        }

        _be(target, type, callback) {
            target.addEventListener(type, callback);
        }
    }

    class IsolationComponent extends HTMLElement {
    static id = 0;

    constructor() {
        console.log('iso element applied');
        super();

        let shadow = internals?.shadowRoot;

        if (!shadow) {
            this.attachShadow({ mode: 'open' });
        }

        IsolationComponent.id++;
        // Attach a shadow root
        
        window[`iso${IsolationComponent.id}`] = new ShadowDomHelper(this);

        this.pre = `var sdh=window["iso${IsolationComponent.id}"];(function(document,_be){`;
        this.post = `})(sdh.document,sdh._be)`;
        
        // Move light DOM content into the shadow DOM
        while (this.firstChild) {
            const child = this.firstChild;
            if (child.tagName === 'SCRIPT') {
                this._handleScript(child); // Handle script separately
            } else {
                this.shadowRoot.appendChild(child);
            }
        }
    }

    connectedCallback() {
        console.log('iso element connected');
        
        this.shadowRoot.addEventListener('click', (event) => {
            console.log(`${event.target} clicked:`, event.target.textContent);                
        });
    }

    _handleScript(script) {
        if (script.src) {
            // If it's an external script
            this._loadExternalScript(script.src);
        } else {
            // If it's an inline script
            this._executeInlineScript(script.textContent);
        }
        // Remove the original script to prevent it from running in the light DOM
        script.remove();
    }

    _loadExternalScript(src) {
        // need to override content so fetch first
        fetch(src)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then((content) => {
            let code = this.pre + content + this.post;
            const newScript = document.createElement('script');
            newScript.src = URL.createObjectURL(
                new Blob([code], {type: `module`})
              );
            this.shadowRoot.appendChild(newScript);
        });
    }

    _executeInlineScript(code) {
        // Execute the inline script within the shadow DOM context
        const newScript = document.createElement('script');
        newScript["text"] = this.pre + code + this.post;
        this.shadowRoot.appendChild(newScript);            
    }
}

customElements.define('iso-comp', IsolationComponent);
})();