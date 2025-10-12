"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mockApi = require("../../utils/mock-api.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "detail",
  setup(__props) {
    const id = common_vendor.ref("");
    const detail = common_vendor.ref(null);
    const tpl = common_vendor.computed(() => detail.value);
    common_vendor.onLoad(async (q) => {
      id.value = (q == null ? void 0 : q.id) || "";
      if (!id.value)
        return;
      const fetched = await utils_mockApi.getTemplateDetail(id.value);
      detail.value = fetched || null;
    });
    async function useThis() {
      if (!id.value)
        return;
      const { projectId } = await utils_mockApi.createProjectFromTemplate(id.value);
      common_vendor.index.navigateTo({ url: `/pages/editor/index?pid=${projectId}` });
    }
    function fav() {
      common_vendor.index.showToast({ title: "已收藏（mock）", icon: "none" });
    }
    function goTemplates() {
      common_vendor.index.switchTab({ url: "/pages/templates/index" });
    }
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: tpl.value
      }, tpl.value ? {
        b: tpl.value.coverUrl,
        c: common_vendor.t(tpl.value.title),
        d: common_vendor.f(tpl.value.tags, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag),
            b: tag
          };
        }),
        e: common_vendor.o(useThis),
        f: common_vendor.o(fav),
        g: common_vendor.f(tpl.value.sizeHints, (s, k0, i0) => {
          return {
            a: common_vendor.t(s),
            b: s
          };
        }),
        h: common_vendor.t(((_b = (_a = detail.value) == null ? void 0 : _a.author) == null ? void 0 : _b.name) || "未知")
      } : {
        i: common_vendor.o(goTemplates)
      });
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/templates/detail.js.map
