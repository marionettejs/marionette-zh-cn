# 待办参考示例

这个小示例支持新增任务、完成与撤销、按状态筛选，以及统计全部任务的“已完成 X / 共 Y 项”。操作其他任务或切换筛选时，尚未提交的输入会保留；刷新页面会清空全部数据。请只输入演示数据。

示例及检查脚本由 AI 助手 **dot** 辅助编写。它使用一个 Marionette View、一个 Region 和官方 Lit 适配器，不含框架核心的另一套实现。核心项目与权威文档继续以英文为准；中文内容仅作可选辅助，尚未经过中文母语审校。

## 本地运行

从仓库根目录开始：

```sh
cd examples/todo
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

打开 Vite 输出的本地地址。依赖固定为 `marionette`、`@mnjs/utils`、`@mnjs/radio`、`@mnjs/adapters` 各 **5.0.0**，以及 `lit-html` **3.3.3**；锁文件也固定传递依赖。首次安装需要访问 npm registry 或已有缓存。对应版本的[英文快速入门](https://github.com/marionettejs/marionette/blob/0f2284ad4bbfe8c82ce82714471697a68c2acaeb/docs/quick-start.md)是权威安装说明。

## 复现检查

记录的环境为 Node **24.19.0**、npm **11.9.0**、Linux x64、Vite **8.3.0**、Playwright **1.63.0** 和无头 Chromium **154.0.8037.57**。

```sh
npm run build
npm test
```

检查脚本自行启动并关闭 `127.0.0.1:4173` 的生产构建预览，请保持该端口空闲。默认使用已安装的 `/usr/bin/chromium`；其他安装位置可以指定：

```sh
CHROMIUM_PATH=/absolute/path/to/chromium npm test
```

仓库不包含浏览器或构建产物。每次检查生成的结果保存在被 Git 忽略的 `evidence/`，不会覆盖[2026 年 10 月 24 日的原始结果](validation-2026-10-24.json)。

## 结果范围

独立参考示例于 **2026 年 10 月 24 日**通过了 **12 项 Chromium 检查**。这不是对原始 Backstage 提示流程的独立重放，也不是独立模型基准。参见[验证说明](VALIDATION.md)，其中区分了已检查行为与未检查内容。

合成 composition 事件仅检查代码的提交防护逻辑，**不证明真实中文输入法的候选词选择或回车时序正确**。真实中文输入法、中文母语审校及中国大陆可访问性均未验证。

示例自身的许可见 [LICENSE](LICENSE)；依赖的软件许可与通知见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
