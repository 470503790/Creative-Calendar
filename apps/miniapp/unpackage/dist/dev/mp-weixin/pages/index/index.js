"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mockApi = require("../../utils/mock-api.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const hot = common_vendor.ref([]);
    common_vendor.onMounted(async () => {
      hot.value = (await utils_mockApi.getTemplates()).slice(0, 5);
    });
    function goDetail(id) {
      common_vendor.index.navigateTo({ url: `/pages/templates/detail?id=${id}` });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(hot.value, (t, k0, i0) => {
          return {
            a: t.coverUrl,
            b: common_vendor.t(t.title),
            c: t.id,
            d: common_vendor.o(($event) => goDetail(t.id), t.id)
          };
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
