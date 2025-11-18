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
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
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
  const BASE_URL = "https://api-staging.vbot.vn/v1.0/api/module-crm/token";
  const AUTH_TOKEN = "p9M9bJ7sW1m_2ykKdzoUW0jgsP-Co6GU4AeLCbEJPPoqIBUtUd6OSq53HFWMol_Pw0ENa772ir2mgdQvnc4VdEpilYI5KFlUb8r6E_ZQLtqGYTHL3NpPAIJU-PzpsQC8L0pwcBsbb3MrfsSU0icDWlu5MCtLLF9Vua_YjyjOg9PQf5Z6lEG0Z8-fKHl2I1-HzWpj6BbhLZ3dkN9ybneoYOdSS6yRh-LhtyQJggbnFbS0Aa48Jujx5RaC9HbGGI3DH3XMYv_Ph0BQG7gmU31jZJ2Q2pWeE7Gw3-PWCSRKYlQSJb51Iki0iLAzJwsQBEqjzal7H-4ZhJ95N0zYfVuE2l3ik64k2w7UscSzu-_wPBBAm-9JFapMVdK8VO_jM45unWQWR7_I8lqtfJYBjy_HRh41QwVDCFF_tQdb0J1zhUTYq3FjNPG1EclZ7p6hTASNmkMUoi1RhO5k7vfTtM9CC-i2O6WGLuFKHV44q24gQgoBTfP0jXYzP4UDknEF0lPdbbqGdB-4FjY3EYB9LNJD0w";
  const PROJECT_CODE = "PR202511170947436134";
  const UID = "77b7675d29d74cafa23771e46881db7c";
  const FULL_API_URL = `${BASE_URL}?projectCode=${PROJECT_CODE}&uid=${UID}&type=TODO&source=Desktop-RTC`;
  const request = (options) => {
    return new Promise((resolve, reject) => {
      const dynamicToken = uni.getStorageSync("vbot_token");
      const finalToken = dynamicToken || AUTH_TOKEN;
      uni.request({
        url: options.url,
        method: options.method || "GET",
        data: options.data || {},
        header: {
          "Authorization": `Bearer ${finalToken}`,
          "Content-Type": "application/json",
          ...options.header
        },
        success: (res) => {
          var _a;
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.errorCode) === 0) {
            resolve(res.data.data);
          } else {
            formatAppLog("error", "at utils/request.js:23", `[API Error] ${options.url}:`, res.data);
            reject(res.data);
          }
        },
        fail: (err) => {
          formatAppLog("error", "at utils/request.js:28", "[Network Error]:", err);
          reject(err);
        }
      });
    });
  };
  const TODO_STATUS = {
    NEW: "TO_DO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE"
  };
  const STATUS_LABELS = {
    [TODO_STATUS.NEW]: "Mới",
    [TODO_STATUS.IN_PROGRESS]: "Đang làm",
    [TODO_STATUS.DONE]: "Xong"
  };
  const STATUS_COLORS = {
    [TODO_STATUS.DONE]: "bg-green",
    [TODO_STATUS.IN_PROGRESS]: "bg-blue",
    [TODO_STATUS.NEW]: "bg-orange"
  };
  const formatTimeShort = (timestamp) => {
    if (!timestamp || timestamp === -1 || timestamp === 0)
      return "";
    const date = new Date(timestamp);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${min}, ${d} thg ${m}`;
  };
  const dateToTimestamp$1 = (dateStr) => !dateStr ? -1 : new Date(dateStr).getTime();
  const buildTodoParams = (filter, statusValue) => {
    return {
      keySearch: filter.title || "",
      code: filter.jobCode || "",
      status: statusValue || "",
      // Xử lý ngày tháng: String -> Timestamp
      startDate: dateToTimestamp$1(filter.createdFrom),
      endDate: dateToTimestamp$1(filter.createdTo),
      // Các giá trị mặc định (Default values) để khớp với request mẫu
      dueDateFrom: -1,
      dueDateTo: -1,
      customerCode: "",
      groupId: "",
      transId: "",
      createdBy: "",
      assigneeId: "",
      pluginType: "",
      links: ""
    };
  };
  const mapTodoFromApi = (apiData) => {
    if (!apiData)
      return {};
    const status = apiData.status || TODO_STATUS.NEW;
    const title = apiData.title || "Không tên";
    return {
      // Giữ lại ID và Code để xử lý logic click
      id: apiData.id,
      code: apiData.code,
      // Dữ liệu hiển thị
      title,
      // --- LOGIC UI ĐÃ ĐƯỢC TÍNH TOÁN SẴN TẠI ĐÂY ---
      // 1. Class màu sắc (bg-green, bg-orange...)
      statusClass: STATUS_COLORS[status] || "bg-orange",
      // 2. Label trạng thái (Mới, Xong...)
      statusLabel: STATUS_LABELS[status] || status,
      // 3. Avatar chữ cái (lấy 2 ký tự đầu)
      avatarText: title.substring(0, 2).toUpperCase(),
      // 4. Ngày tạo đã format (Ví dụ: "14:30, 17 thg 11")
      createdAtFormatted: formatTimeShort(apiData.createdAt),
      // Giữ lại raw data phòng khi cần dùng các trường khác (description, links...)
      raw: apiData
    };
  };
  const API_URL = "https://api-staging.vbot.vn/v1.0/api/module-todo/todo";
  const getTodos = async (params) => {
    const rawData = await request({
      url: `${API_URL}/getAll`,
      method: "GET",
      data: {
        projectCode: PROJECT_CODE,
        pageNo: 1,
        pageSize: 15,
        // Sửa thành 15 theo mẫu request của bạn
        ...params
        // Merge các params từ model gửi vào
      }
    });
    if (Array.isArray(rawData)) {
      return rawData.map((item) => mapTodoFromApi(item));
    }
    return [];
  };
  const createTodo = (data) => {
    return request({
      url: `${API_URL}/create`,
      method: "POST",
      data
    });
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$3 = {
    __name: "list_todo",
    setup(__props, { expose: __expose }) {
      __expose();
      const todos = vue.ref([]);
      const isLoading = vue.ref(false);
      const isFilterOpen = vue.ref(false);
      const statusOptions = ["Tất cả", STATUS_LABELS[TODO_STATUS.NEW], STATUS_LABELS[TODO_STATUS.IN_PROGRESS], STATUS_LABELS[TODO_STATUS.DONE]];
      const statusValues = ["", TODO_STATUS.NEW, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE];
      const statusIndex = vue.ref(0);
      const filter = vue.ref({ title: "", jobCode: "", createdFrom: "", createdTo: "" });
      onShow(() => {
        getTodoList();
      });
      const getTodoList = async () => {
        isLoading.value = true;
        try {
          const params = buildTodoParams(filter.value, statusValues[statusIndex.value]);
          const data = await getTodos(params);
          todos.value = data || [];
        } catch (error) {
          formatAppLog("error", "at pages/todo/list_todo.vue:131", error);
          uni.showToast({ title: "Lỗi tải dữ liệu", icon: "none" });
        } finally {
          isLoading.value = false;
        }
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
      const resetFilter = () => {
        filter.value = { title: "", jobCode: "", createdFrom: "", createdTo: "" };
        statusIndex.value = 0;
      };
      const applyFilter = () => {
        closeFilter();
        getTodoList();
      };
      const __returned__ = { todos, isLoading, isFilterOpen, statusOptions, statusValues, statusIndex, filter, getTodoList, addNewTask, openFilter, closeFilter, onStatusChange, resetFilter, applyFilter, ref: vue.ref, get onShow() {
        return onShow;
      }, get getTodos() {
        return getTodos;
      }, get TODO_STATUS() {
        return TODO_STATUS;
      }, get STATUS_LABELS() {
        return STATUS_LABELS;
      }, get buildTodoParams() {
        return buildTodoParams;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "header-left" }),
        vue.createElementVNode("text", { class: "header-title" }, "Công việc"),
        vue.createElementVNode("view", {
          class: "header-right",
          onClick: $setup.openFilter
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
                  class: "card-item"
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
                      vue.createElementVNode("view", { class: "circle-checkbox" }),
                      vue.createElementVNode(
                        "text",
                        { class: "card-title" },
                        vue.toDisplayString(item.title),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "card-row mid-row" }, [
                      vue.createElementVNode("image", {
                        src: "https://img.icons8.com/ios/50/666666/time.png",
                        class: "icon-small"
                      }),
                      vue.createElementVNode(
                        "text",
                        { class: "card-date" },
                        "Tạo lúc: " + vue.toDisplayString(item.createdAtFormatted),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "card-row bot-row" }, [
                      vue.createElementVNode("view", { class: "badge-yellow" }, [
                        vue.createElementVNode("image", {
                          src: "https://img.icons8.com/ios-filled/50/997b00/clock--v1.png",
                          class: "icon-tiny"
                        }),
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(item.code),
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "view",
                        { class: "status-text" },
                        vue.toDisplayString(item.statusLabel),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["avatar-circle", item.statusClass])
                        },
                        vue.toDisplayString(item.avatarText),
                        3
                        /* TEXT, CLASS */
                      )
                    ])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createElementVNode("view", { style: { "height": "20px" } })
          ]))
        ]),
        vue.createElementVNode("view", { class: "fixed-footer" }, [
          vue.createElementVNode("button", {
            class: "btn-add-more",
            onClick: $setup.addNewTask
          }, "+ Thêm công việc")
        ])
      ]),
      $setup.isFilterOpen ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "filter-overlay",
        onClick: vue.withModifiers($setup.closeFilter, ["stop"])
      }, [
        vue.createElementVNode("view", {
          class: "filter-panel",
          onClick: _cache[4] || (_cache[4] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "filter-header" }, [
            vue.createElementVNode("text", { class: "filter-title" }, "Bộ lọc tìm kiếm"),
            vue.createElementVNode("text", {
              class: "close-btn",
              onClick: $setup.closeFilter
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
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.filter.title = $event),
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
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.filter.jobCode = $event),
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
                onChange: $setup.onStatusChange
              }, [
                vue.createElementVNode("view", { class: "f-picker" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.statusOptions[$setup.statusIndex]),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "arrow" }, "▼")
                ])
              ], 40, ["value"])
            ]),
            vue.createElementVNode("view", { class: "f-section-title" }, "Thời gian tạo"),
            vue.createElementVNode("view", { class: "f-row" }, [
              vue.createElementVNode("view", { class: "f-group half" }, [
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: $setup.filter.createdFrom,
                  onChange: _cache[2] || (_cache[2] = (e) => $setup.filter.createdFrom = e.detail.value)
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
                  onChange: _cache[3] || (_cache[3] = (e) => $setup.filter.createdTo = e.detail.value)
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
            ])
          ]),
          vue.createElementVNode("view", { class: "filter-footer" }, [
            vue.createElementVNode("button", {
              class: "btn-reset",
              onClick: $setup.resetFilter
            }, "Đặt lại"),
            vue.createElementVNode("button", {
              class: "btn-apply",
              onClick: $setup.applyFilter
            }, "Áp dụng")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTodoListTodo = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-1b4e60ea"], ["__file", "D:/uni_app/vbot_todo/pages/todo/list_todo.vue"]]);
  const dateToTimestamp = (dateStr) => {
    if (!dateStr)
      return -1;
    return new Date(dateStr).getTime();
  };
  const buildCreateTodoPayload = (form, config) => {
    return {
      // 1. Các trường Text cơ bản
      title: form.name,
      description: form.desc || "",
      // 2. Các trường Config / System
      projectCode: config.projectCode,
      createdBy: config.uid,
      status: "TO_DO",
      // 3. Enum & Loại
      links: "CALL",
      pluginType: "test1",
      // 4. Các trường Optional (Default value để tránh lỗi 400)
      customerCode: form.customer || "test1",
      assigneeId: form.assignee || "test1",
      groupId: "test1",
      transId: "test1",
      tagCodes: "test1",
      groupMemberUid: "test1",
      files: "",
      phone: "072836272322",
      // 5. Các trường Thời gian
      dueDate: dateToTimestamp(form.dueDate),
      notificationReceivedAt: dateToTimestamp(form.notifyDate)
    };
  };
  const _sfc_main$2 = {
    __name: "create_todo",
    setup(__props, { expose: __expose }) {
      __expose();
      const loading = vue.ref(false);
      const form = vue.ref({
        name: "",
        desc: "",
        customer: "",
        assignee: "",
        dueDate: "",
        notifyDate: ""
      });
      const editorCtx = vue.ref(null);
      const formats = vue.ref({});
      const showLinkPopup = vue.ref(false);
      const linkUrl = vue.ref("");
      const linkText = vue.ref("");
      const canInsertLink = vue.ref(false);
      const isLinkSelected = vue.ref(false);
      const focusLinkInput = vue.ref(false);
      const showColorPopup = vue.ref(false);
      const colorType = vue.ref("color");
      const currentColor = vue.ref("#000000");
      const currentBgColor = vue.ref("transparent");
      const colorList = ["#000000", "#424242", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF", "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF", "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0", "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79"];
      const headerOptions = [{ label: "Normal", value: null }, { label: "H1", value: 1 }, { label: "H2", value: 2 }, { label: "H3", value: 3 }];
      const currentHeader = vue.ref("Normal");
      const alignIcon = vue.computed(() => formats.value.align === "center" ? "https://img.icons8.com/ios/50/666666/align-center.png" : formats.value.align === "right" ? "https://img.icons8.com/ios/50/666666/align-right.png" : "https://img.icons8.com/ios/50/666666/align-left.png");
      const isPopupOpen = vue.computed(() => showLinkPopup.value || showColorPopup.value);
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
          formatAppLog("log", "at pages/todo/create_todo.vue:159", "📤 Payload:", JSON.stringify(payload));
          await createTodo(payload);
          uni.showToast({ title: "Tạo thành công!", icon: "success" });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch (error) {
          formatAppLog("error", "at pages/todo/create_todo.vue:167", "❌ Create Error:", error);
          uni.showToast({ title: "Lỗi: " + ((error == null ? void 0 : error.message) || "Thất bại"), icon: "none" });
        } finally {
          loading.value = false;
        }
      };
      const onEditorReady = () => {
        uni.createSelectorQuery().select("#editor").context((res) => {
          editorCtx.value = res.context;
          if (form.value.desc)
            editorCtx.value.setContents({ html: form.value.desc });
        }).exec();
      };
      const onEditorInput = (e) => {
        form.value.desc = e.detail.html;
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
      const format = (name, value) => {
        if (editorCtx.value)
          editorCtx.value.format(name, value);
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
          currentColor.value = color || "#000000";
          format("color", color);
        } else {
          currentBgColor.value = color || "transparent";
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
      const bindDateChange = (e, f) => {
        form.value[f] = e.detail.value;
      };
      const goBack = () => uni.navigateBack();
      const __returned__ = { loading, form, editorCtx, formats, showLinkPopup, linkUrl, linkText, canInsertLink, isLinkSelected, focusLinkInput, showColorPopup, colorType, currentColor, currentBgColor, colorList, headerOptions, currentHeader, alignIcon, isPopupOpen, submitForm, onEditorReady, onEditorInput, onStatusChange, handleLinkBtn, closeLinkPopup, confirmLink, removeLink, format, onHeaderChange, toggleAlign, openColorPicker, closeColorPopup, selectColor, insertImage, insertVideo, bindDateChange, goBack, ref: vue.ref, computed: vue.computed, nextTick: vue.nextTick, get createTodo() {
        return createTodo;
      }, get PROJECT_CODE() {
        return PROJECT_CODE;
      }, get UID() {
        return UID;
      }, get buildCreateTodoPayload() {
        return buildCreateTodoPayload;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
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
            placeholder: "Nhập tên công việc *"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.name]
        ])
      ]),
      vue.createElementVNode("view", { class: "editor-container" }, [
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
                onClick: _cache[1] || (_cache[1] = ($event) => $setup.format("bold"))
              },
              [
                vue.createElementVNode("text", { class: "txt-icon bold" }, "B")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["tool-item", { "active": $setup.formats.italic }]),
                onClick: _cache[2] || (_cache[2] = ($event) => $setup.format("italic"))
              },
              [
                vue.createElementVNode("text", { class: "txt-icon italic" }, "I")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["tool-item", { "active": $setup.formats.underline }]),
                onClick: _cache[3] || (_cache[3] = ($event) => $setup.format("underline"))
              },
              [
                vue.createElementVNode("text", { class: "txt-icon underline" }, "U")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["tool-item", { "active": $setup.formats.strike }]),
                onClick: _cache[4] || (_cache[4] = ($event) => $setup.format("strike"))
              },
              [
                vue.createElementVNode("text", { class: "txt-icon strike" }, "S")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode("view", { class: "tool-divider" }),
            vue.createElementVNode("view", {
              class: "tool-item",
              onClick: _cache[5] || (_cache[5] = ($event) => $setup.format("list", "ordered"))
            }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/numbered-list.png",
                class: "img-tool"
              })
            ]),
            vue.createElementVNode("view", {
              class: "tool-item",
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.format("list", "bullet"))
            }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/list.png",
                class: "img-tool"
              })
            ]),
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
              onClick: _cache[7] || (_cache[7] = ($event) => $setup.openColorPicker("color"))
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
              onClick: _cache[8] || (_cache[8] = ($event) => $setup.openColorPicker("backgroundColor"))
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
            vue.createElementVNode("view", {
              class: "tool-item",
              onClick: $setup.toggleAlign
            }, [
              vue.createElementVNode("image", {
                src: $setup.alignIcon,
                class: "img-tool"
              }, null, 8, ["src"])
            ]),
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
            nodes: $setup.form.desc || "<p style='color:#999'>Nhập mô tả...</p>"
          }, null, 8, ["nodes"])
        ])) : (vue.openBlock(), vue.createElementBlock(
          "editor",
          {
            key: 1,
            id: "editor",
            class: "ql-container",
            placeholder: "Nhập mô tả...",
            "show-img-size": "",
            "show-img-toolbar": "",
            "show-img-resize": "",
            onReady: $setup.onEditorReady,
            onInput: $setup.onEditorInput,
            onStatuschange: $setup.onStatusChange
          },
          null,
          32
          /* NEED_HYDRATION */
        ))
      ]),
      vue.createElementVNode("view", { class: "flat-item" }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/price-tag.png",
            class: "item-icon"
          })
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "item-input",
            "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $setup.form.customer = $event),
            placeholder: "Mã khách hàng"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.customer]
        ])
      ]),
      vue.createElementVNode("view", { class: "flat-item" }, [
        vue.createElementVNode("view", { class: "item-left" }, [
          vue.createElementVNode("image", {
            src: "https://img.icons8.com/ios/50/666666/user.png",
            class: "item-icon"
          })
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "item-input",
            "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $setup.form.assignee = $event),
            placeholder: "ID người nhận"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.form.assignee]
        ])
      ]),
      vue.createElementVNode("view", { class: "flat-item date-compound-block" }, [
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
              value: $setup.form.dueDate,
              onChange: _cache[11] || (_cache[11] = ($event) => $setup.bindDateChange($event, "dueDate")),
              class: "full-width-picker"
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["item-picker", { "placeholder-color": !$setup.form.dueDate }])
                },
                vue.toDisplayString($setup.form.dueDate ? $setup.form.dueDate : "Chọn ngày hết hạn"),
                3
                /* TEXT, CLASS */
              )
            ], 40, ["value"])
          ]),
          vue.createElementVNode("view", { class: "inner-divider" }),
          vue.createElementVNode("view", { class: "date-row" }, [
            vue.createElementVNode("picker", {
              mode: "date",
              value: $setup.form.notifyDate,
              onChange: _cache[12] || (_cache[12] = ($event) => $setup.bindDateChange($event, "notifyDate")),
              class: "full-width-picker"
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["item-picker", { "placeholder-color": !$setup.form.notifyDate }])
                },
                vue.toDisplayString($setup.form.notifyDate ? $setup.form.notifyDate : "Chọn ngày thông báo"),
                3
                /* TEXT, CLASS */
              )
            ], 40, ["value"])
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "footer-action" }, [
        vue.createElementVNode("button", {
          class: "btn btn-cancel",
          onClick: $setup.goBack
        }, "Hủy bỏ"),
        vue.createElementVNode("button", {
          class: "btn btn-submit",
          disabled: $setup.loading,
          onClick: $setup.submitForm
        }, vue.toDisplayString($setup.loading ? "Đang lưu..." : "Lưu công việc"), 9, ["disabled"])
      ]),
      $setup.showColorPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "color-popup-overlay",
        onClick: $setup.closeColorPopup
      }, [
        vue.createElementVNode("view", {
          class: "color-popup",
          onClick: _cache[14] || (_cache[14] = vue.withModifiers(() => {
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
              onClick: _cache[13] || (_cache[13] = ($event) => $setup.selectColor(null))
            }, "✕")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showLinkPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "link-popup-overlay",
        onClick: $setup.closeLinkPopup
      }, [
        vue.createElementVNode("view", {
          class: "link-popup",
          onClick: _cache[17] || (_cache[17] = vue.withModifiers(() => {
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
                "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => $setup.linkText = $event),
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
              "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => $setup.linkUrl = $event),
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
  const PagesTodoCreateTodo = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "D:/uni_app/vbot_todo/pages/todo/create_todo.vue"]]);
  const _imports_0 = "/static/logo.png";
  const _sfc_main$1 = {
    data() {
      return {
        title: "Hello"
      };
    },
    onLoad() {
    },
    methods: {}
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "D:/uni_app/vbot_todo/pages/index/index.vue"]]);
  __definePage("pages/todo/list_todo", PagesTodoListTodo);
  __definePage("pages/todo/create_todo", PagesTodoCreateTodo);
  __definePage("pages/index/index", PagesIndexIndex);
  const fetchAppToken = () => {
    return new Promise((resolve, reject) => {
      uni.request({
        url: FULL_API_URL,
        method: "GET",
        header: {
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        success: (res) => {
          var _a;
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.status) === 1) {
            resolve(res.data.data);
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  };
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:7", "App Launch");
      fetchAppToken().then((data) => {
        formatAppLog("log", "at App.vue:11", "Token mới nhất là:", data.token);
        uni.setStorageSync("vbot_token", data.token);
      }).catch((err) => {
        formatAppLog("error", "at App.vue:17", "Lỗi lấy token:", err);
      });
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:21", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:24", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/uni_app/vbot_todo/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
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
