"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const projects = common_vendor.ref([
      { id: "p_001", name: "夏日海报", updated: "2025-03-12 20:45" },
      { id: "p_002", name: "品牌月历", updated: "2025-03-10 09:12" },
      { id: "p_003", name: "倒数日海报", updated: "2025-03-06 14:30" }
    ]);
    function goCreate() {
      common_vendor.index.switchTab({ url: "/pages/editor/index" });
    }
    function openProject(id) {
      if (!id)
        return;
      common_vendor.index.navigateTo({ url: `/pages/editor/index?pid=${id}` });
    }
    function preview(p) {
      common_vendor.index.showToast({ title: `${p.name}（预览中）`, icon: "none" });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goCreate),
        b: projects.value.length
      }, projects.value.length ? {
        c: common_vendor.f(projects.value, (p, k0, i0) => {
          return {
            a: common_vendor.t(p.name),
            b: common_vendor.t(p.updated),
            c: common_vendor.o(($event) => openProject(p.id), p.id),
            d: common_vendor.o(($event) => preview(p), p.id),
            e: p.id
          };
        })
      } : {
        d: common_vendor.o(goCreate)
      });
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/works/index.js.map
