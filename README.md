# 青禾社区 · 认知监测看板

日常入口默认接收已登录账号的共享资料。公开页面的“进入社区工作台”按钮打开管理员专属入口；居民资料不会直接发布在 GitHub Pages 中。

社区入口：https://qinghe-registration-review.hebaixuan01111123.chatgpt.site/monitor
居民入口：https://guygjygjhgj.github.io/qinghe-community-web/

账号资料、测评和业务操作由共享服务验证身份并保存。看板每2秒检查更新；首次任务按逐题作答呈现，日常业务只在具备明确依据时评分，缺失记录不补零，不生成临床诊断。普通聊天统计使用事件，管理端不展示私聊正文。

保留的旧参考资料只能通过明确的 `?reference=1` 入口查看，其合成来源标识不改写，不计入日常居民监测。原有版面、样式文件和图片资源保持不变。

本机模型进程运行时可回传分析结果；停止后保留原记录与待处理状态，不宣称全天候推理。

检查：`node --test tests/monitor-access.test.mjs`。网页采用 GitHub Pages 的 main 分支根目录发布。
