AI 需求洞察 PRD

SignalIdea — MVP 产品需求文档（简化版）

定位：面向美国/英语用户的 Evidence-first 竞品分析/需求洞察工具。
形态：Web App。
交互范式：用户自然语言输入 → 4阶段分析流程 → 结构化报告输出。
导出：HTML + PDF。
品牌：SignalIdea（黑白灰严谨风格）。

⸻

0. 背景 & 目的
	•	痛点：传统调研耗时高、证据分散、难复现；通用对话式 Agent 成本不稳、结果不可审计。
	•	目标：用模块化流水线把「证据抓取 → 结构化 → 报告组装」拆成阶段；让价值与成本对齐，结果可复现/可回滚/可审计。

⸻

1. 目标用户 & 使用场景
	•	P1 Indie / 顾问：低频但每次需拿得出手的证据化报告。
	•	P2 小团队 PM/增长/市场：1–3 小时内完成赛道扫描与差异点梳理。
	•	P3 研究/分析自由职业者：批量产出模板化报告，一键导出与交付。

核心场景：立项前对比、复盘对手、汇报材料、报价/定价参考。

⸻

2. 成功指标（MVP）
	•	时效：输入→Top-5 可见 P95 ≤ 60s；完整报告 P95 ≤ 5min。
	•	质量：功能对比准确率 ≥ 90%；用户体验洞察 ≥ 5 条。
	•	转化：Top-5 查看→付费分析 ≥ 15%；首单 $9 转化率 ≥ 40%。
	•	满意度：报告有用性评分 ≥ 4.2/5。

⸻

一、落地页（Landing）设计 PRD

1. 目标与原则
	•	目标：5 秒传达价值、0 阻力开跑、样例让人“看得见结果”、价格清晰且不打断试用。
	•	原则：首屏直接输入；样例报告在首屏下方；价格下沉到底部但随滚动可见（粘性 CTA）。

2. 信息架构（IA）
	1.	Hero（首屏直输）
	2.	Sample reports（腰部案例）
	3.	How it works（流程说明，标注 Free/Credits）
	4.	Pricing（精简卡） + FAQ
	5.	Footer（Legal / Docs / Status / Contact）

3. 版式与响应式
	•	栅格：12 列，内容区宽 1080–1200px。
	•	断点：sm≤640 / md≤768 / lg≤1024 / xl≤1280。
	•	主题：黑白灰严谨风格，不提供主题切换。

4. 组件与交互规格

4.1 Hero（直输）
	•	H1: "Evidence-based competitor analysis in minutes."
	•	Sub: "From market understanding to actionable insights with real user feedback."
	•	Input（必做）
	•	占位："Describe your product or market (e.g., 'AI meeting notes for sales teams')"
	•	行为：Enter / 点击 Analyze → 立即创建 Job 并跳转 /app/analysis/[id]
	•	辅助气泡：3–5 个可点击示例，点击即填充输入框
	•	校验：空值禁用；长度 10–280 字符
	•	信任条：Data-driven · User experience focused · Export ready
	•	微加载：点击 Analyze 后按钮变 Spinner ≤ 300ms

4.2 Sample reports（腰部）
	•	3–6 张卡片（可横向滑动）
	•	卡片字段：行业/场景名、Top-5 缩略（logo+名）、3 条 Reddit 标题（🔗）、Open sample 按钮
	•	打开方式：/sample/[slug] 内嵌 HTML 预览（导出置灰，需登录）

4.3 How it works

四块卡片（简洁图标 + 一句话）：
	1.	Intent Analysis — understand your market position (Free)
	2.	Top-5 Competitors — smart selection & review (Free)
	3.	Feature Experience — deep functionality & user feedback analysis (Paid)
	4.	Report Generation — comprehensive insights document (Paid)
底部条：Free preview, pay only for deep analysis.

4.4 Pricing（精简卡）
	•	Per-report、Starter、Pro 三卡，CTA：Start free / Buy now
	•	“First report $9” 角标显眼但不喧宾

4.5 FAQ（≥4 条）
	•	Where does evidence come from?
	•	What’s free vs. paid?
	•	How long does it take?
	•	Can I edit the Top-5 before paying?

4.6 Footer
	•	Links：Privacy / Terms / API Docs / Status / Contact
	•	版权与品牌字标（黑色系）

