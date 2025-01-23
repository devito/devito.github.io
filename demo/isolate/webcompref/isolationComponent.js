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

        addEventListener(...args) {
            this.body.addEventListener(...args);
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

            let helperinstance = new ShadowDomHelper(this);
            window[`iso${IsolationComponent.id}`] = helperinstance;

            let scopedInstanceVarName = 'sdh';
            let [iifeparams, iifeargs] = this.#perameterList(helperinstance, scopedInstanceVarName);            

            // Move light DOM content into the shadow DOM
            while (this.firstChild) {
                const child = this.firstChild;
                if (child.tagName === 'SCRIPT') {
                    this._handleScript(child, iifeparams);
                } else {
                    this.shadowRoot.appendChild(child);
                }
            }

            // apply the inline scripts
            Promise.all(this.#moduleFetches).then(_ => { this._applyInlineScripts(scopedInstanceVarName, iifeparams, iifeargs); });
        }

        connectedCallback() {
            console.log('iso element connected');
        }

        #perameterList(instance, scopedVarName) {
            const allOwnKeys = Object.getOwnPropertyNames(instance);
            const prototypeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(key => key !== 'constructor');            

            const allKeys = [...new Set([...allOwnKeys, ...prototypeKeys])];
            
            return [allKeys.join(','), allKeys.map(item => `${scopedVarName}.${item}`).join(',')];
        }

        _applyInlineScripts(scopedInstanceVarName, iifeparams, iifeargs) {
            

            let content = ``;

            // import modules
            Object.keys(IsolationComponent.#modules).forEach(key => {
                let module = IsolationComponent.#modules[key];
                content += `import ${module.id} from '${module.uri}';`;
            })

            // resolve globals to context
            content += `var ${scopedInstanceVarName}=window['iso${IsolationComponent.id}'];(function(${iifeparams}){`
            Object.keys(IsolationComponent.#modules).forEach(key => {
                let module = IsolationComponent.#modules[key];
                content += `var ${module.name} = ${module.id}(${iifeparams});`;
            })

            content += this.#inlineScripts.join(";;");
            content += `})(${iifeargs});`;
            this._executeInlineScript(content);
        }

        _handleScript(script, iifeparams) {
            if (script.src) {
                // If it's an external script
                this.#moduleFetches.push(this._loadExternalScript(script.src, iifeparams));
            } else {
                // If it's an inline script
                this.#inlineScripts.push(script.textContent);
            }
            // Remove the original script to prevent it from running in the light DOM
            script.remove();
        }

        _loadExternalScript(src, iifeparams) {

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

                    const code = `export default function(${iifeparams}){${content}; return ${modulename}};`

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