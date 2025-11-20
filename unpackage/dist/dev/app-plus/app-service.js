if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LAUNCH = "onLaunch";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createLifeCycleHook = (lifecycle, flag = 0) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onHide = /* @__PURE__ */ createLifeCycleHook(
    ON_HIDE,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onLaunch = /* @__PURE__ */ createLifeCycleHook(
    ON_LAUNCH,
    1
    /* HookFlags.APP */
  );
  const onLoad = /* @__PURE__ */ createLifeCycleHook(
    ON_LOAD,
    2
    /* HookFlags.PAGE */
  );
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * pinia v2.1.7
   * (c) 2023 Eduardo San Martin Morote
   * @license MIT
   */
  let activePinia;
  const setActivePinia = (pinia) => activePinia = pinia;
  const getActivePinia = () => vue.hasInjectionContext() && vue.inject(piniaSymbol) || activePinia;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup) {
    popup = popup || open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url = reader.result;
        if (typeof url !== "string") {
          popup = null;
          throw new Error("Wrong reader.result type");
        }
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url;
        } else {
          location.assign(url);
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url = URL.createObjectURL(blob);
      if (popup)
        popup.location.assign(url);
      else
        location.href = url;
      popup = null;
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error) {
    if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalPasteState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      loadStoresState(pinia, JSON.parse(await navigator.clipboard.readText()));
      toastMessage("Global state pasted from clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalSaveState(pinia) {
    try {
      saveAs(new Blob([JSON.stringify(pinia.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia) {
    try {
      const open2 = getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      loadStoresState(pinia, JSON.parse(text));
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error) {
      toastMessage(`Failed to import the state from JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  function loadStoresState(pinia, state) {
    for (const key in state) {
      const storeState = pinia.state.value[key];
      if (storeState) {
        Object.assign(storeState, state[key]);
      } else {
        pinia.state.value[key] = state[key];
      }
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
          const store2 = storeMap.get(id);
          return {
            editable: false,
            key: id,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id) => "🍍 " + id;
  function registerPiniaDevtools(app, pinia) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api) => {
      if (typeof api.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: 'Reset the state (with "$reset")',
            action: (nodeId) => {
              const store = pinia._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (typeof store.$reset !== "function") {
                toastMessage(`Cannot reset "${nodeId}" store because it doesn't have a "$reset" method implemented.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error) {
                    getters[key] = error;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia];
          stores = stores.concat(Array.from(pinia._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api) => {
      const now2 = typeof api.now === "function" ? api.now.bind(api) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api.notifyComponentUpdate();
          api.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames, wrapWithProxy) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = wrapWithProxy ? new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        }) : store;
        activeAction = _actionId;
        const retValue = actions[actionName].apply(trackedStore, arguments);
        activeAction = void 0;
        return retValue;
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    store._isOptionsAPI = !!options.state;
    patchActionForGrouping(store, Object.keys(options.actions), store._isOptionsAPI);
    const originalHotUpdate = store._hotUpdate;
    vue.toRaw(store)._hotUpdate = function(newStore) {
      originalHotUpdate.apply(this, arguments);
      patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions), !!store._isOptionsAPI);
    };
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia = vue.markRaw({
      install(app) {
        setActivePinia(pinia);
        {
          pinia._a = app;
          app.provide(piniaSymbol, pinia);
          app.config.globalProperties.$pinia = pinia;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia.use(devtoolsPlugin);
    }
    return pinia;
  }
  const isUseStore = (fn) => {
    return typeof fn === "function" && typeof fn.$id === "string";
  };
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  function acceptHMRUpdate(initialUseStore, hot) {
    return (newModule) => {
      const pinia = hot.data.pinia || initialUseStore._pinia;
      if (!pinia) {
        return;
      }
      hot.data.pinia = pinia;
      for (const exportName in newModule) {
        const useStore = newModule[exportName];
        if (isUseStore(useStore) && pinia._s.has(useStore.$id)) {
          const id = useStore.$id;
          if (id !== initialUseStore.$id) {
            console.warn(`The id of the store changed from "${initialUseStore.$id}" to "${id}". Reloading.`);
            return hot.invalidate();
          }
          const existingStore = pinia._s.get(id);
          if (!existingStore) {
            console.log(`[Pinia]: skipping hmr because store doesn't exist yet`);
            return;
          }
          useStore(pinia, existingStore);
        }
      }
    };
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  const fallbackRunWithContext = (fn) => fn();
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function skipHydrate(obj) {
    return Object.defineProperty(obj, skipHydrateSymbol, {});
  }
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia.state.value[id] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia);
          const store2 = pinia._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = [];
    let actionSubscriptions = [];
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(assign(
      {
        _hmrPayload,
        _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
        // devtools custom properties
      },
      partialStore
      // must be added later
      // setupStore
    ));
    pinia._s.set($id, store);
    const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
    const setupStore = runWithContext(() => pinia._e.run(() => (scope = vue.effectScope()).run(setup)));
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id = idOrOptions.id;
      if (typeof id !== "string") {
        throw new Error(`[🍍]: "defineStore()" must be passed a store id as its first argument.`);
      }
    }
    function useStore(pinia, hot) {
      const hasContext = vue.hasInjectionContext();
      pinia = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia || (hasContext ? vue.inject(piniaSymbol, null) : null);
      if (pinia)
        setActivePinia(pinia);
      if (!activePinia) {
        throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.
This will fail in production.`);
      }
      pinia = activePinia;
      if (!pinia._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia);
        } else {
          createOptionsStore(id, options, pinia);
        }
        {
          useStore._pinia = pinia;
        }
      }
      const store = pinia._s.get(id);
      if (hot) {
        const hotId = "__hot:" + id;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia, true) : createOptionsStore(hotId, assign({}, options), pinia, true);
        hot._hotUpdate(newStore);
        delete pinia.state.value[hotId];
        pinia._s.delete(hotId);
      }
      if (IS_CLIENT) {
        const currentInstance = vue.getCurrentInstance();
        if (currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
        !hot) {
          const vm = currentInstance.proxy;
          const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
          cache[id] = store;
        }
      }
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  let mapStoreSuffix = "Store";
  function setMapStoreSuffix(suffix) {
    mapStoreSuffix = suffix;
  }
  function mapStores(...stores) {
    if (Array.isArray(stores[0])) {
      console.warn(`[🍍]: Directly pass all stores to "mapStores()" without putting them in an array:
Replace
	mapStores([useAuthStore, useCartStore])
with
	mapStores(useAuthStore, useCartStore)
This will fail in production if not fixed.`);
      stores = stores[0];
    }
    return stores.reduce((reduced, useStore) => {
      reduced[useStore.$id + mapStoreSuffix] = function() {
        return useStore(this.$pinia);
      };
      return reduced;
    }, {});
  }
  function mapState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function() {
        return useStore(this.$pinia)[key];
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function() {
        const store = useStore(this.$pinia);
        const storeKey = keysOrMapper[key];
        return typeof storeKey === "function" ? storeKey.call(this, store) : store[storeKey];
      };
      return reduced;
    }, {});
  }
  const mapGetters = mapState;
  function mapActions(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function(...args) {
        return useStore(this.$pinia)[key](...args);
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function(...args) {
        return useStore(this.$pinia)[keysOrMapper[key]](...args);
      };
      return reduced;
    }, {});
  }
  function mapWritableState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = {
        get() {
          return useStore(this.$pinia)[key];
        },
        set(value) {
          return useStore(this.$pinia)[key] = value;
        }
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = {
        get() {
          return useStore(this.$pinia)[keysOrMapper[key]];
        },
        set(value) {
          return useStore(this.$pinia)[keysOrMapper[key]] = value;
        }
      };
      return reduced;
    }, {});
  }
  function storeToRefs(store) {
    {
      store = vue.toRaw(store);
      const refs = {};
      for (const key in store) {
        const value = store[key];
        if (vue.isRef(value) || vue.isReactive(value)) {
          refs[key] = // ---
          vue.toRef(store, key);
        }
      }
      return refs;
    }
  }
  const PiniaVuePlugin = function(_Vue) {
    _Vue.mixin({
      beforeCreate() {
        const options = this.$options;
        if (options.pinia) {
          const pinia = options.pinia;
          if (!this._provided) {
            const provideCache = {};
            Object.defineProperty(this, "_provided", {
              get: () => provideCache,
              set: (v) => Object.assign(provideCache, v)
            });
          }
          this._provided[piniaSymbol] = pinia;
          if (!this.$pinia) {
            this.$pinia = pinia;
          }
          pinia._a = this;
          if (IS_CLIENT) {
            setActivePinia(pinia);
          }
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(pinia._a, pinia);
          }
        } else if (!this.$pinia && options.parent && options.parent.$pinia) {
          this.$pinia = options.parent.$pinia;
        }
      },
      destroyed() {
        delete this._pStores;
      }
    });
  };
  const Pinia = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    get MutationType() {
      return MutationType;
    },
    PiniaVuePlugin,
    acceptHMRUpdate,
    createPinia,
    defineStore,
    getActivePinia,
    mapActions,
    mapGetters,
    mapState,
    mapStores,
    mapWritableState,
    setActivePinia,
    setMapStoreSuffix,
    skipHydrate,
    storeToRefs
  }, Symbol.toStringTag, { value: "Module" }));
  const TODO_SOURCE = {
    CALL: "CALL",
    CUSTOMER: "CUSTOMER",
    CONVERSATION: "CONVERSATION",
    CHAT_MESSAGE: "CHAT_MESSAGE"
  };
  const SYSTEM_CONFIG = {
    SOURCE_PARAM: "Desktop-RTC",
    // Nguồn thiết bị
    MODULE_TYPE: "TODO"
    // Loại module
  };
  const DEFAULT_VALUES = {
    STRING: "",
    PLUGIN_TYPE: "",
    GROUP_ID: "",
    TRANS_ID: "",
    ASSIGNEE_ID: "",
    CUSTOMER_CODE: "",
    PHONE_PLACEHOLDER: "072836272322"
    // Số điện thoại giả lập (nếu cần giữ logic cũ)
  };
  const EDITOR_CONFIG = {
    DEFAULT_COLOR: "#000000",
    TRANSPARENT: "transparent",
    HEADER_NORMAL: "Normal"
  };
  const systemLogin = (username, password) => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: "https://api-staging.vbot.vn/v1.0/token",
        method: "POST",
        header: { "Content-Type": "application/x-www-form-urlencoded" },
        data: {
          username,
          password,
          grant_type: "password",
          type_account: 0,
          source: SYSTEM_CONFIG.SOURCE_PARAM
        },
        success: (res) => {
          const data = res.data;
          if (res.statusCode === 200 && data.access_token) {
            resolve(data);
          } else {
            reject(data);
          }
        },
        fail: (err) => reject(err)
      });
    });
  };
  const getTodoToken = (rootToken, projectCode, uid) => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `https://api-staging.vbot.vn/v1.0/api/module-crm/token`,
        method: "GET",
        data: {
          projectCode,
          uid,
          type: SYSTEM_CONFIG.MODULE_TYPE,
          source: SYSTEM_CONFIG.SOURCE_PARAM
        },
        header: {
          "Authorization": `Bearer ${rootToken}`
        },
        success: (res) => {
          const data = res.data;
          if (data && data.data && data.data.token) {
            resolve(data.data.token);
          } else {
            reject(data);
          }
        },
        fail: (err) => reject(err)
      });
    });
  };
  const useAuthStore = defineStore("auth", {
    // 1. STATE: Chứa dữ liệu (Giống data trong Vue)
    state: () => ({
      rootToken: uni.getStorageSync("vbot_root_token") || "",
      todoToken: uni.getStorageSync("todo_access_token") || "",
      uid: uni.getStorageSync("vbot_uid") || "",
      projectCode: uni.getStorageSync("vbot_project_code") || "",
      tokenExpiry: uni.getStorageSync("token_expiry_time") || 0
    }),
    // 2. GETTERS: Tính toán dữ liệu (Giống computed)
    getters: {
      isLoggedIn: (state) => !!state.todoToken,
      // Kiểm tra xem token còn hạn không
      isValidToken: (state) => {
        const now2 = Date.now();
        return state.todoToken && state.tokenExpiry && now2 < state.tokenExpiry;
      }
    },
    // 3. ACTIONS: Xử lý logic (Giống methods)
    actions: {
      // Hàm này dùng để lưu cả vào State lẫn Storage (giữ đồng bộ)
      setAuthData(data) {
        if (data.rootToken) {
          this.rootToken = data.rootToken;
          uni.setStorageSync("vbot_root_token", data.rootToken);
        }
        if (data.uid) {
          this.uid = data.uid;
          uni.setStorageSync("vbot_uid", data.uid);
        }
        if (data.projectCode) {
          this.projectCode = data.projectCode;
          uni.setStorageSync("vbot_project_code", data.projectCode);
        }
        if (data.todoToken) {
          this.todoToken = data.todoToken;
          uni.setStorageSync("todo_access_token", data.todoToken);
          const expiresIn = 3600 * 1e3;
          this.tokenExpiry = Date.now() + expiresIn;
          uni.setStorageSync("token_expiry_time", this.tokenExpiry);
        }
      },
      // Logic đổi Root Token lấy Todo Token
      async exchangeForTodoToken() {
        try {
          formatAppLog("log", "at stores/auth.ts:55", "🔄 Store: Đang đổi Token Todo...");
          const todoToken = await getTodoToken(this.rootToken, this.projectCode, this.uid);
          this.setAuthData({ todoToken });
          formatAppLog("log", "at stores/auth.ts:58", "✅ Store: Đã có Token Todo mới.");
        } catch (error) {
          formatAppLog("error", "at stores/auth.ts:60", "❌ Store: Lỗi đổi token:", error);
          throw error;
        }
      },
      // Logic đăng nhập Dev (dùng cho localhost)
      async loginDevMode() {
        const devUser = "647890427";
        const devPass = "53496785941d8dc2f5aa3e98e753eb3d0780de9fda3d9ac1761c47eaae28ae39";
        const devUid = "77b7675d29d74cafa23771e46881db7c";
        const devProject = "PR202511170947436134";
        try {
          formatAppLog("log", "at stores/auth.ts:78", "🛠 Store: Đang đăng nhập Dev...");
          const loginData = await systemLogin(devUser, devPass);
          this.setAuthData({
            rootToken: loginData.access_token,
            uid: devUid,
            projectCode: devProject
          });
          await this.exchangeForTodoToken();
        } catch (error) {
          formatAppLog("error", "at stores/auth.ts:91", "❌ Store: Đăng nhập Dev thất bại", error);
        }
      },
      // --- HÀM CHÍNH: App.vue sẽ gọi hàm này ---
      async initialize(options) {
        formatAppLog("log", "at stores/auth.ts:97", "🚀 Store: Khởi tạo Auth...");
        if (options && options.query && (options.query.token || options.query.access_token)) {
          formatAppLog("log", "at stores/auth.ts:101", ">> Mode: Production (URL Detect)");
          const rootToken = options.query.token || options.query.access_token;
          const uid = options.query.uid;
          const projectCode = options.query.projectCode;
          this.setAuthData({ rootToken, uid, projectCode });
          await this.exchangeForTodoToken();
          return;
        }
        if (this.isValidToken) {
          formatAppLog("log", "at stores/auth.ts:116", ">> Token cũ còn hạn, không cần làm gì.");
          return;
        }
        formatAppLog("log", "at stores/auth.ts:121", ">> Mode: Dev / Expired Token");
        await this.loginDevMode();
      },
      logout() {
        formatAppLog("log", "at stores/auth.ts:125", "👋 Store: Đăng xuất, xóa Token...");
        this.rootToken = "";
        this.todoToken = "";
        this.tokenExpiry = 0;
        uni.removeStorageSync("todo_access_token");
        uni.removeStorageSync("token_expiry_time");
        uni.removeStorageSync("vbot_root_token");
      }
    }
  });
  const request = async (options) => {
    const authStore = useAuthStore();
    const token = authStore.todoToken || authStore.rootToken;
    const headers = {
      "Content-Type": "application/json",
      ...options.header
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return new Promise((resolve, reject) => {
      uni.request({
        url: options.url,
        method: options.method || "GET",
        data: options.data || {},
        header: headers,
        success: async (res) => {
          const data = res.data;
          if (res.statusCode === 200) {
            resolve(data.data);
            return;
          }
          if (res.statusCode === 401) {
            formatAppLog("warn", "at utils/request.ts:42", `⚠️ API 401: Token hết hạn tại ${options.url}`);
            if (options._isRetry) {
              formatAppLog("error", "at utils/request.ts:45", "❌ Refresh Token cũng thất bại -> Logout.");
              authStore.logout();
              reject(data);
              return;
            }
            try {
              await authStore.exchangeForTodoToken();
              formatAppLog("log", "at utils/request.ts:54", "🔄 Đã Refresh Token -> Đang gọi lại API cũ...");
              const retryResult = await request({
                ...options,
                _isRetry: true
              });
              resolve(retryResult);
            } catch (err) {
              authStore.logout();
              reject(err);
            }
            return;
          }
          formatAppLog("error", "at utils/request.ts:71", `[API Error ${res.statusCode}]`, data);
          reject(data);
        },
        fail: (err) => {
          formatAppLog("error", "at utils/request.ts:76", "[Network Error]", err);
          reject(err);
        }
      });
    });
  };
  const PROJECT_CODE = "PR202511170947436134";
  const UID = "77b7675d29d74cafa23771e46881db7c";
  const TODO_STATUS = {
    NEW: "TO_DO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE"
  };
  const STATUS_LABELS = {
    [TODO_STATUS.NEW]: "Chờ xử lý",
    [TODO_STATUS.IN_PROGRESS]: "Đang xử lý",
    [TODO_STATUS.DONE]: "Hoàn thành"
  };
  const STATUS_COLORS = {
    [TODO_STATUS.DONE]: "bg-green",
    [TODO_STATUS.IN_PROGRESS]: "bg-orange",
    [TODO_STATUS.NEW]: "bg-gray"
  };
  const formatFullDateTime = (timestamp) => {
    if (!timestamp || timestamp === -1 || timestamp === 0)
      return "";
    const date = new Date(timestamp);
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    const s = date.getSeconds().toString().padStart(2, "0");
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
  };
  const dateToTimestamp$1 = (dateStr) => !dateStr ? -1 : new Date(dateStr).getTime();
  const buildTodoParams = (filter, statusValue, sourceValue) => {
    return {
      keySearch: filter.title || "",
      code: filter.jobCode || "",
      status: statusValue || "",
      startDate: dateToTimestamp$1(filter.createdFrom),
      endDate: dateToTimestamp$1(filter.createdTo),
      dueDateFrom: dateToTimestamp$1(filter.dueDateFrom),
      dueDateTo: dateToTimestamp$1(filter.dueDateTo),
      customerCode: "",
      groupId: "",
      transId: "",
      createdBy: "",
      assigneeId: "",
      pluginType: "",
      links: sourceValue || ""
    };
  };
  const mapTodoFromApi = (apiData) => {
    if (!apiData)
      return {};
    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || "Không tên";
    return {
      id: apiData.id,
      code: apiData.code,
      title,
      statusClass: STATUS_COLORS[status] || "bg-orange",
      statusLabel: STATUS_LABELS[status] || status,
      avatarText: title.substring(0, 2).toUpperCase(),
      createdAtFormatted: formatFullDateTime(apiData.createdAt),
      raw: apiData
    };
  };
  const API_URL = "https://api-staging.vbot.vn/v1.0/api/module-todo/todo";
  const getTodos = async (params) => {
    const rawData = await request({
      url: `${API_URL}/getAll`,
      method: "GET",
      // Lưu ý: Phải là POST để gửi data filter
      data: {
        projectCode: PROJECT_CODE,
        pageNo: params.pageNo || 1,
        pageSize: params.pageSize || 15,
        ...params
      }
    });
    if (Array.isArray(rawData)) {
      return rawData.map((item) => mapTodoFromApi(item));
    }
    return [];
  };
  const getTodoCount = async (params) => {
    const result = await request({
      url: `${API_URL}/countAll`,
      method: "GET",
      // Lưu ý: Phải là POST
      data: {
        projectCode: PROJECT_CODE,
        ...params
      }
    });
    return Number(result) || 0;
  };
  const createTodo = (data) => {
    return request({
      url: `${API_URL}/create`,
      method: "POST",
      data
    });
  };
  const deleteTodo = (id) => {
    return request({
      url: `${API_URL}/delete`,
      method: "POST",
      data: { id }
    });
  };
  const getTodoDetail = (id) => {
    return request({
      url: `${API_URL}/getDetail`,
      method: "GET",
      data: {
        id,
        projectCode: PROJECT_CODE
      }
    });
  };
  const useListTodoController = () => {
    const todos = vue.ref([]);
    const isLoading = vue.ref(false);
    const isFilterOpen = vue.ref(false);
    const isConfirmDeleteOpen = vue.ref(false);
    const itemToDelete = vue.ref(null);
    const statusOptions = ["Tất cả", STATUS_LABELS[TODO_STATUS.NEW], STATUS_LABELS[TODO_STATUS.IN_PROGRESS], STATUS_LABELS[TODO_STATUS.DONE]];
    const statusValues = ["", TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
    const statusIndex = vue.ref(0);
    const creatorOptions = ["Tất cả", "Nguyễn Văn A", "Trần Thị B", "Admin"];
    const creatorIndex = vue.ref(0);
    const customerOptions = ["Tất cả", "KH001", "KH002", "VNG"];
    const customerIndex = vue.ref(0);
    const assigneeOptions = ["Tất cả", "User 1", "User 2"];
    const assigneeIndex = vue.ref(0);
    const sourceOptions = ["Tất cả", "Cuộc gọi (CALL)", "Khách hàng (CUSTOMER)", "Hội thoại (CONVERSATION)", "Tin nhắn (CHAT_MESSAGE)"];
    const sourceValues = ["", TODO_SOURCE.CALL, TODO_SOURCE.CUSTOMER, TODO_SOURCE.CONVERSATION, TODO_SOURCE.CHAT_MESSAGE];
    const sourceIndex = vue.ref(0);
    const filter = vue.ref({
      title: "",
      jobCode: "",
      createdFrom: "",
      createdTo: "",
      dueDateFrom: "",
      dueDateTo: ""
    });
    const pageSizeOptions = ["5/trang", "10/trang", "15/trang", "20/trang"];
    const pageSizeValues = [5, 10, 15, 20];
    const pageSizeIndex = vue.ref(2);
    const currentPage = vue.ref(1);
    const totalItems = vue.ref(0);
    const totalPages = vue.computed(() => {
      if (totalItems.value === 0)
        return 1;
      const size = pageSizeValues[pageSizeIndex.value];
      return Math.ceil(totalItems.value / size);
    });
    const getTodoList = async () => {
      isLoading.value = true;
      try {
        const filterParams = buildTodoParams(
          filter.value,
          statusValues[statusIndex.value],
          sourceValues[sourceIndex.value]
        );
        const currentSize = pageSizeValues[pageSizeIndex.value];
        const [listData, countData] = await Promise.all([
          getTodos({
            ...filterParams,
            pageNo: currentPage.value,
            pageSize: currentSize
          }),
          getTodoCount(filterParams)
        ]);
        todos.value = listData || [];
        totalItems.value = countData || 0;
      } catch (error) {
        formatAppLog("error", "at controllers/list_todo.ts:82", error);
        uni.showToast({ title: "Lỗi tải dữ liệu", icon: "none" });
      } finally {
        isLoading.value = false;
      }
    };
    const onPageSizeChange = (e) => {
      pageSizeIndex.value = e.detail.value;
      currentPage.value = 1;
      getTodoList();
    };
    const changePage = (direction) => {
      const newPage = currentPage.value + direction;
      if (newPage >= 1 && newPage <= totalPages.value) {
        currentPage.value = newPage;
        getTodoList();
      }
    };
    const onRequestDelete = (item) => {
      itemToDelete.value = item;
      isConfirmDeleteOpen.value = true;
    };
    const cancelDelete = () => {
      isConfirmDeleteOpen.value = false;
      itemToDelete.value = null;
    };
    const confirmDelete = async () => {
      if (!itemToDelete.value)
        return;
      try {
        await deleteTodo(itemToDelete.value.id);
        uni.showToast({ title: "Đã xóa thành công", icon: "success" });
        isConfirmDeleteOpen.value = false;
        itemToDelete.value = null;
        getTodoList();
      } catch (error) {
        formatAppLog("error", "at controllers/list_todo.ts:117", "Delete Error:", error);
        uni.showToast({ title: "Xóa thất bại", icon: "none" });
      }
    };
    const showActionMenu = (item) => {
      uni.showActionSheet({
        itemList: ["Xóa"],
        itemColor: "#ff3b30",
        success: (res) => {
          if (res.tapIndex === 0)
            onRequestDelete(item);
        }
      });
    };
    const addNewTask = () => {
      uni.navigateTo({ url: "/pages/todo/create_todo" });
    };
    const openFilter = () => {
      isFilterOpen.value = true;
    };
    const closeFilter = () => {
      isFilterOpen.value = false;
    };
    const onStatusChange = (e) => {
      statusIndex.value = e.detail.value;
    };
    const onCreatorChange = (e) => {
      creatorIndex.value = e.detail.value;
    };
    const onCustomerChange = (e) => {
      customerIndex.value = e.detail.value;
    };
    const onAssigneeChange = (e) => {
      assigneeIndex.value = e.detail.value;
    };
    const onSourceChange = (e) => {
      sourceIndex.value = e.detail.value;
    };
    const resetFilter = () => {
      filter.value = {
        title: "",
        jobCode: "",
        createdFrom: "",
        createdTo: "",
        dueDateFrom: "",
        dueDateTo: ""
      };
      statusIndex.value = 0;
      creatorIndex.value = 0;
      customerIndex.value = 0;
      assigneeIndex.value = 0;
      sourceIndex.value = 0;
      currentPage.value = 1;
    };
    const applyFilter = () => {
      currentPage.value = 1;
      closeFilter();
      getTodoList();
    };
    onShow(() => {
      getTodoList();
    });
    const goToDetail = (item) => {
      uni.navigateTo({
        url: `/pages/todo/todo_detail?id=${item.id}`
      });
    };
    return {
      todos,
      isLoading,
      isFilterOpen,
      filter,
      goToDetail,
      isConfirmDeleteOpen,
      itemToDelete,
      pageSizeOptions,
      pageSizeIndex,
      currentPage,
      totalPages,
      totalItems,
      onPageSizeChange,
      changePage,
      statusOptions,
      statusIndex,
      onStatusChange,
      creatorOptions,
      creatorIndex,
      onCreatorChange,
      customerOptions,
      customerIndex,
      onCustomerChange,
      assigneeOptions,
      assigneeIndex,
      onAssigneeChange,
      sourceOptions,
      sourceIndex,
      onSourceChange,
      addNewTask,
      openFilter,
      closeFilter,
      resetFilter,
      applyFilter,
      showActionMenu,
      cancelDelete,
      confirmDelete
    };
  };
  const _sfc_main$7 = /* @__PURE__ */ vue.defineComponent({
    __name: "list_todo",
    setup(__props, { expose: __expose }) {
      __expose();
      const {
        todos,
        isLoading,
        isFilterOpen,
        filter,
        isConfirmDeleteOpen,
        itemToDelete,
        // Pagination Props
        pageSizeOptions,
        pageSizeIndex,
        currentPage,
        totalPages,
        onPageSizeChange,
        changePage,
        // Options Props
        statusOptions,
        statusIndex,
        onStatusChange,
        creatorOptions,
        creatorIndex,
        onCreatorChange,
        customerOptions,
        customerIndex,
        onCustomerChange,
        assigneeOptions,
        assigneeIndex,
        onAssigneeChange,
        sourceOptions,
        sourceIndex,
        onSourceChange,
        // Actions
        addNewTask,
        openFilter,
        closeFilter,
        resetFilter,
        applyFilter,
        showActionMenu,
        cancelDelete,
        confirmDelete,
        goToDetail
      } = useListTodoController();
      const __returned__ = { todos, isLoading, isFilterOpen, filter, isConfirmDeleteOpen, itemToDelete, pageSizeOptions, pageSizeIndex, currentPage, totalPages, onPageSizeChange, changePage, statusOptions, statusIndex, onStatusChange, creatorOptions, creatorIndex, onCreatorChange, customerOptions, customerIndex, onCustomerChange, assigneeOptions, assigneeIndex, onAssigneeChange, sourceOptions, sourceIndex, onSourceChange, addNewTask, openFilter, closeFilter, resetFilter, applyFilter, showActionMenu, cancelDelete, confirmDelete, goToDetail };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    var _a;
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "header-left" }),
        vue.createElementVNode("text", { class: "header-title" }, "Công việc"),
        vue.createElementVNode("view", {
          class: "header-right",
          onClick: _cache[0] || (_cache[0] = (...args) => $setup.openFilter && $setup.openFilter(...args))
        }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios-filled/50/333333/filter--v1.png",
            class: "filter-icon"
          })
        ])
      ]),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createElementVNode("view", { class: "list-container" }, [
          $setup.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "loading-state"
          }, [
            vue.createElementVNode("text", null, "Đang tải dữ liệu...")
          ])) : $setup.todos.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "empty-state"
          }, [
            vue.createElementVNode("image", {
              src: "https://img.icons8.com/ios/100/cccccc/empty-box.png",
              mode: "aspectFit",
              class: "empty-icon"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "Chưa có dữ liệu")
          ])) : (vue.openBlock(), vue.createElementBlock("scroll-view", {
            key: 2,
            "scroll-y": "true",
            class: "list-view"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.todos, (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: item.id || index,
                  class: "card-item",
                  onClick: ($event) => $setup.goToDetail(item)
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["status-bar", item.statusClass])
                    },
                    null,
                    2
                    /* CLASS */
                  ),
                  vue.createElementVNode("view", { class: "card-body" }, [
                    vue.createElementVNode("view", { class: "card-row top-row" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "card-title" },
                        vue.toDisplayString(item.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("view", {
                        class: "action-btn",
                        onClick: vue.withModifiers(($event) => $setup.showActionMenu(item), ["stop"])
                      }, [
                        vue.createElementVNode("text", { class: "dots" }, "•••")
                      ], 8, ["onClick"])
                    ]),
                    vue.createElementVNode("view", { class: "card-row mid-row" }, [
                      vue.createElementVNode("image", {
                        src: "https://img.icons8.com/ios/50/666666/time.png",
                        class: "icon-small"
                      }),
                      vue.createElementVNode(
                        "text",
                        { class: "card-date" },
                        "Ngày tạo: " + vue.toDisplayString(item.createdAtFormatted),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "card-row bot-row" }, [
                      vue.createElementVNode(
                        "view",
                        { class: "code-tag" },
                        "#" + vue.toDisplayString(item.code),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["status-badge", item.statusClass])
                        },
                        vue.toDisplayString(item.statusLabel),
                        3
                        /* TEXT, CLASS */
                      )
                    ])
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createElementVNode("view", { style: { "height": "20px" } })
          ]))
        ]),
        vue.createElementVNode("view", { class: "fixed-footer" }, [
          vue.createElementVNode("picker", {
            mode: "selector",
            range: $setup.pageSizeOptions,
            value: $setup.pageSizeIndex,
            onChange: _cache[1] || (_cache[1] = (...args) => $setup.onPageSizeChange && $setup.onPageSizeChange(...args))
          }, [
            vue.createElementVNode("view", { class: "page-size-selector" }, [
              vue.createElementVNode(
                "text",
                { class: "size-text" },
                vue.toDisplayString($setup.pageSizeOptions[$setup.pageSizeIndex]),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "dropdown-arrow" }, "▼")
            ])
          ], 40, ["range", "value"]),
          vue.createElementVNode("view", { class: "pagination-controls" }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["page-arrow", { "disabled": $setup.currentPage <= 1 }]),
                onClick: _cache[2] || (_cache[2] = ($event) => $setup.changePage(-1))
              },
              "‹",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              { class: "page-box active" },
              vue.toDisplayString($setup.currentPage),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["page-arrow", { "disabled": $setup.currentPage >= $setup.totalPages }]),
                onClick: _cache[3] || (_cache[3] = ($event) => $setup.changePage(1))
              },
              "›",
              2
              /* CLASS */
            )
          ]),
          vue.createElementVNode("view", {
            class: "add-task-simple",
            onClick: _cache[4] || (_cache[4] = (...args) => $setup.addNewTask && $setup.addNewTask(...args))
          }, [
            vue.createElementVNode("text", { class: "plus-icon" }, "+"),
            vue.createElementVNode("text", { class: "add-text" }, "Thêm công việc")
          ])
        ])
      ]),
      $setup.isFilterOpen ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "filter-overlay",
        onClick: _cache[20] || (_cache[20] = vue.withModifiers((...args) => $setup.closeFilter && $setup.closeFilter(...args), ["stop"]))
      }, [
        vue.createElementVNode("view", {
          class: "filter-panel",
          onClick: _cache[19] || (_cache[19] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "filter-header" }, [
            vue.createElementVNode("text", { class: "filter-title" }, "Bộ lọc tìm kiếm"),
            vue.createElementVNode("text", {
              class: "close-btn",
              onClick: _cache[5] || (_cache[5] = (...args) => $setup.closeFilter && $setup.closeFilter(...args))
            }, "✕")
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "true",
            class: "filter-body"
          }, [
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Tiêu đề / Từ khóa"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "f-input",
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $setup.filter.title = $event),
                  placeholder: "Nhập từ khóa..."
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.filter.title]
              ])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Mã công việc"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "f-input",
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $setup.filter.jobCode = $event),
                  placeholder: "Ví dụ: TODO-08"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.filter.jobCode]
              ])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Trạng thái"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.statusOptions,
                value: $setup.statusIndex,
                onChange: _cache[8] || (_cache[8] = (...args) => $setup.onStatusChange && $setup.onStatusChange(...args))
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.statusOptions[$setup.statusIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["range", "value"])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Người tạo"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.creatorOptions,
                value: $setup.creatorIndex,
                onChange: _cache[9] || (_cache[9] = (...args) => $setup.onCreatorChange && $setup.onCreatorChange(...args))
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.creatorOptions[$setup.creatorIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["range", "value"])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Mã khách hàng"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.customerOptions,
                value: $setup.customerIndex,
                onChange: _cache[10] || (_cache[10] = (...args) => $setup.onCustomerChange && $setup.onCustomerChange(...args))
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.customerOptions[$setup.customerIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["range", "value"])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Người giao"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.assigneeOptions,
                value: $setup.assigneeIndex,
                onChange: _cache[11] || (_cache[11] = (...args) => $setup.onAssigneeChange && $setup.onAssigneeChange(...args))
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.assigneeOptions[$setup.assigneeIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["range", "value"])
            ]),
            vue.createElementVNode("view", { class: "f-group" }, [
              vue.createElementVNode("text", { class: "f-label" }, "Nguồn"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.sourceOptions,
                value: $setup.sourceIndex,
                onChange: _cache[12] || (_cache[12] = (...args) => $setup.onSourceChange && $setup.onSourceChange(...args))
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.sourceOptions[$setup.sourceIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["range", "value"])
            ]),
            vue.createElementVNode("view", { class: "f-section-title" }, "Thời gian tạo"),
            vue.createElementVNode("view", { class: "f-row" }, [
              vue.createElementVNode("view", { class: "f-group half" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: $setup.filter.createdFrom,
                  onChange: _cache[13] || (_cache[13] = (e) => $setup.filter.createdFrom = e.detail.value)
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "f-picker date" },
                    vue.toDisplayString($setup.filter.createdFrom || "Từ ngày"),
                    1
                    /* TEXT */
                  )
                ], 40, ["value"])
              ]),
              vue.createElementVNode("view", { class: "f-group half" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: $setup.filter.createdTo,
                  onChange: _cache[14] || (_cache[14] = (e) => $setup.filter.createdTo = e.detail.value)
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "f-picker date" },
                    vue.toDisplayString($setup.filter.createdTo || "Đến ngày"),
                    1
                    /* TEXT */
                  )
                ], 40, ["value"])
              ])
            ]),
            vue.createElementVNode("view", { class: "f-section-title" }, "Thời gian hết hạn"),
            vue.createElementVNode("view", { class: "f-row" }, [
              vue.createElementVNode("view", { class: "f-group half" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: $setup.filter.dueDateFrom,
                  onChange: _cache[15] || (_cache[15] = (e) => $setup.filter.dueDateFrom = e.detail.value)
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "f-picker date" },
                    vue.toDisplayString($setup.filter.dueDateFrom || "Từ ngày"),
                    1
                    /* TEXT */
                  )
                ], 40, ["value"])
              ]),
              vue.createElementVNode("view", { class: "f-group half" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: $setup.filter.dueDateTo,
                  onChange: _cache[16] || (_cache[16] = (e) => $setup.filter.dueDateTo = e.detail.value)
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "f-picker date" },
                    vue.toDisplayString($setup.filter.dueDateTo || "Đến ngày"),
                    1
                    /* TEXT */
                  )
                ], 40, ["value"])
              ])
            ]),
            vue.createElementVNode("view", { style: { "height": "20px" } })
          ]),
          vue.createElementVNode("view", { class: "filter-footer" }, [
            vue.createElementVNode("button", {
              class: "btn-reset",
              onClick: _cache[17] || (_cache[17] = (...args) => $setup.resetFilter && $setup.resetFilter(...args))
            }, "Đặt lại"),
            vue.createElementVNode("button", {
              class: "btn-apply",
              onClick: _cache[18] || (_cache[18] = (...args) => $setup.applyFilter && $setup.applyFilter(...args))
            }, "Áp dụng")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.isConfirmDeleteOpen ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "modal-overlay",
        onClick: _cache[23] || (_cache[23] = vue.withModifiers(() => {
        }, ["stop"]))
      }, [
        vue.createElementVNode("view", { class: "modal-container" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "Thông báo")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode(
              "text",
              null,
              'Bạn có chắc muốn xóa công việc "' + vue.toDisplayString((_a = $setup.itemToDelete) == null ? void 0 : _a.title) + '"?',
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[21] || (_cache[21] = (...args) => $setup.cancelDelete && $setup.cancelDelete(...args))
            }, "Hủy"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[22] || (_cache[22] = (...args) => $setup.confirmDelete && $setup.confirmDelete(...args))
            }, "Xác nhận")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTodoListTodo = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-1b4e60ea"], ["__file", "D:/uni_app/vbot_todo_3/pages/todo/list_todo.vue"]]);
  const getAllMembers = () => {
    const authStore = useAuthStore();
    const { rootToken, projectCode } = authStore;
    return new Promise((resolve, reject) => {
      uni.request({
        url: "https://api-staging.vbot.vn/v1.0/api/project/getAllMember",
        method: "GET",
        data: {
          projectCode,
          status: "all"
        },
        header: {
          // QUAN TRỌNG: Dùng Root Token như yêu cầu
          "Authorization": `Bearer ${rootToken}`,
          "Content-Type": "application/json"
        },
        success: (res) => {
          const body = res.data;
          if (body.status === 1 && body.data) {
            resolve(body.data);
          } else {
            reject(body.message || "Lỗi lấy danh sách thành viên");
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  };
  const dateToTimestamp = (dateStr) => {
    if (!dateStr)
      return -1;
    const safeDateStr = dateStr.replace(/\//g, "-");
    const dateObj = new Date(safeDateStr);
    return isNaN(dateObj.getTime()) ? -1 : dateObj.getTime();
  };
  const buildCreateTodoPayload = (form, config) => {
    const fullNotifyDateTime = `${form.notifyDate} ${form.notifyTime || "00:00"}`;
    const fullDueDate = form.dueDate;
    return {
      title: form.name,
      description: form.desc || DEFAULT_VALUES.STRING,
      projectCode: config.projectCode,
      createdBy: config.uid,
      status: TODO_STATUS.NEW,
      // Ép kiểu nếu constants JS chưa chuẩn
      links: TODO_SOURCE.CALL,
      pluginType: DEFAULT_VALUES.PLUGIN_TYPE,
      customerCode: form.customerUid || DEFAULT_VALUES.CUSTOMER_CODE,
      assigneeId: form.assignee || DEFAULT_VALUES.ASSIGNEE_ID,
      groupId: DEFAULT_VALUES.GROUP_ID,
      transId: DEFAULT_VALUES.TRANS_ID,
      tagCodes: "test1",
      groupMemberUid: "test1",
      files: DEFAULT_VALUES.STRING,
      phone: DEFAULT_VALUES.PHONE_PLACEHOLDER,
      dueDate: dateToTimestamp(fullDueDate),
      notificationReceivedAt: dateToTimestamp(fullNotifyDateTime)
    };
  };
  const CRM_BASE_URL = "https://api-staging.vbot.vn/v1.0/api/module-crm";
  const getCrmToken = (projectCode, uid) => {
    const authStore = useAuthStore();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${CRM_BASE_URL}/token`,
        method: "GET",
        data: {
          projectCode,
          uid,
          type: "CRM",
          // Theo yêu cầu
          source: SYSTEM_CONFIG.SOURCE_PARAM
          // 'Desktop-RTC'
        },
        header: {
          "Authorization": `Bearer ${authStore.rootToken}`
          // Dùng token gốc
        },
        success: (res) => {
          var _a, _b, _c, _d;
          if (((_a = res.data) == null ? void 0 : _a.status) === 1 && ((_c = (_b = res.data) == null ? void 0 : _b.data) == null ? void 0 : _c.token)) {
            resolve(res.data.data.token);
          } else {
            reject(((_d = res.data) == null ? void 0 : _d.message) || "Lỗi lấy Token CRM");
          }
        },
        fail: (err) => reject(err)
      });
    });
  };
  const getCrmFieldSearch = (crmToken) => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${CRM_BASE_URL}/Customer/getAllFieldSearch`,
        method: "POST",
        data: {},
        // Body rỗng
        header: {
          "Authorization": `Bearer ${crmToken}`
          // Dùng token CRM
        },
        success: (res) => {
          var _a, _b;
          if (((_a = res.data) == null ? void 0 : _a.status) === 1) {
            resolve(res.data.data);
          } else {
            reject(((_b = res.data) == null ? void 0 : _b.message) || "Lỗi lấy Field Search");
          }
        },
        fail: (err) => reject(err)
      });
    });
  };
  const getCrmCustomers = (crmToken, body) => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${CRM_BASE_URL}/Customer/getAll`,
        method: "POST",
        data: body,
        header: {
          "Authorization": `Bearer ${crmToken}`
        },
        success: (res) => {
          var _a, _b;
          if (((_a = res.data) == null ? void 0 : _a.status) === 1) {
            resolve(res.data.data);
          } else {
            reject(((_b = res.data) == null ? void 0 : _b.message) || "Lỗi lấy danh sách KH");
          }
        },
        fail: (err) => reject(err)
      });
    });
  };
  const useCreateTodoController = () => {
    const pad = (n) => n.toString().padStart(2, "0");
    const getTodayISO = () => {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const getCurrentTime = () => {
      const d = /* @__PURE__ */ new Date();
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const loading = vue.ref(false);
    const form = vue.ref({
      name: "",
      desc: "",
      customer: "",
      customerUid: "",
      assignee: "",
      // Trường này sẽ chứa memberUID
      dueDate: getTodayISO(),
      notifyDate: getTodayISO(),
      notifyTime: getCurrentTime()
    });
    const memberList = vue.ref([]);
    const memberOptions = vue.ref([]);
    const selectedMemberIndex = vue.ref(-1);
    const showCustomerModal = vue.ref(false);
    const loadingCustomer = vue.ref(false);
    const customerList = vue.ref([]);
    const customerToken = vue.ref("");
    const fetchMembers = async () => {
      try {
        const data = await getAllMembers();
        memberList.value = data;
        memberOptions.value = data.map((m) => m.UserName || "Thành viên ẩn danh");
      } catch (error) {
        formatAppLog("error", "at controllers/create_todo.ts:56", "Lỗi lấy thành viên:", error);
        uni.showToast({ title: "Không thể tải danh sách thành viên", icon: "none" });
      }
    };
    const fetchCustomers = async () => {
      if (customerList.value.length > 0)
        return;
      loadingCustomer.value = true;
      try {
        const token = await getCrmToken(PROJECT_CODE, UID);
        customerToken.value = token;
        const fields = await getCrmFieldSearch(token);
        const nameField = fields.find((f) => f.code === "name");
        const phoneField = fields.find((f) => f.code === "phone");
        const memberNoField = fields.find((f) => f.code === "member_no");
        const nameId = nameField ? nameField.id : 134;
        const phoneId = phoneField ? phoneField.id : 135;
        const memberNoId = memberNoField ? memberNoField.id : 136;
        const requestBody = {
          page: 1,
          size: 20,
          // Lấy 20 khách hàng demo
          fieldSearch: [
            { id: -1, value: "", type: "", isSearch: false },
            // create_at
            { id: nameId, value: "", type: "", isSearch: false },
            { id: phoneId, value: "", type: "", isSearch: false },
            { id: memberNoId, value: "", type: "", isSearch: false }
          ]
        };
        const rawData = await getCrmCustomers(token, requestBody);
        customerList.value = rawData.map((item) => {
          const nameObj = item.customerFieldItems.find((f) => f.code === "name");
          const phoneObj = item.customerFieldItems.find((f) => f.code === "phone");
          return {
            id: item.id,
            uid: item.uid,
            // [QUAN TRỌNG] Lấy trường uid từ API trả về
            createAt: item.createAt,
            name: nameObj ? nameObj.value : "(Không tên)",
            phone: phoneObj ? phoneObj.value : ""
          };
        });
      } catch (error) {
        formatAppLog("error", "at controllers/create_todo.ts:113", "Lỗi tải khách hàng:", error);
        uni.showToast({ title: "Lỗi tải dữ liệu CRM", icon: "none" });
      } finally {
        loadingCustomer.value = false;
      }
    };
    const openCustomerPopup = () => {
      showCustomerModal.value = true;
      fetchCustomers();
    };
    const onCustomerSelect = (customer) => {
      form.value.customer = `${customer.name} - ${customer.phone}`;
      form.value.customerUid = customer.uid;
    };
    const onMemberChange = (e) => {
      const index = e.detail.value;
      selectedMemberIndex.value = index;
      const selectedMember = memberList.value[index];
      if (selectedMember) {
        form.value.assignee = selectedMember.memberUID;
      }
    };
    const currentAssigneeName = vue.computed(() => {
      if (selectedMemberIndex.value > -1 && memberOptions.value.length > 0) {
        return memberOptions.value[selectedMemberIndex.value];
      }
      return "";
    });
    const goBack = () => uni.navigateBack();
    const submitForm = async () => {
      if (!form.value.name || !form.value.name.trim()) {
        uni.showToast({ title: "Vui lòng nhập tên công việc", icon: "none" });
        return;
      }
      loading.value = true;
      try {
        const payload = buildCreateTodoPayload(form.value, {
          projectCode: PROJECT_CODE,
          uid: UID
        });
        await createTodo(payload);
        uni.showToast({ title: "Tạo thành công!", icon: "success" });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } catch (error) {
        formatAppLog("error", "at controllers/create_todo.ts:175", "❌ Create Error:", error);
        const errorMsg = (error == null ? void 0 : error.message) || "Thất bại";
        uni.showToast({ title: "Lỗi: " + errorMsg, icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    vue.onMounted(() => {
      fetchMembers();
    });
    return {
      loading,
      form,
      // Member
      memberOptions,
      onMemberChange,
      currentAssigneeName,
      // Customer (Return biến mới)
      showCustomerModal,
      loadingCustomer,
      customerList,
      openCustomerPopup,
      onCustomerSelect,
      // Action
      goBack,
      submitForm
    };
  };
  const _sfc_main$6 = /* @__PURE__ */ vue.defineComponent({
    __name: "TodoEditor",
    props: {
      modelValue: { type: String, required: true }
    },
    emits: ["update:modelValue"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const editorCtx = vue.ref(null);
      const formats = vue.ref({});
      const instance = vue.getCurrentInstance();
      const isTyping = vue.ref(false);
      const showLinkPopup = vue.ref(false);
      const linkUrl = vue.ref("");
      const linkText = vue.ref("");
      const canInsertLink = vue.ref(false);
      const isLinkSelected = vue.ref(false);
      const focusLinkInput = vue.ref(false);
      const showColorPopup = vue.ref(false);
      const colorType = vue.ref("color");
      const currentColor = vue.ref(EDITOR_CONFIG.DEFAULT_COLOR);
      const currentBgColor = vue.ref(EDITOR_CONFIG.TRANSPARENT);
      const currentHeader = vue.ref(EDITOR_CONFIG.HEADER_NORMAL);
      const colorList = ["#000000", "#424242", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF", "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF", "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0", "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79"];
      const headerOptions = [{ label: "Normal", value: null }, { label: "H1", value: 1 }, { label: "H2", value: 2 }, { label: "H3", value: 3 }];
      const alignIcon = vue.computed(() => formats.value.align === "center" ? "https://img.icons8.com/ios/50/666666/align-center.png" : formats.value.align === "right" ? "https://img.icons8.com/ios/50/666666/align-right.png" : "https://img.icons8.com/ios/50/666666/align-left.png");
      const isPopupOpen = vue.computed(() => showLinkPopup.value || showColorPopup.value);
      const onEditorReady = () => {
        uni.createSelectorQuery().in(instance.proxy).select("#editor").context((res) => {
          editorCtx.value = res.context;
          if (props.modelValue) {
            editorCtx.value.setContents({ html: props.modelValue });
          }
        }).exec();
      };
      vue.watch(() => props.modelValue, (newVal) => {
        if (editorCtx.value && newVal) {
          editorCtx.value.setContents({ html: newVal });
        }
      });
      const onEditorInput = (e) => {
        emit("update:modelValue", e.detail.html);
      };
      const onStatusChange = (e) => {
        formats.value = e.detail;
        if (e.detail.color)
          currentColor.value = e.detail.color;
        if (e.detail.backgroundColor)
          currentBgColor.value = e.detail.backgroundColor;
        if (e.detail.hasOwnProperty("link")) {
          isLinkSelected.value = true;
          linkUrl.value = e.detail.link || "";
        } else {
          isLinkSelected.value = false;
          linkUrl.value = "";
        }
        if (editorCtx.value) {
          editorCtx.value.getSelectionText({
            success: (res) => {
              if (res.text && res.text.length > 0) {
                canInsertLink.value = true;
                if (!isLinkSelected.value)
                  linkText.value = res.text;
              } else {
                canInsertLink.value = false;
                if (!isLinkSelected.value)
                  linkText.value = "";
              }
            },
            fail: () => {
              canInsertLink.value = false;
            }
          });
        }
      };
      const format = (name, value) => {
        if (editorCtx.value)
          editorCtx.value.format(name, value);
      };
      const handleLinkBtn = () => {
        if (isLinkSelected.value || canInsertLink.value) {
          if (canInsertLink.value && !isLinkSelected.value)
            linkUrl.value = "";
          showLinkPopup.value = true;
          vue.nextTick(() => {
            focusLinkInput.value = true;
          });
        } else {
          uni.showToast({ title: "Bôi đen chữ để chèn Link", icon: "none" });
        }
      };
      const closeLinkPopup = () => {
        showLinkPopup.value = false;
        focusLinkInput.value = false;
      };
      const confirmLink = () => {
        const url = linkUrl.value;
        const text = linkText.value;
        closeLinkPopup();
        setTimeout(() => {
          if (url && text) {
            editorCtx.value.insertText({ text });
            editorCtx.value.format("link", url);
          }
        }, 300);
      };
      const removeLink = () => {
        closeLinkPopup();
        setTimeout(() => {
          editorCtx.value.format("link", null);
        }, 300);
      };
      const onHeaderChange = (e) => {
        const sel = headerOptions[e.detail.value];
        currentHeader.value = sel.label;
        format("header", sel.value);
      };
      const toggleAlign = () => {
        let a = "center";
        if (formats.value.align === "center")
          a = "right";
        else if (formats.value.align === "right")
          a = "left";
        format("align", a);
      };
      const openColorPicker = (type) => {
        colorType.value = type;
        showColorPopup.value = true;
      };
      const closeColorPopup = () => {
        showColorPopup.value = false;
      };
      const selectColor = (color) => {
        if (colorType.value === "color") {
          currentColor.value = color || EDITOR_CONFIG.DEFAULT_COLOR;
          format("color", color);
        } else {
          currentBgColor.value = color || EDITOR_CONFIG.TRANSPARENT;
          format("backgroundColor", color);
        }
        closeColorPopup();
      };
      const insertImage = () => {
        uni.chooseImage({ count: 1, success: (r) => editorCtx.value.insertImage({ src: r.tempFilePaths[0], width: "80%" }) });
      };
      const insertVideo = () => {
        uni.chooseVideo({ count: 1, success: (r) => editorCtx.value.insertVideo({ src: r.tempFilePath, width: "80%" }) });
      };
      const __returned__ = { props, emit, editorCtx, formats, instance, isTyping, showLinkPopup, linkUrl, linkText, canInsertLink, isLinkSelected, focusLinkInput, showColorPopup, colorType, currentColor, currentBgColor, currentHeader, colorList, headerOptions, alignIcon, isPopupOpen, onEditorReady, onEditorInput, onStatusChange, format, handleLinkBtn, closeLinkPopup, confirmLink, removeLink, onHeaderChange, toggleAlign, openColorPicker, closeColorPopup, selectColor, insertImage, insertVideo };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "editor-wrapper" }, [
      vue.createElementVNode("view", { class: "editor-label-row" }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/document--v1.png",
            class: "item-icon"
          }),
          vue.createElementVNode("text", { class: "label-text" }, "Mô tả")
        ])
      ]),
      vue.createElementVNode("view", { class: "toolbar" }, [
        vue.createElementVNode("view", { class: "tool-row" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tool-item", { "active": $setup.formats.bold }]),
              onTouchend: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.format("bold"), ["prevent"]))
            },
            [
              vue.createElementVNode("text", { class: "txt-icon bold" }, "B")
            ],
            34
            /* CLASS, NEED_HYDRATION */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tool-item", { "active": $setup.formats.italic }]),
              onTouchend: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.format("italic"), ["prevent"]))
            },
            [
              vue.createElementVNode("text", { class: "txt-icon italic" }, "I")
            ],
            34
            /* CLASS, NEED_HYDRATION */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tool-item", { "active": $setup.formats.underline }]),
              onTouchend: _cache[2] || (_cache[2] = vue.withModifiers(($event) => $setup.format("underline"), ["prevent"]))
            },
            [
              vue.createElementVNode("text", { class: "txt-icon underline" }, "U")
            ],
            34
            /* CLASS, NEED_HYDRATION */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tool-item", { "active": $setup.formats.strike }]),
              onTouchend: _cache[3] || (_cache[3] = vue.withModifiers(($event) => $setup.format("strike"), ["prevent"]))
            },
            [
              vue.createElementVNode("text", { class: "txt-icon strike" }, "S")
            ],
            34
            /* CLASS, NEED_HYDRATION */
          ),
          vue.createElementVNode("view", { class: "tool-divider" }),
          vue.createElementVNode(
            "view",
            {
              class: "tool-item",
              onTouchend: _cache[4] || (_cache[4] = vue.withModifiers(($event) => $setup.format("list", "ordered"), ["prevent"]))
            },
            [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/numbered-list.png",
                class: "img-tool"
              })
            ],
            32
            /* NEED_HYDRATION */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "tool-item",
              onTouchend: _cache[5] || (_cache[5] = vue.withModifiers(($event) => $setup.format("list", "bullet"), ["prevent"]))
            },
            [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/list.png",
                class: "img-tool"
              })
            ],
            32
            /* NEED_HYDRATION */
          ),
          vue.createElementVNode(
            "picker",
            {
              range: $setup.headerOptions,
              "range-key": "label",
              onChange: $setup.onHeaderChange,
              class: "tool-picker"
            },
            [
              vue.createElementVNode(
                "view",
                { class: "picker-label" },
                vue.toDisplayString($setup.currentHeader) + " ▾",
                1
                /* TEXT */
              )
            ],
            32
            /* NEED_HYDRATION */
          )
        ]),
        vue.createElementVNode("view", { class: "tool-row" }, [
          vue.createElementVNode("view", {
            class: "tool-item",
            onClick: _cache[6] || (_cache[6] = ($event) => $setup.openColorPicker("color"))
          }, [
            vue.createElementVNode(
              "text",
              {
                class: "txt-icon color-text",
                style: vue.normalizeStyle({ color: $setup.currentColor })
              },
              "A",
              4
              /* STYLE */
            ),
            vue.createElementVNode(
              "view",
              {
                class: "color-bar",
                style: vue.normalizeStyle({ backgroundColor: $setup.currentColor })
              },
              null,
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode("view", {
            class: "tool-item",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.openColorPicker("backgroundColor"))
          }, [
            vue.createElementVNode(
              "text",
              {
                class: "txt-icon bg-text",
                style: vue.normalizeStyle({ backgroundColor: $setup.currentBgColor })
              },
              "A",
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode("view", { class: "tool-divider" }),
          vue.createElementVNode(
            "view",
            {
              class: "tool-item",
              onTouchend: vue.withModifiers($setup.toggleAlign, ["prevent"])
            },
            [
              vue.createElementVNode("image", {
                src: $setup.alignIcon,
                class: "img-tool"
              }, null, 8, ["src"])
            ],
            32
            /* NEED_HYDRATION */
          ),
          vue.createElementVNode("view", { class: "tool-divider" }),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tool-item", { "active": $setup.isLinkSelected, "disabled": !$setup.canInsertLink && !$setup.isLinkSelected }]),
              onClick: $setup.handleLinkBtn
            },
            [
              vue.createElementVNode(
                "image",
                {
                  src: "https://img.icons8.com/ios/50/666666/link--v1.png",
                  class: "img-tool",
                  style: vue.normalizeStyle({ opacity: $setup.canInsertLink || $setup.isLinkSelected ? 1 : 0.3 })
                },
                null,
                4
                /* STYLE */
              )
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode("view", {
            class: "tool-item",
            onClick: $setup.insertImage
          }, [
            vue.createElementVNode("image", {
              src: "https://img.icons8.com/ios/50/666666/image.png",
              class: "img-tool"
            })
          ]),
          vue.createElementVNode("view", {
            class: "tool-item",
            onClick: $setup.insertVideo
          }, [
            vue.createElementVNode("image", {
              src: "https://img.icons8.com/ios/50/666666/video-call.png",
              class: "img-tool"
            })
          ])
        ])
      ]),
      $setup.isPopupOpen ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "ql-container static-view"
      }, [
        vue.createElementVNode("rich-text", {
          nodes: $props.modelValue || "<p style='color:#999'>Nhập mô tả...</p>"
        }, null, 8, ["nodes"])
      ])) : (vue.openBlock(), vue.createElementBlock(
        "editor",
        {
          key: 1,
          id: "editor",
          class: "ql-container",
          placeholder: "Nhập mô tả...",
          "show-img-size": true,
          "show-img-toolbar": true,
          "show-img-resize": true,
          onReady: $setup.onEditorReady,
          onInput: $setup.onEditorInput,
          onStatuschange: $setup.onStatusChange
        },
        null,
        32
        /* NEED_HYDRATION */
      )),
      $setup.showColorPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "color-popup-overlay",
        onClick: $setup.closeColorPopup
      }, [
        vue.createElementVNode("view", {
          class: "color-popup",
          onClick: _cache[9] || (_cache[9] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "popup-title" }, "Chọn màu"),
          vue.createElementVNode("view", { class: "color-grid" }, [
            (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.colorList, (c) => {
                return vue.createElementVNode("view", {
                  key: c,
                  class: "color-cell",
                  style: vue.normalizeStyle({ backgroundColor: c }),
                  onClick: ($event) => $setup.selectColor(c)
                }, null, 12, ["onClick"]);
              }),
              64
              /* STABLE_FRAGMENT */
            )),
            vue.createElementVNode("view", {
              class: "color-cell remove-color",
              onClick: _cache[8] || (_cache[8] = ($event) => $setup.selectColor(null))
            }, "✕")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showLinkPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "link-popup-overlay",
        onClick: $setup.closeLinkPopup
      }, [
        vue.createElementVNode("view", {
          class: "link-popup",
          onClick: _cache[12] || (_cache[12] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode(
            "text",
            { class: "popup-title" },
            vue.toDisplayString($setup.isLinkSelected ? "Chỉnh sửa liên kết" : "Chèn liên kết"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "input-label" }, "Văn bản hiển thị:"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "link-input",
                "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $setup.linkText = $event),
                placeholder: "Nhập văn bản..."
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.linkText]
            ])
          ]),
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "input-label" }, "Đường dẫn (URL):"),
            vue.withDirectives(vue.createElementVNode("input", {
              class: "link-input",
              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $setup.linkUrl = $event),
              placeholder: "https://",
              focus: $setup.focusLinkInput
            }, null, 8, ["focus"]), [
              [vue.vModelText, $setup.linkUrl]
            ])
          ]),
          vue.createElementVNode("view", { class: "link-actions" }, [
            $setup.isLinkSelected ? (vue.openBlock(), vue.createElementBlock("button", {
              key: 0,
              class: "link-btn remove",
              onClick: $setup.removeLink
            }, "Gỡ Link")) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode(
              "button",
              {
                class: "link-btn cancel",
                onClick: $setup.closeLinkPopup
              },
              vue.toDisplayString($setup.isLinkSelected ? "Hủy" : "Thoát"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("button", {
              class: "link-btn confirm",
              onClick: $setup.confirmLink
            }, "Lưu")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const TodoEditor = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-7d79903f"], ["__file", "D:/uni_app/vbot_todo_3/components/Todo/TodoEditor.vue"]]);
  const _sfc_main$5 = /* @__PURE__ */ vue.defineComponent({
    __name: "TodoDatePicker",
    props: {
      dueDate: { type: String, required: true },
      notifyDate: { type: String, required: true },
      notifyTime: { type: String, required: true }
    },
    emits: ["update:dueDate", "update:notifyDate", "update:notifyTime"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const onDateChange = (e, field) => {
        emit(`update:${field}`, e.detail.value);
      };
      const formatDateDisplay = (isoStr) => {
        if (!isoStr)
          return "";
        try {
          if (isoStr.includes("-")) {
            const [y, m, d] = isoStr.split("-");
            return `${d}/${m}/${y}`;
          }
          return isoStr;
        } catch (e) {
          return isoStr;
        }
      };
      const __returned__ = { props, emit, onDateChange, formatDateDisplay };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "flat-item date-compound-block" }, [
      vue.createElementVNode("view", { class: "item-left icon-top-aligned" }, [
        vue.createElementVNode("image", {
          src: "https://img.icons8.com/ios/50/666666/time.png",
          class: "item-icon"
        })
      ]),
      vue.createElementVNode("view", { class: "right-column" }, [
        vue.createElementVNode("view", { class: "date-row" }, [
          vue.createElementVNode("picker", {
            mode: "date",
            value: $props.dueDate,
            onChange: _cache[0] || (_cache[0] = ($event) => $setup.onDateChange($event, "dueDate")),
            class: "full-width-picker"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["item-picker", { "placeholder-color": !$props.dueDate }])
              },
              [
                vue.createElementVNode("text", { class: "picker-label" }, "Hạn xử lý:"),
                vue.createTextVNode(
                  " " + vue.toDisplayString($props.dueDate ? $setup.formatDateDisplay($props.dueDate) : "Chọn ngày"),
                  1
                  /* TEXT */
                )
              ],
              2
              /* CLASS */
            )
          ], 40, ["value"])
        ]),
        vue.createElementVNode("view", { class: "inner-divider" }),
        vue.createElementVNode("view", { class: "date-row split-row" }, [
          vue.createElementVNode("picker", {
            mode: "date",
            value: $props.notifyDate,
            onChange: _cache[1] || (_cache[1] = ($event) => $setup.onDateChange($event, "notifyDate")),
            class: "half-picker"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["item-picker", { "placeholder-color": !$props.notifyDate }])
              },
              [
                vue.createElementVNode("text", { class: "picker-label" }, "Ngày thông báo:"),
                vue.createTextVNode(
                  " " + vue.toDisplayString($props.notifyDate ? $setup.formatDateDisplay($props.notifyDate) : "Ngày"),
                  1
                  /* TEXT */
                )
              ],
              2
              /* CLASS */
            )
          ], 40, ["value"]),
          vue.createElementVNode("view", { class: "vertical-divider" }),
          vue.createElementVNode("picker", {
            mode: "time",
            value: $props.notifyTime,
            onChange: _cache[2] || (_cache[2] = ($event) => $setup.onDateChange($event, "notifyTime")),
            class: "half-picker"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["item-picker", { "placeholder-color": !$props.notifyTime }])
              },
              vue.toDisplayString($props.notifyTime ? $props.notifyTime : "Giờ"),
              3
              /* TEXT, CLASS */
            )
          ], 40, ["value"])
        ])
      ])
    ]);
  }
  const TodoDatePicker = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-245edb6a"], ["__file", "D:/uni_app/vbot_todo_3/components/Todo/TodoDatePicker.vue"]]);
  const _sfc_main$4 = /* @__PURE__ */ vue.defineComponent({
    __name: "CustomerModal",
    props: {
      visible: { type: Boolean, required: true },
      customers: { type: Array, required: true },
      loading: { type: Boolean, required: true }
    },
    emits: ["close", "select"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const close = () => {
        emit("close");
      };
      const selectCustomer = (item) => {
        emit("select", item);
        close();
      };
      const getAvatarLabel = (name) => {
        if (!name)
          return "?";
        return name.trim().charAt(0).toUpperCase();
      };
      const formatDate = (timestamp) => {
        if (!timestamp)
          return "";
        const date = new Date(timestamp);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      };
      const __returned__ = { props, emit, close, selectCustomer, getAvatarLabel, formatDate };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.visible ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "modal-overlay",
      onClick: vue.withModifiers($setup.close, ["stop"])
    }, [
      vue.createElementVNode("view", {
        class: "modal-content",
        onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
        }, ["stop"]))
      }, [
        vue.createElementVNode("view", { class: "modal-header" }, [
          vue.createElementVNode("text", { class: "modal-title" }, "Chọn khách hàng"),
          vue.createElementVNode("text", {
            class: "close-btn",
            onClick: $setup.close
          }, "✕")
        ]),
        $props.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-state"
        }, "Đang tải dữ liệu...")) : (vue.openBlock(), vue.createElementBlock("scroll-view", {
          key: 1,
          "scroll-y": "",
          class: "customer-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($props.customers, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "customer-item",
                onClick: ($event) => $setup.selectCustomer(item)
              }, [
                vue.createElementVNode("view", { class: "avatar-circle" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "avatar-text" },
                    vue.toDisplayString($setup.getAvatarLabel(item.name)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "info-column" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "name-text" },
                    vue.toDisplayString(item.name || "(Không tên)"),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "phone-text" },
                    vue.toDisplayString(item.phone || "Không có SĐT"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "date-column" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "date-text" },
                    vue.toDisplayString($setup.formatDate(item.createAt)),
                    1
                    /* TEXT */
                  )
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          $props.customers.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty-state"
          }, "Không có dữ liệu")) : vue.createCommentVNode("v-if", true)
        ]))
      ])
    ])) : vue.createCommentVNode("v-if", true);
  }
  const CustomerModal = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-0c007ba7"], ["__file", "D:/uni_app/vbot_todo_3/components/Todo/CustomerModal.vue"]]);
  const _sfc_main$3 = /* @__PURE__ */ vue.defineComponent({
    __name: "create_todo",
    setup(__props, { expose: __expose }) {
      __expose();
      const {
        loading,
        form,
        goBack,
        submitForm,
        memberOptions,
        onMemberChange,
        currentAssigneeName,
        // Các biến customer
        showCustomerModal,
        loadingCustomer,
        customerList,
        openCustomerPopup,
        onCustomerSelect
      } = useCreateTodoController();
      const __returned__ = { loading, form, goBack, submitForm, memberOptions, onMemberChange, currentAssigneeName, showCustomerModal, loadingCustomer, customerList, openCustomerPopup, onCustomerSelect, TodoEditor, TodoDatePicker, CustomerModal };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "flat-item" }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/edit--v1.png",
            class: "item-icon"
          })
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "item-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.name = $event),
            placeholder: "Nhập tên công việc *",
            maxlength: "29"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.name]
        ])
      ]),
      vue.createVNode($setup["TodoEditor"], {
        modelValue: $setup.form.desc,
        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.desc = $event)
      }, null, 8, ["modelValue"]),
      vue.createElementVNode("view", {
        class: "flat-item",
        onClick: _cache[2] || (_cache[2] = (...args) => $setup.openCustomerPopup && $setup.openCustomerPopup(...args))
      }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/price-tag.png",
            class: "item-icon"
          })
        ]),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["input-trigger", { "placeholder": !$setup.form.customer }])
          },
          vue.toDisplayString($setup.form.customer || "Chọn khách hàng"),
          3
          /* TEXT, CLASS */
        ),
        vue.createElementVNode("text", { class: "arrow-icon" }, "›")
      ]),
      vue.createVNode($setup["CustomerModal"], {
        visible: $setup.showCustomerModal,
        loading: $setup.loadingCustomer,
        customers: $setup.customerList,
        onClose: _cache[3] || (_cache[3] = ($event) => $setup.showCustomerModal = false),
        onSelect: $setup.onCustomerSelect
      }, null, 8, ["visible", "loading", "customers", "onSelect"]),
      vue.createElementVNode("view", { class: "flat-item" }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/user.png",
            class: "item-icon"
          })
        ]),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.memberOptions,
          onChange: _cache[4] || (_cache[4] = (...args) => $setup.onMemberChange && $setup.onMemberChange(...args)),
          class: "full-width-picker"
        }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["picker-display", { "placeholder-color": !$setup.currentAssigneeName }])
            },
            vue.toDisplayString($setup.currentAssigneeName ? $setup.currentAssigneeName : "Người được giao"),
            3
            /* TEXT, CLASS */
          )
        ], 40, ["range"])
      ]),
      vue.createVNode($setup["TodoDatePicker"], {
        dueDate: $setup.form.dueDate,
        "onUpdate:dueDate": _cache[5] || (_cache[5] = ($event) => $setup.form.dueDate = $event),
        notifyDate: $setup.form.notifyDate,
        "onUpdate:notifyDate": _cache[6] || (_cache[6] = ($event) => $setup.form.notifyDate = $event),
        notifyTime: $setup.form.notifyTime,
        "onUpdate:notifyTime": _cache[7] || (_cache[7] = ($event) => $setup.form.notifyTime = $event)
      }, null, 8, ["dueDate", "notifyDate", "notifyTime"]),
      vue.createElementVNode("view", { class: "footer-action" }, [
        vue.createElementVNode("button", {
          class: "btn btn-cancel",
          onClick: _cache[8] || (_cache[8] = (...args) => $setup.goBack && $setup.goBack(...args))
        }, "Hủy bỏ"),
        vue.createElementVNode("button", {
          class: "btn btn-submit",
          disabled: $setup.loading,
          onClick: _cache[9] || (_cache[9] = (...args) => $setup.submitForm && $setup.submitForm(...args))
        }, vue.toDisplayString($setup.loading ? "Đang lưu..." : "Lưu công việc"), 9, ["disabled"])
      ])
    ]);
  }
  const PagesTodoCreateTodo = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "D:/uni_app/vbot_todo_3/pages/todo/create_todo.vue"]]);
  const _imports_0 = "/static/logo.png";
  const _sfc_main$2 = {
    data() {
      return {
        title: "Hello"
      };
    },
    onLoad() {
    },
    methods: {}
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "content" }, [
      vue.createElementVNode("image", {
        class: "logo",
        src: _imports_0
      }),
      vue.createElementVNode("view", { class: "text-area" }, [
        vue.createElementVNode(
          "text",
          { class: "title" },
          vue.toDisplayString($data.title),
          1
          /* TEXT */
        )
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "D:/uni_app/vbot_todo_3/pages/index/index.vue"]]);
  const timestampToDateStr = (ts) => {
    if (!ts || ts <= 0)
      return "";
    try {
      const date = new Date(ts);
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return "";
    }
  };
  const timestampToTimeStr = (ts) => {
    if (!ts || ts <= 0)
      return "";
    try {
      const date = new Date(ts);
      const h = date.getHours().toString().padStart(2, "0");
      const min = date.getMinutes().toString().padStart(2, "0");
      return `${h}:${min}`;
    } catch {
      return "";
    }
  };
  const mapTodoDetailToForm = (apiData) => {
    if (!apiData)
      return null;
    const statusMap = [TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
    let sIndex = statusMap.indexOf(apiData.status);
    if (sIndex === -1)
      sIndex = 0;
    const sourceMap = [TODO_SOURCE.CALL, TODO_SOURCE.CUSTOMER, TODO_SOURCE.CONVERSATION, TODO_SOURCE.CHAT_MESSAGE];
    let srcIndex = sourceMap.indexOf(apiData.links);
    if (srcIndex === -1)
      srcIndex = 0;
    const notiTimestamp = apiData.notificationReceivedAt || 0;
    return {
      id: apiData.id,
      title: apiData.title || "",
      code: apiData.code || "",
      desc: apiData.description || "",
      // HTML từ API
      statusIndex: sIndex,
      sourceIndex: srcIndex,
      assigneeIndex: 0,
      // Tạm fix cứng vì chưa có API User
      assigneeId: apiData.assigneeId || "",
      dueDate: timestampToDateStr(apiData.dueDate),
      notifyDate: timestampToDateStr(notiTimestamp),
      notifyTime: timestampToTimeStr(notiTimestamp)
    };
  };
  const useTodoDetailController = () => {
    const isLoading = vue.ref(false);
    const form = vue.ref({
      id: "",
      title: "",
      code: "Loading...",
      desc: "",
      statusIndex: 0,
      sourceIndex: 0,
      assigneeIndex: 0,
      assigneeId: "",
      dueDate: "",
      notifyDate: "",
      notifyTime: ""
    });
    const statusOptions = ["Chưa xử lý", "Đang xử lý", "Hoàn thành"];
    const sourceOptions = ["Cuộc gọi", "Khách hàng", "Hội thoại", "Tin nhắn"];
    const memberList = vue.ref([]);
    const assigneeOptions = vue.ref([]);
    onLoad(async (options) => {
      await fetchMembers();
      if (options && options.id) {
        await fetchDetail(options.id);
      }
    });
    const fetchMembers = async () => {
      try {
        const data = await getAllMembers();
        memberList.value = data;
        assigneeOptions.value = data.map((m) => m.UserName || "Thành viên ẩn danh");
      } catch (e) {
        formatAppLog("error", "at controllers/todo_detail.ts:41", "Lỗi lấy members", e);
        assigneeOptions.value = ["Không tải được danh sách"];
      }
    };
    const fetchDetail = async (id) => {
      isLoading.value = true;
      try {
        const rawResponse = await getTodoDetail(id);
        const realData = rawResponse && rawResponse.data && !rawResponse.id ? rawResponse.data : rawResponse;
        const mappedData = mapTodoDetailToForm(realData);
        if (mappedData) {
          form.value = mappedData;
          if (form.value.assigneeId && memberList.value.length > 0) {
            const index = memberList.value.findIndex((m) => m.memberUID === form.value.assigneeId);
            if (index !== -1) {
              form.value.assigneeIndex = index;
            } else {
              form.value.assigneeIndex = -1;
            }
          }
        }
      } catch (error) {
        formatAppLog("error", "at controllers/todo_detail.ts:75", "❌ Lỗi lấy chi tiết:", error);
        uni.showToast({ title: "Lỗi kết nối", icon: "none" });
      } finally {
        isLoading.value = false;
      }
    };
    const onStatusChange = (e) => {
      form.value.statusIndex = e.detail.value;
    };
    const onSourceChange = (e) => {
      form.value.sourceIndex = e.detail.value;
    };
    const onAssigneeChange = (e) => {
      const idx = e.detail.value;
      form.value.assigneeIndex = idx;
      if (memberList.value[idx]) {
        form.value.assigneeId = memberList.value[idx].memberUID;
      }
    };
    const goBack = () => {
      uni.navigateBack();
    };
    const saveTodo = () => {
      formatAppLog("log", "at controllers/todo_detail.ts:100", "Lưu:", form.value);
      uni.showToast({ title: "Đã lưu (Demo)", icon: "success" });
    };
    return {
      isLoading,
      form,
      statusOptions,
      sourceOptions,
      assigneeOptions,
      // [MỚI] Trả về options động
      onStatusChange,
      onSourceChange,
      onAssigneeChange,
      goBack,
      saveTodo
    };
  };
  const _sfc_main$1 = /* @__PURE__ */ vue.defineComponent({
    __name: "todo_detail",
    setup(__props, { expose: __expose }) {
      __expose();
      const {
        isLoading,
        // Lấy thêm isLoading
        form,
        statusOptions,
        sourceOptions,
        assigneeOptions,
        onStatusChange,
        onSourceChange,
        onAssigneeChange,
        saveTodo
      } = useTodoDetailController();
      const __returned__ = { isLoading, form, statusOptions, sourceOptions, assigneeOptions, onStatusChange, onSourceChange, onAssigneeChange, saveTodo, TodoEditor, TodoDatePicker };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      $setup.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "loading-overlay"
      }, [
        vue.createElementVNode("text", null, "Đang tải...")
      ])) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", { class: "detail-header" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode(
            "text",
            { class: "header-code" },
            "#" + vue.toDisplayString($setup.form.code),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "header-actions" }, [
            vue.createElementVNode("text", {
              class: "btn-text",
              onClick: _cache[0] || (_cache[0] = (...args) => $setup.saveTodo && $setup.saveTodo(...args))
            }, "Lưu")
          ])
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "header-title-input",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.title = $event),
            placeholder: "Tên công việc"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.title]
        ])
      ]),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "true",
        class: "detail-body"
      }, [
        vue.createElementVNode("view", { class: "section-block" }, [
          vue.createVNode($setup["TodoEditor"], {
            modelValue: $setup.form.desc,
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.form.desc = $event)
          }, null, 8, ["modelValue"])
        ]),
        vue.createElementVNode("view", { class: "section-title" }, "Thông tin công việc"),
        vue.createElementVNode("view", { class: "info-group" }, [
          vue.createElementVNode("view", { class: "flat-item" }, [
            vue.createElementVNode("view", { class: "item-left" }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/checked-checkbox.png",
                class: "item-icon"
              }),
              vue.createElementVNode("text", { class: "item-label" }, "Trạng thái")
            ]),
            vue.createElementVNode("picker", {
              mode: "selector",
              range: $setup.statusOptions,
              value: $setup.form.statusIndex,
              onChange: _cache[3] || (_cache[3] = (...args) => $setup.onStatusChange && $setup.onStatusChange(...args)),
              class: "item-picker-box"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-text" },
                vue.toDisplayString($setup.statusOptions[$setup.form.statusIndex]) + " ▾",
                1
                /* TEXT */
              )
            ], 40, ["range", "value"])
          ]),
          vue.createElementVNode("view", { class: "flat-item" }, [
            vue.createElementVNode("view", { class: "item-left" }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/internet.png",
                class: "item-icon"
              }),
              vue.createElementVNode("text", { class: "item-label" }, "Nguồn")
            ]),
            vue.createElementVNode("picker", {
              mode: "selector",
              range: $setup.sourceOptions,
              value: $setup.form.sourceIndex,
              onChange: _cache[4] || (_cache[4] = (...args) => $setup.onSourceChange && $setup.onSourceChange(...args)),
              class: "item-picker-box"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-text" },
                vue.toDisplayString($setup.sourceOptions[$setup.form.sourceIndex] || "Chọn nguồn") + " ▾",
                1
                /* TEXT */
              )
            ], 40, ["range", "value"])
          ]),
          vue.createElementVNode("view", { class: "flat-item" }, [
            vue.createElementVNode("view", { class: "item-left" }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/user.png",
                class: "item-icon"
              }),
              vue.createElementVNode("text", { class: "item-label" }, "Người được giao")
            ]),
            vue.createElementVNode("picker", {
              mode: "selector",
              range: $setup.assigneeOptions,
              value: $setup.form.assigneeIndex,
              onChange: _cache[5] || (_cache[5] = (...args) => $setup.onAssigneeChange && $setup.onAssigneeChange(...args)),
              class: "item-picker-box"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-text" },
                vue.toDisplayString($setup.form.assigneeIndex > -1 && $setup.assigneeOptions[$setup.form.assigneeIndex] ? $setup.assigneeOptions[$setup.form.assigneeIndex] : "Chọn người giao") + " ▾ ",
                1
                /* TEXT */
              )
            ], 40, ["range", "value"])
          ]),
          vue.createVNode($setup["TodoDatePicker"], {
            dueDate: $setup.form.dueDate,
            "onUpdate:dueDate": _cache[6] || (_cache[6] = ($event) => $setup.form.dueDate = $event),
            notifyDate: $setup.form.notifyDate,
            "onUpdate:notifyDate": _cache[7] || (_cache[7] = ($event) => $setup.form.notifyDate = $event),
            notifyTime: $setup.form.notifyTime,
            "onUpdate:notifyTime": _cache[8] || (_cache[8] = ($event) => $setup.form.notifyTime = $event)
          }, null, 8, ["dueDate", "notifyDate", "notifyTime"])
        ]),
        vue.createElementVNode("view", { class: "section-title" }, "Thông tin khách hàng"),
        vue.createElementVNode("view", { class: "info-group customer-block" }, [
          vue.createElementVNode("text", { style: { "color": "#999", "font-size": "14px", "padding": "15px", "display": "block" } }, " (Chưa có thông tin - API chưa hỗ trợ) ")
        ]),
        vue.createElementVNode("view", { style: { "height": "50px" } })
      ])
    ]);
  }
  const PagesTodoTodoDetail = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-9f96c8fe"], ["__file", "D:/uni_app/vbot_todo_3/pages/todo/todo_detail.vue"]]);
  __definePage("pages/todo/list_todo", PagesTodoListTodo);
  __definePage("pages/todo/create_todo", PagesTodoCreateTodo);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/todo/todo_detail", PagesTodoTodoDetail);
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "App",
    setup(__props, { expose: __expose }) {
      __expose();
      onLaunch((options) => {
        formatAppLog("log", "at App.vue:6", "App Launch");
        const authStore = useAuthStore();
        authStore.initialize(options);
      });
      onShow(() => {
        formatAppLog("log", "at App.vue:13", "App Show");
      });
      onHide(() => {
        formatAppLog("log", "at App.vue:17", "App Hide");
      });
      const __returned__ = { get useAuthStore() {
        return useAuthStore;
      }, get onLaunch() {
        return onLaunch;
      }, get onShow() {
        return onShow;
      }, get onHide() {
        return onHide;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/uni_app/vbot_todo_3/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(createPinia());
    return {
      app,
      Pinia
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