5. 视觉规范（黑白灰严谨风格）
	•	主色：纯黑 #000000；深灰 #1A1A1A；中灰 #4A4A4A
	•	文本：主 #000000，次 #4A4A4A；边框 #D0D0D0
	•	背景：白色 #FFFFFF；浅灰 #F8F8F8；卡片阴影 rgba(0,0,0,0.08)
	•	组件：输入框圆角 8px；卡片圆角 12px；按钮圆角 6px；极简线条 1px

6. SEO / 速度 / 可访问
	•	Title：SignalIdea – AI-powered, evidence-backed competitor reports
	•	Meta：value prop + 关键词（competitive analysis, Reddit evidence, pricing matrix）
	•	OG：Hero 截图；og:title/og:description/og:image 完整
	•	Schema：Organization + SoftwareApplication（简版）
	•	性能预算：FCP≤1.8s / LCP≤2.5s / CLS≤0.1 / JS ≤ 180KB（压缩后）
	•	a11y：可聚焦，按钮 aria-label 完整，对比度≥4.5:1

7. 埋点事件（事件名 / 触发 / 属性）
	•	hero_input_submit / 点击 Start / {text_len, sample_click:boolean}
	•	sample_open / 点击 Open sample / {slug}
	•	pricing_cta_click / 任一卡 CTA / {plan}
	•	faq_open / 展开某问题 / {q_id}

8. A/B 实验（首发即可做）
	•	E-01：首屏 CTA 文案（Start vs Generate a sample report）
	•	E-02：Pricing 卡顺序（Per-report 在左 vs 在中）
	•	E-03：“First report $9” 角标位置（Pricing 卡 vs Hero 下方小条）

Landing 验收
	•	首屏输入→≤1s 进入 Job 创建 loading，≤2.5s 到达 Pipeline 页面
	•	Sample 可预览（滚动/跳转），导出置灰
	•	Pricing 清晰可见且不阻断首屏输入

⸻

二、功能设计 PRD（简化4阶段流程）

用户输入后，进入分析流程；界面简洁直观，展示4个核心阶段。前2阶段免费预览；后2阶段付费深度分析。支持单次分析 $15 封顶。

1. 页面与布局
	•	路径：/app/analysis/[id]
	•	简化布局：顶部进度条 | 主内容区（居中） | 右侧状态面板（可折叠）
	•	状态同步：实时更新当前阶段进度

2. 阶段定义（4个核心阶段）

2.1 Intent Analysis（用户意图分析 - Free）
	•	Inputs：用户自然语言描述
	•	UI：展示分析结果卡片（产品定位、目标市场、核心需求）
	•	Output：analysis_scope.json
	•	Time：P95 ≤ 5s
	•	Actions：可编辑范围后重新分析

2.2 Top-5 Competitors（竞品识别 - Free）
	•	Inputs：analysis_scope + AI 搜索
	•	UI：Top-5 列表（名称、简介、官网、相关度评分）
	•	Actions：可编辑/替换竞品；"Proceed to Analysis" 按钮
	•	Output：top5.json
	•	Time：P95 ≤ 30s
	•	限制：每日 3 次免费预览

2.3 Feature Experience Analysis（功能体验分析 - Paid）
	•	Inputs：top5.json + 多源数据抓取
	•	UI：
		- 功能对比矩阵（可编辑）
		- 定价分析表
		- 用户反馈洞察（Reddit/评论）
		- 实际使用体验总结
	•	Actions：编辑功能点；标记重点；添加备注
	•	Output：experience_analysis.json
	•	Time：P95 ≤ 2min
	•	Cost：$9（首单优惠）/$15（标准价）

2.4 Report Generation（报告生成 - Included）
	•	Inputs：所有前序阶段数据
	•	UI：实时预览报告（简洁专业风格）
	•	Sections：
		- Executive Summary
		- Competitor Overview
		- Feature Comparison Matrix
		- User Experience Insights
		- Opportunities & Recommendations
	•	Actions：Export HTML / PDF
	•	Output：report.html / report.pdf
	•	Time：P95 ≤ 30s

3. 状态面板（右侧）
	•	进度：4阶段进度条，当前阶段高亮
	•	状态：analyzing | complete | error
	•	费用：显示当前费用（Free / $9 / $15）
	•	操作：Restart / Continue / Export 按钮

