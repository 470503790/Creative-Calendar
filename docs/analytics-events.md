# Analytics Event Dictionary

`apps/miniapp/utils/analytics.ts` exposes a light-weight analytics shim for the mini app. The helper ensures every call receives a consistent envelope and prints the payload to the console for manual verification.

## Common Envelope

| Field | Description |
| --- | --- |
| `event` | Event identifier from `AnalyticsEvents`. |
| `timestamp` | ISO string recorded when `track()` is invoked. |
| `appVersion` | Static mock version (`0.1.0`). |
| `platform` | Platform inferred from `process.env.UNI_PLATFORM`, `uni.getSystemInfoSync()`, or `navigator.userAgent`. |
| `pagePath` | Current route when available. |
| `…payload` | Context-specific fields supplied by the caller. |

Example output:

```ts
track(AnalyticsEvents.APP_LAUNCH)
// [analytics] { event: 'app_launch', timestamp: '2025-03-18T08:00:00.000Z', appVersion: '0.1.0', platform: 'mp-weixin', pagePath: '/pages/index/index' }
```

## Event Catalogue

| Event | Description | Typical Payload Fields |
| --- | --- | --- |
| `app_launch` | App boot completed. | — |
| `home_open_notifications` | Tap notification icon on the home page. | — |
| `home_open_search` | Jump to search/templates tab from home. | — |
| `home_toggle_theme` | Toggle theme button on home top bar. | `theme` (`'light' \\| 'dark'`) |
| `home_create_entry` | Navigate to editor from a home CTA. | `source` |
| `home_view_template_detail` | Open a template detail from the home carousel. | `templateId`, `source` |
| `home_view_templates` | Jump from home to the templates tab. | `source` |
| `home_view_works` | Jump from home to the works tab. | `source` |
| `home_continue_edit` | Continue editing a recent project. | `projectId`, `source` |
| `home_refresh` | Manual refresh from home (empty/error/recent modules). | `source` |
| `templates_search` | Submit template search query. | `query`, `resultCount` |
| `templates_clear_search` | Clear the search keyword. | `previous`, `hasFilters` |
| `templates_filter_toggle` | Toggle a template filter chip. | `filterKey`, `value`, `isActive` |
| `templates_reset_filters` | Reset all template filters. | `source`, `previousFilters` |
| `templates_view_detail` | Open template detail from templates page. | `templateId`, `source` |
| `templates_go_create` | CTA to jump from templates list to editor. | `source` |
| `templates_go_works` | CTA to jump from templates list to works tab. | `source` |
| `templates_retry` | Retry loading templates after error/offline. | `status` |
| `template_detail_use` | Generate project from a template detail page. | `templateId`, `sizeKey` |
| `template_detail_toggle_favorite` | Toggle favorite on template detail. | `templateId`, `isFavorite` |
| `template_detail_select_size` | Select a template size option. | `templateId`, `sizeKey` |
| `template_detail_back_to_list` | Return to templates list from detail. | `templateId` |
| `template_detail_retry` | Retry loading template detail. | `templateId`, `status` |
| `works_create` | Start a new project from works page. | `source` |
| `works_continue_edit` | Re-open existing project from works page. | `projectId`, `source` |
| `works_preview` | Preview a project card. | `projectId`, `source` |
| `works_reload` | Retry loading works list. | `status` |
| `settings_theme_toggle` | Toggle dark mode in settings. | `theme` |
| `settings_language_change` | Update interface language. | `value`, `label` |
| `settings_data_source_change` | Choose data source in settings. | `value`, `label`, `enabled` |
| `settings_notifications_toggle` | Toggle notification switches. | `key`, `enabled` |
| `settings_labs_toggle` | Toggle lab experiment switches. | `key`, `enabled` |
| `settings_privacy_toggle` | Toggle privacy-related switches. | `key`, `enabled` |
| `settings_account_manage` | Tap “管理账户”. | — |
| `settings_feedback` | Tap “意见反馈”. | — |
| `settings_version` | Tap version information. | `version` |
| `settings_agreement_view` | Open service/privacy agreement dialog. | `agreement` |

## Usage Notes

* `track()` is side-effect free aside from console output; no network requests are performed in the mock environment.
* The helper automatically enriches payloads with common metadata, so callers only need to supply event-specific context.
* Respect the privacy toggle when moving towards real analytics backends—current implementation focuses on instrumentation placeholders.
