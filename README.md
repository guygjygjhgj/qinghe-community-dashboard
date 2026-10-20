# 青禾社区 · 认知监测看板

日常入口默认接收已登录账号的共享资料。公开页面的“进入社区工作台”按钮打开管理员专属入口；居民资料不会直接发布在 GitHub Pages 中。

社区入口：https://qinghe-registration-review.hebaixuan01111123.chatgpt.site/monitor
居民入口：https://guygjygjhgj.github.io/qinghe-community-web/

账号资料、测评和业务操作由共享服务验证身份并保存。看板每2秒检查更新；首次任务按逐题作答呈现，日常业务只在具备明确依据时评分，缺失记录不补零，不生成临床诊断。普通聊天统计使用事件，管理端不展示私聊正文。

保留的旧参考资料只能通过明确的 `?reference=1` 入口查看，其合成来源标识不改写，不计入日常居民监测。原有版面、样式文件和图片资源保持不变。

本机模型进程运行时可回传分析结果；停止后保留原记录与待处理状态，不宣称全天候推理。

检查：`node --test tests/monitor-access.test.mjs`。网页采用 GitHub Pages 的 main 分支根目录发布。

## 线下视空间评估（2026-10-20）

入口为 `#offline`；沿用当前资料模式，`?reference=1#offline` 显示明确标注的合成课程案例。主看板根据同一个居民编号显示线下记录摘要和两项最近成绩。原有七维活动观察分、九项任务、登录和共享接口保持原有逻辑。

- 青年协助者：登记团队、培训状态与专业联系人；安排线下陪同。
- 测评安排：关联居民、时间、地点、协助者、版本与语言。
- 专业评分登记：记录 RBANS 图形临摹、线条方向原始分、施测人、培训/资格档案、评分手册及纸质答卷编号；知情同意、材料、施测条件分别记录。
- 专业核对：据实登记核对人、时间与依据。它是工作人员录入的核对记录，不是系统认证或执业资格验证。
- 趋势：仅已登记核对且视力、手部条件适宜、无额外协助的成绩进入比较。同居民、版本、语言、评分手册与条件才能连线；空缺留空。原始分变化不等于可靠认知变化或诊断。
- JSON 完整备份/恢复、去重及冲突阻断；CSV 导出当前居民成绩；打印当前模块。表格和图表数字均来自同一记录对象。

本轮没有新增云端存储接口。新增线下记录保存在当前浏览器的 `qinghe-offline-spatial-v1:reference` 或 `:live`，两种模式隔离，不自动跨设备同步。JSON 可转移档案；纸质答卷仍按答卷编号保存在机构原档案，不上传题本或医疗文件。清除浏览器资料会清除本机记录，请导出备份。

专业人员应使用合法、适用且经过验证的材料，按对应手册施测评分。本模块不复制 RBANS 题目，不生成常模指数，也不声称此录入界面本身已通过临床验证。

方法来源：
- https://www.pearsonassessments.com/store/usassessments/en/p/repeatable-battery-for-the-assessment-of-neuropsychological-status-update/100000726
- https://www.pearsonclinical.ca/en/digital-solutions/telepractice/telepractice-and-the-rbans.html

验证：`node --test tests/*.test.mjs`。包括原登录保护、缺失/零分、条件与版本隔离、重复导入和CSV导出；本机另进行了青年档案→安排→评分→核对→趋势→证据→JSON往返的浏览器验收，以及1440、1280与390像素布局检查。
