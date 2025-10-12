"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mockApi = require("../../utils/mock-api.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const hot = common_vendor.ref([]);
    common_vendor.onMounted(async () => {
      const templates = await utils_mockApi.getTemplates();
      hot.value = (templates || []).slice(0, 5);
    });
    function goDetail(id) {
      if (!id)
        return;
      common_vendor.index.navigateTo({ url: `/pages/templates/detail?id=${id}` });
    }
    function goTemplates() {
      common_vendor.index.switchTab({ url: "/pages/templates/index" });
    }
    function goWorks() {
      common_vendor.index.switchTab({ url: "/pages/works/index" });
    }
    function openNotifications() {
      common_vendor.index.showToast({ title: "通知中心开发中", icon: "none" });
    }
    function openSearch() {
      common_vendor.index.switchTab({ url: "/pages/templates/index" });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(openNotifications),
        b: common_vendor.o(openSearch),
        c: common_vendor.f(hot.value, (t, k0, i0) => {
          return {
            a: t.coverUrl,
            b: common_vendor.t(t.title),
            c: t.id,
            d: common_vendor.o(($event) => goDetail(t.id), t.id)
          };
        }),
        d: common_vendor.o(goTemplates),
        e: common_vendor.o(goWorks)
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
