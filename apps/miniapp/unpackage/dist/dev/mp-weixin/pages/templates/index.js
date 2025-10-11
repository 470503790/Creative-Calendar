"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mockApi = require("../../utils/mock-api.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const q = common_vendor.ref("");
    const raw = common_vendor.ref([]);
    const list = common_vendor.computed(() => !q.value ? raw.value : raw.value.filter((t) => t.title.includes(q.value) || t.tags.some((x) => x.includes(q.value))));
    common_vendor.onMounted(async () => {
      raw.value = await utils_mockApi.getTemplates();
    });
    function doSearch() {
    }
    function goDetail(id) {
      common_vendor.index.navigateTo({ url: `/pages/templates/detail?id=${id}` });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(doSearch),
        b: q.value,
        c: common_vendor.o(($event) => q.value = $event.detail.value),
        d: common_vendor.f(list.value, (t, k0, i0) => {
          return {
            a: t.coverUrl,
            b: common_vendor.t(t.title),
            c: common_vendor.f(t.tags, (tag, k1, i1) => {
              return {
                a: common_vendor.t(tag),
                b: tag
              };
            }),
            d: t.id,
            e: common_vendor.o(($event) => goDetail(t.id), t.id)
          };
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/templates/index.js.map
