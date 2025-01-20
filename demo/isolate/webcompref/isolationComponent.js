(function () {

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
        constructor(host) {
            this.#host = host;
            this.document = new DocumentWrapper(this.#host);
        }

        _be(target, type, callback) {
            target.addEventListener(type, callback);
        }
    }

    class IsolationComponent extends HTMLElement {
        static id = 0;
        static #modules = [];
        #inlineScripts = [];
        #moduleFetches = [];

        constructor() {
            console.log('iso element applied');
            super();

            const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
            const internals = supportsDeclarative ? this.attachInternals() : undefined;

            let shadow = internals?.shadowRoot;

            if (!shadow) {
                this.attachShadow({ mode: 'open' });
            }

            IsolationComponent.id++;
            // Attach a shadow root

            window[`iso${IsolationComponent.id}`] = new ShadowDomHelper(this);

            // this.pre = `var sdh=window["iso${IsolationComponent.id}"];(function(document,_be){`;
            // this.post = `})(sdh.document,sdh._be)`;

            // Move light DOM content into the shadow DOM
            while (this.firstChild) {
                const child = this.firstChild;
                if (child.tagName === 'SCRIPT') {
                    this._handleScript(child);
                } else {
                    this.shadowRoot.appendChild(child);
                }
            }

            // apply the inline scripts
            Promise.all(this.#moduleFetches).then(_ => { this._applyInlineScripts(); });
        }

        connectedCallback() {
            console.log('iso element connected');
        }

        _applyInlineScripts() {
            let content = ``;

            // import modules
            Object.keys(IsolationComponent.#modules).forEach(key => {
                let module = IsolationComponent.#modules[key];
                content += `import ${module.id} from '${module.uri}';`;
            })

            // resolve globals to context
            content += `var sdh=window['iso${IsolationComponent.id}'];(function(document,_be){`
            Object.keys(IsolationComponent.#modules).forEach(key => {
                let module = IsolationComponent.#modules[key];
                content += `var ${module.name} = ${module.id}(document, _be);`;
            })

            content += this.#inlineScripts.join(";;");
            content += `})(sdh.document,sdh._be);`;
            this._executeInlineScript(content);
        }

        _handleScript(script) {
            if (script.src) {
                // If it's an external script
                this.#moduleFetches.push(this._loadExternalScript(script.src));
            } else {
                // If it's an inline script
                this.#inlineScripts.push(script.textContent);
                //this._executeInlineScript(script.textContent);
            }
            // Remove the original script to prevent it from running in the light DOM
            script.remove();
        }

        _loadExternalScript(src) {

            if (IsolationComponent.#modules[src]) {
                return Promise.resolve();
            }
            // need to override content so fetch first
            return fetch(src)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.text();
                })
                .then((content) => {
                    // get the module name
                    var modulenameFinder = /var\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/;
                    var modulematch = content.match(modulenameFinder);
                    var modulename;
                    if (modulematch) {
                        modulename = modulematch[1];
                    }

                    const code = `export default function(document,_be){${content}; return ${modulename}};`

                    const newScript = document.createElement('script');
                    newScript.type = "module";
                    const uri = URL.createObjectURL(
                        new Blob([code], { type: `application/javascript` })
                    );
                    newScript.src = uri
                    this.shadowRoot.appendChild(newScript);

                    IsolationComponent.#modules[src] = { id: "id" + Math.random().toString(16).slice(2), name: modulename, uri: uri };
                });
        }

        _executeInlineScript(code) {
            // Execute the inline script within the shadow DOM context
            const newScript = document.createElement('script');
            newScript.type = "module";

            newScript["text"] = code;
            this.shadowRoot.appendChild(newScript);
        }
    }

    customElements.define('iso-comp', IsolationComponent);
})();