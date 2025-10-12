"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mockApi = require("../../utils/mock-api.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const q = common_vendor.ref("");
    const raw = common_vendor.ref([]);
    const list = common_vendor.computed(() => {
      if (!q.value)
        return raw.value;
      const keyword = q.value.trim();
      return raw.value.filter(
        (t) => t.title.includes(keyword) || t.tags.some((x) => x.includes(keyword))
      );
    });
    common_vendor.onMounted(async () => {
      const templates = await utils_mockApi.getTemplates();
      raw.value = templates || [];
    });
    function doSearch() {
    }
    function goDetail(id) {
      if (!id)
        return;
      common_vendor.index.navigateTo({ url: `/pages/templates/detail?id=${id}` });
    }
    function goCreate() {
      common_vendor.index.switchTab({ url: "/pages/editor/index" });
    }
    function goWorks() {
      common_vendor.index.switchTab({ url: "/pages/works/index" });
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
        }),
        e: common_vendor.o(goCreate),
        f: common_vendor.o(goWorks)
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/templates/index.js.map
