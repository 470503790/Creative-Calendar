"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const pid = common_vendor.ref("");
    common_vendor.onLoad((q) => {
      pid.value = (q == null ? void 0 : q.pid) || "";
    });
    function addText() {
      common_vendor.index.showToast({ title: "加文字（mock）", icon: "none" });
    }
    function addSticker() {
      common_vendor.index.showToast({ title: "加贴纸（mock）", icon: "none" });
    }
    function exportImage() {
      common_vendor.index.showToast({ title: "导出中…（mock）", icon: "none" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(addText),
        b: common_vendor.o(addSticker),
        c: common_vendor.o(exportImage)
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/editor/index.js.map
