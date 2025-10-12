"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    function goWorks() {
      common_vendor.index.switchTab({ url: "/pages/works/index" });
    }
    function goTemplates() {
      common_vendor.index.switchTab({ url: "/pages/templates/index" });
    }
    function openSettings() {
      common_vendor.index.showToast({ title: "设置功能开发中", icon: "none" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goWorks),
        b: common_vendor.o(goTemplates),
        c: common_vendor.o(openSettings)
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/index.js.map
