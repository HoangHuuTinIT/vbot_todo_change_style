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
  const AUTH_TOKEN = "uWhDavmBg7FTeC7iRcCrTMbsIBoIWXXfJdOpe_P-iGWOI1cxsKFI6HJlIOyLYe-R5zh4Vaoaec2fYFr3OZo0mq5XF55IFxm75GE171Q6x9w_eQGA5APbdDC_Q5gcgr1cy-JiBh__CsZiOkOOpY_kFEj_vaKLiuHNvGM-4QfOlCZeiFJe5HUJDHbrILJ__ltjOj9BTiET8btS8MjJKz4BUyRqhB3wgccWJZBDH5ZSeZH5RoYk7Sm7cMmhqaokFBZGPAFcszcN526sFGFyKF2lf-CdAj9JN6UB--YMXqzpXGQobu_1yCsyuUkCAttUi5IkHZ2DWjGZVhjA8YYdMmiIBY7ZdazE-SuXa8V-IljgbW5LLgdqXmeV_4Ss-VUK5UwpMjsd_WE9Up2vYE-8kwJjO_Z57ol2LlSQjCk5hY09v8IYJ8rTnC4oqWjJYLgxLA1VV7sny0AgqmUgWBvbq6mZYrpJYbMEbDtccWWzcv07MF21jiRii2BklqC0Ni6ze8eocuMHz91JYvagoQ8UwTgATg";
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
      // SỬA LỖI: Đã xóa 2 dòng gán -1 bị thừa ở dưới
      dueDateFrom: dateToTimestamp$1(filter.dueDateFrom),
      dueDateTo: dateToTimestamp$1(filter.dueDateTo),
      customerCode: "",
      groupId: "",
      transId: "",
      createdBy: "",
      assigneeId: "",
      pluginType: "",
      // Nhận giá trị từ tham số thứ 3
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
      // Class màu sắc
      statusClass: STATUS_COLORS[status] || "bg-orange",
      // Label trạng thái
      statusLabel: STATUS_LABELS[status] || status,
      // Avatar text (nếu còn dùng ở đâu đó)
      avatarText: title.substring(0, 2).toUpperCase(),
      // Sử dụng hàm formatFullDateTime
      createdAtFormatted: formatFullDateTime(apiData.createdAt),
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
        // pageNo và pageSize sẽ được truyền từ params bên ngoài vào
        // Nếu không có thì mới lấy mặc định
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
      data: {
        projectCode: PROJECT_CODE,
        ...params
        // params ở đây chính là bộ lọc (keySearch, code, status,...)
        // buildTodoParams đã chuẩn hóa đúng format (-1, rỗng) như yêu cầu
      }
    });
    return result || 0;
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
    const sourceOptions = ["Tất cả", "CALL", "CUSTOMER", "CONVERSATION", "CHAT_MESSAGE"];
    const sourceValues = ["", "CALL", "CUSTOMER", "CONVERSATION", "CHAT_MESSAGE"];
    const sourceIndex = vue.ref(0);
    const filter = vue.ref({
      title: "",
      jobCode: "",
      createdFrom: "",
      createdTo: "",
      // Thêm date hết hạn
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
          // Lấy giá trị link (CALL, CUSTOMER...)
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
        formatAppLog("error", "at controllers/list_todo.js:91", error);
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
        formatAppLog("error", "at controllers/list_todo.js:125", "Delete Error:", error);
        uni.showToast({ title: "Xóa thất bại", icon: "none" });
      }
    };
    const showActionMenu = (item) => {
      uni.showActionSheet({
        itemList: ["Xóa công việc"],
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
    return {
      todos,
      isLoading,
      isFilterOpen,
      filter,
      isConfirmDeleteOpen,
      itemToDelete,
      // Pagination
      pageSizeOptions,
      pageSizeIndex,
      currentPage,
      totalPages,
      totalItems,
      onPageSizeChange,
      changePage,
      // Options & Indexes cho Filter
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
      confirmDelete
    };
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
        confirmDelete
      } = useListTodoController();
      const __returned__ = { todos, isLoading, isFilterOpen, filter, isConfirmDeleteOpen, itemToDelete, pageSizeOptions, pageSizeIndex, currentPage, totalPages, onPageSizeChange, changePage, statusOptions, statusIndex, onStatusChange, creatorOptions, creatorIndex, onCreatorChange, customerOptions, customerIndex, onCustomerChange, assigneeOptions, assigneeIndex, onAssigneeChange, sourceOptions, sourceIndex, onSourceChange, addNewTask, openFilter, closeFilter, resetFilter, applyFilter, showActionMenu, cancelDelete, confirmDelete, get useListTodoController() {
        return useListTodoController;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
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
                ]);
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
  const PagesTodoListTodo = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-1b4e60ea"], ["__file", "D:/uni_app/vbot_todo/pages/todo/list_todo.vue"]]);
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
      // 4. Các trường Optional
      customerCode: form.customer || "test1",
      assigneeId: form.assignee || "test1",
      groupId: "test1",
      transId: "test1",
      tagCodes: "test1",
      groupMemberUid: "test1",
      files: "",
      phone: "072836272322",
      // 5. Các trường Thời gian (Đã xử lý ghép chuỗi ở trên)
      dueDate: dateToTimestamp(fullDueDate),
      notificationReceivedAt: dateToTimestamp(fullNotifyDateTime)
    };
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
    const loading = vue.ref(false);
    const form = vue.ref({
      name: "",
      desc: "",
      customer: "",
      assignee: "",
      dueDate: getTodayISO(),
      // Chỉ ngày (YYYY-MM-DD)
      notifyDate: getTodayISO(),
      // Ngày thông báo (YYYY-MM-DD)
      notifyTime: getCurrentTime()
      // Giờ thông báo (HH:mm) -> THÊM MỚI
    });
    const bindDateChange = (e, field) => {
      form.value[field] = e.detail.value;
    };
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
        formatAppLog("error", "at controllers/create_todo.js:73", "❌ Create Error:", error);
        uni.showToast({ title: "Lỗi: " + ((error == null ? void 0 : error.message) || "Thất bại"), icon: "none" });
      } finally {
        loading.value = false;
      }
    };
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
    const currentHeader = vue.ref("Normal");
    const colorList = ["#000000", "#424242", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF", "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF", "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0", "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79"];
    const headerOptions = [{ label: "Normal", value: null }, { label: "H1", value: 1 }, { label: "H2", value: 2 }, { label: "H3", value: 3 }];
    const alignIcon = vue.computed(() => formats.value.align === "center" ? "https://img.icons8.com/ios/50/666666/align-center.png" : formats.value.align === "right" ? "https://img.icons8.com/ios/50/666666/align-right.png" : "https://img.icons8.com/ios/50/666666/align-left.png");
    const isPopupOpen = vue.computed(() => showLinkPopup.value || showColorPopup.value);
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
    return {
      loading,
      form,
      formatDateDisplay,
      bindDateChange,
      goBack,
      submitForm,
      formats,
      showLinkPopup,
      linkUrl,
      linkText,
      canInsertLink,
      isLinkSelected,
      focusLinkInput,
      showColorPopup,
      currentColor,
      currentBgColor,
      currentHeader,
      colorList,
      headerOptions,
      alignIcon,
      isPopupOpen,
      onEditorReady,
      onEditorInput,
      onStatusChange,
      handleLinkBtn,
      closeLinkPopup,
      confirmLink,
      removeLink,
      format,
      onHeaderChange,
      toggleAlign,
      openColorPicker,
      closeColorPopup,
      selectColor,
      insertImage,
      insertVideo
    };
  };
  const _sfc_main$2 = {
    __name: "create_todo",
    setup(__props, { expose: __expose }) {
      __expose();
      const {
        loading,
        form,
        formatDateDisplay,
        bindDateChange,
        goBack,
        submitForm,
        formats,
        showLinkPopup,
        linkUrl,
        linkText,
        canInsertLink,
        isLinkSelected,
        focusLinkInput,
        showColorPopup,
        currentColor,
        currentBgColor,
        currentHeader,
        colorList,
        headerOptions,
        alignIcon,
        isPopupOpen,
        onEditorReady,
        onEditorInput,
        onStatusChange,
        handleLinkBtn,
        closeLinkPopup,
        confirmLink,
        removeLink,
        format,
        onHeaderChange,
        toggleAlign,
        openColorPicker,
        closeColorPopup,
        selectColor,
        insertImage,
        insertVideo
      } = useCreateTodoController();
      const __returned__ = { loading, form, formatDateDisplay, bindDateChange, goBack, submitForm, formats, showLinkPopup, linkUrl, linkText, canInsertLink, isLinkSelected, focusLinkInput, showColorPopup, currentColor, currentBgColor, currentHeader, colorList, headerOptions, alignIcon, isPopupOpen, onEditorReady, onEditorInput, onStatusChange, handleLinkBtn, closeLinkPopup, confirmLink, removeLink, format, onHeaderChange, toggleAlign, openColorPicker, closeColorPopup, selectColor, insertImage, insertVideo, get useCreateTodoController() {
        return useCreateTodoController;
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
            vue.createElementVNode("picker", {
              range: $setup.headerOptions,
              "range-key": "label",
              onChange: _cache[7] || (_cache[7] = (...args) => $setup.onHeaderChange && $setup.onHeaderChange(...args)),
              class: "tool-picker"
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-label" },
                vue.toDisplayString($setup.currentHeader) + " ▾",
                1
                /* TEXT */
              )
            ], 40, ["range"])
          ]),
          vue.createElementVNode("view", { class: "tool-row" }, [
            vue.createElementVNode("view", {
              class: "tool-item",
              onClick: _cache[8] || (_cache[8] = ($event) => $setup.openColorPicker("color"))
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
              onClick: _cache[9] || (_cache[9] = ($event) => $setup.openColorPicker("backgroundColor"))
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
              onClick: _cache[10] || (_cache[10] = (...args) => $setup.toggleAlign && $setup.toggleAlign(...args))
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
                onClick: _cache[11] || (_cache[11] = (...args) => $setup.handleLinkBtn && $setup.handleLinkBtn(...args))
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
              onClick: _cache[12] || (_cache[12] = (...args) => $setup.insertImage && $setup.insertImage(...args))
            }, [
              vue.createElementVNode("image", {
                src: "https://img.icons8.com/ios/50/666666/image.png",
                class: "img-tool"
              })
            ]),
            vue.createElementVNode("view", {
              class: "tool-item",
              onClick: _cache[13] || (_cache[13] = (...args) => $setup.insertVideo && $setup.insertVideo(...args))
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
            "show-img-size": true,
            "show-img-toolbar": true,
            "show-img-resize": true,
            onReady: _cache[14] || (_cache[14] = (...args) => $setup.onEditorReady && $setup.onEditorReady(...args)),
            onInput: _cache[15] || (_cache[15] = (...args) => $setup.onEditorInput && $setup.onEditorInput(...args)),
            onStatuschange: _cache[16] || (_cache[16] = (...args) => $setup.onStatusChange && $setup.onStatusChange(...args))
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
            "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => $setup.form.customer = $event),
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
            "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => $setup.form.assignee = $event),
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
              onChange: _cache[19] || (_cache[19] = ($event) => $setup.bindDateChange($event, "dueDate")),
              class: "full-width-picker"
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["item-picker", { "placeholder-color": !$setup.form.dueDate }])
                },
                [
                  vue.createElementVNode("text", { class: "picker-label" }, "Hết hạn:"),
                  vue.createTextVNode(
                    " " + vue.toDisplayString($setup.form.dueDate ? $setup.formatDateDisplay($setup.form.dueDate) : "Chọn ngày"),
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
              value: $setup.form.notifyDate,
              onChange: _cache[20] || (_cache[20] = ($event) => $setup.bindDateChange($event, "notifyDate")),
              class: "half-picker"
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["item-picker", { "placeholder-color": !$setup.form.notifyDate }])
                },
                [
                  vue.createElementVNode("text", { class: "picker-label" }, "Thông báo:"),
                  vue.createTextVNode(
                    " " + vue.toDisplayString($setup.form.notifyDate ? $setup.formatDateDisplay($setup.form.notifyDate) : "Ngày"),
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
              value: $setup.form.notifyTime,
              onChange: _cache[21] || (_cache[21] = ($event) => $setup.bindDateChange($event, "notifyTime")),
              class: "half-picker"
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["item-picker", { "placeholder-color": !$setup.form.notifyTime }])
                },
                vue.toDisplayString($setup.form.notifyTime ? $setup.form.notifyTime : "Giờ"),
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
          onClick: _cache[22] || (_cache[22] = (...args) => $setup.goBack && $setup.goBack(...args))
        }, "Hủy bỏ"),
        vue.createElementVNode("button", {
          class: "btn btn-submit",
          disabled: $setup.loading,
          onClick: _cache[23] || (_cache[23] = (...args) => $setup.submitForm && $setup.submitForm(...args))
        }, vue.toDisplayString($setup.loading ? "Đang lưu..." : "Lưu công việc"), 9, ["disabled"])
      ]),
      $setup.showColorPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "color-popup-overlay",
        onClick: _cache[26] || (_cache[26] = (...args) => $setup.closeColorPopup && $setup.closeColorPopup(...args))
      }, [
        vue.createElementVNode("view", {
          class: "color-popup",
          onClick: _cache[25] || (_cache[25] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "popup-title" }, "Chọn màu"),
          vue.createElementVNode("view", { class: "color-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.colorList, (c) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: c,
                  class: "color-cell",
                  style: vue.normalizeStyle({ backgroundColor: c }),
                  onClick: ($event) => $setup.selectColor(c)
                }, null, 12, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createElementVNode("view", {
              class: "color-cell remove-color",
              onClick: _cache[24] || (_cache[24] = ($event) => $setup.selectColor(null))
            }, "✕")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.showLinkPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "link-popup-overlay",
        onClick: _cache[33] || (_cache[33] = (...args) => $setup.closeLinkPopup && $setup.closeLinkPopup(...args))
      }, [
        vue.createElementVNode("view", {
          class: "link-popup",
          onClick: _cache[32] || (_cache[32] = vue.withModifiers(() => {
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
                "onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => $setup.linkText = $event),
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
              "onUpdate:modelValue": _cache[28] || (_cache[28] = ($event) => $setup.linkUrl = $event),
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
              onClick: _cache[29] || (_cache[29] = (...args) => $setup.removeLink && $setup.removeLink(...args))
            }, "Gỡ Link")) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode(
              "button",
              {
                class: "link-btn cancel",
                onClick: _cache[30] || (_cache[30] = (...args) => $setup.closeLinkPopup && $setup.closeLinkPopup(...args))
              },
              vue.toDisplayString($setup.isLinkSelected ? "Hủy" : "Thoát"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("button", {
              class: "link-btn confirm",
              onClick: _cache[31] || (_cache[31] = (...args) => $setup.confirmLink && $setup.confirmLink(...args))
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