4. 费用与扣费（简化版）
	•	免费：前2阶段（Intent Analysis + Top-5）
	•	付费：Feature Experience Analysis + Report
	•	定价：$15/报告（首单 $9）
	•	支付：进入第3阶段时一次性支付
	•	失败保障：分析失败全额退款

5. 错误与空态
	•	网络 / 429：指数退避≤3 次；UI 显示“Retry now / View logs”
	•	冷门场景：候选不足 → 降级提示“结果有限，可改描述或添加种子 URL”
	•	证据抓取失败：建议缩小时间窗或切换主题关键词

6. 事件与数据契约（节选）

SSE Event

{
  "report_id": "rep_xxx",
  "stage": "evidence",
  "status": "running|approved|failed|stale",
  "metrics": {"queries": 24, "clusters": 5, "eta_sec": 45},
  "artifacts": []
}

Artifacts 元数据

{
  "id": "art_abc",
  "job_id": "rep_xxx",
  "stage_id": "evidence",
  "run_id": "run_yyy",
  "type": "json|csv|html|pdf",
  "url": "signed-url",
  "meta": {"hash":"...", "rows":128, "schema":"v1"},
  "prev_artifact_id": "art_prev"
}

账务流水（credit_txns）

{
  "id":"txn_1",
  "org_id":"org_1",
  "job_id":"rep_xxx",
  "stage":"evidence",
  "delta": -6,
  "reason":"prehold|final|rollback|discount",
  "cap_cents": 1900,
  "created_at":"..."
}

功能验收 Checklist（核心）
	•	Top-5 之前 0 扣费；首次付费前必有估算弹窗
	•	任一上游变更能正确击穿下游 → 显示 stale 与 Re-run
	•	Evidence≥8 链接；Matrix 5 家齐全；Report 可 HTML/PDF 导出
	•	SSE 三阶段（Evidence/Matrix/Report）均有 running/approved/failed 事件
	•	封顶开关生效；重跑折扣正确显示与记账

⸻

三、定价策略 PRD（结构 / 逻辑 / 风控 / 实验）

1. 价格结构（简化 MVP）
	•	单次报告：$15（完整分析 + 导出）
	•	首单优惠：$9（一次性新用户优惠）
	•	免费试用：每日 3 次 Top-5 预览
	•	订阅（后期）：验证 PMF 后考虑推出

2. 免费与付费边界
	•	免费部分：
		- Intent Analysis（意图分析）
		- Top-5 Competitors（竞品识别）
		- 每日限额 3 次
	•	付费部分：
		- Feature Experience Analysis（功能体验深度分析）
		- Report Generation（专业报告生成）
		- 无限制导出

3. 优惠策略
	•	新用户首单：$9（原价 $15）
	•	失败保障：分析失败全额退款
	•	缓存优化：24小时内相同查询享受缓存加速

4. 风控措施
	•	免费限制：需注册账号；每日 3 次上限
	•	速率限制：防止滥用的基础限流
	•	支付安全：标准 Stripe 集成

5. 成本控制
	•	目标成本：$3-4/报告（优化后）
	•	目标毛利：≥ 70%
	•	优化方向：智能缓存、模型选择优化、批量处理

6. MVP 定价实验
	•	A/B Test 1：$15 vs $12 标准价
	•	A/B Test 2：$9 vs $7 首单价
	•	监控指标：转化率、完成率、复购率

定价验收
	•	支付流程顺畅（<3 步完成）
	•	价格展示清晰透明
	•	退款流程明确

⸻

四、MVP 上线清单

1. 核心功能
	•	4阶段分析流程完整可用
	•	支付系统集成（Stripe）
	•	HTML/PDF 导出功能
	•	基础用户账号系统

2. 内容准备
	•	Landing 页面文案（英文）
	•	3-5 个示例报告
	•	FAQ 内容
	•	隐私条款和服务条款

3. 技术验收
	•	性能：页面加载 < 2s，分析完成 < 5min
	•	可靠性：错误处理和重试机制
	•	安全：数据加密，支付安全

4. 监控指标
	•	转化漏斗：访问 → 试用 → 付费
	•	质量指标：报告准确率，用户满意度
	•	成本指标：单报告成本，API 调用费用

⸻
