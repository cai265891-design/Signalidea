# AI Pipeline 设计文档

## 🎨 设计理念

基于现代 AI 产品的交互模式,重新设计了 Pipeline 界面,主要特点:

### 1. **简化布局**
- 采用两栏设计:左侧历史记录 + 主内容区
- 顶部集成 Credits 显示和用户操作
- 去除复杂的三栏布局,聚焦核心内容

### 2. **AI 对话式交互**
- 类似 ChatGPT 的卡片展开/收起设计
- 支持流式文本输出效果
- 清晰的状态指示器

### 3. **现代视觉风格**
- 渐变背景和卡片设计
- 流畅的动画过渡
- 彩色状态边框指示

## 📦 新组件架构

### AIPipelineLayout
全屏布局组件,包含:
- 左侧 History 面板
- 顶部导航栏(标题 + Credits + 用户头像)
- 主内容区域

```tsx
<AIPipelineLayout
  credits={68}
  history={historyItems}
  onNewAction={handleNewAction}
>
  {children}
</AIPipelineLayout>
```

### AIStageCard
可展开的阶段卡片:
- 4 种状态: pending, running, completed, active
- 彩色左边框指示状态
- 可选内容展开/收起
- 状态图标动画

```tsx
<AIStageCard
  title="Intent Clarifier"
  status="completed"
  badge="Free"
  isExpanded={true}
  onToggle={() => {}}
  content={<YourContent />}
/>
```

### AIContentSection
内容容器组件:
- 标题和副标题支持
- 内容区域样式统一

### AINumberedList
编号列表组件:
- 圆形数字标记
- 标题 + 内容结构
- 适合展示分析结果

### AIStreamingText
流式文本组件:
- 支持打字机光标效果
- 适合展示 AI 生成过程

## 🎯 状态系统

### 卡片状态
```typescript
type StageStatus = "pending" | "running" | "completed" | "active";
```

**视觉映射**:
- `pending`: 灰色左边框 + Circle 图标
- `running`: 蓝色左边框 + 旋转 Loader 图标
- `completed`: 绿色左边框 + CheckCircle 图标
- `active`: 紫色左边框 + Sparkles 图标

### 历史记录状态
```typescript
type HistoryStatus = "success" | "running" | "failed";
```

## 🎨 视觉设计

### 颜色系统
```css
/* 背景 */
bg-gradient-to-br from-gray-50 to-gray-100

/* 状态颜色 */
pending: gray-300
running: blue-500
completed: green-500
active: purple-500

/* Credits 标签 */
bg-gradient-to-r from-blue-100 to-purple-100
```

### 圆角规范
- 卡片: `rounded-[18px]`
- 按钮: `rounded-xl` 或 `rounded-full`
- 徽章: `rounded-full`

## 📱 响应式布局

- 桌面: 左侧 320px History + 剩余空间内容
- 平板: History 可折叠
- 手机: History 改为底部抽屉

## 🔄 交互流程

1. **初始加载**: 显示历史记录列表
2. **点击 New Action**: 创建新的分析流程
3. **阶段展开**: 点击卡片展开/收起内容
4. **实时更新**: Running 状态显示流式输出
5. **完成提示**: 成功后显示 toast 通知

## 🆕 与旧版对比

### 旧版本 (Legacy)
- 三栏布局: Scope + Pipeline + Inspector
- 复杂的配置面板
- 多个独立组件

### 新版本 (AI Style)
- 两栏布局: History + Content
- 简化的交互流程
- 统一的卡片设计
- 更清晰的状态展示

## 🚀 使用示例

### 基础用法
```tsx
import {
  AIPipelineLayout,
  AIStageCard,
  AINumberedList
} from "~/components/pipeline";

export default function PipelinePage() {
  return (
    <AIPipelineLayout credits={68} history={[]}>
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <AIStageCard
          title="分析阶段"
          status="running"
          badge="Free"
          content={
            <AINumberedList items={analysisResults} />
          }
        />
      </div>
    </AIPipelineLayout>
  );
}
```

### 流式输出效果
```tsx
<AIStageCard
  title="AI 分析中..."
  status="running"
  content={
    <AIStreamingText
      text="正在分析竞品..."
      isStreaming={true}
    />
  }
/>
```

## 📝 未来扩展

- [ ] 支持拖拽重排历史记录
- [ ] 添加搜索和过滤功能
- [ ] 支持导出单个阶段结果
- [ ] WebSocket 实时状态更新
- [ ] 多语言支持
- [ ] 暗色主题

## 🎯 设计原则

1. **简洁优先**: 减少视觉噪音,聚焦核心内容
2. **状态清晰**: 用颜色和图标明确表达状态
3. **流畅交互**: 自然的展开/收起动画
4. **信息层级**: 重要信息突出显示
5. **响应式**: 适配不同设备和屏幕尺寸
