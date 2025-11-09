# AI 辅助开发 Prompt 记录

## 项目概述

**项目名称**：论文Deadline倒数
**项目描述**：单页面倒计时网站，帮助用户跟踪论文进度和截止日期
**技术栈**：HTML, CSS, JavaScript

## 1. 典型 Prompt 记录

### 1.1 页面结构设计

**Prompt**：
```
请帮我设计一个论文倒计时网站的HTML结构，包含：
1. 一个表单，用于输入论文字数目标和截止日期
2. 一个醒目的倒计时牌，显示剩余天、时、分、秒
3. 一个进度条区域，显示已完成字数和每日应写字数
4. 一个更新进度的输入框和按钮
确保使用语义化HTML标签，并为所有元素添加合适的id。
```

**响应要点**：
- 使用语义化标签（header, section, form等）
- 为所有可交互元素添加唯一ID
- 表单使用合适的输入类型（number, date）
- 默认值设置为10000字

### 1.2 样式设计与实现

**Prompt**：
```
为论文倒计时网站设计现代美观的CSS样式，要求：
1. 渐变背景色
2. 卡片式布局，带有圆角和阴影
3. 醒目的倒计时显示
4. 动画效果（悬停、加载等）
5. 响应式设计，适配不同屏幕尺寸
使用CSS变量方便维护，采用Flexbox进行布局。
```

**响应要点**：
- 使用linear-gradient创建渐变背景
- 卡片式设计，包含阴影和圆角
- 响应式布局，适配移动端
- 交互动画效果
- 视觉层次分明

### 1.3 JavaScript功能实现

**Prompt**：
```
实现论文倒计时网站的JavaScript功能，包括：
1. 表单数据存储到localStorage
2. 动态倒计时计算和显示
3. 进度条更新和每日应写字数计算
4. 浏览器通知功能
5. 页面加载时恢复上次保存的数据
注意使用模块化的代码结构，并添加适当的错误处理。
```

**响应要点**：
- localStorage数据持久化
- 倒计时实时更新
- 进度计算和显示
- 通知权限请求和管理
- 错误处理和边界情况处理

## 2. 核心功能重构案例

### 2.1 倒计时功能优化

**原始实现**：
```javascript
// 简单的倒计时更新函数
function updateCountdown() {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diff = deadline - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    daysElement.textContent = days;
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
}

setInterval(updateCountdown, 1000);
```

**Prompt**：
```
请重构倒计时功能，要求：
1. 添加边界情况处理（截止日期已过）
2. 从localStorage获取数据，确保数据持久化
3. 优化性能，避免不必要的DOM操作
4. 提高代码可读性和可维护性
```

**重构后实现**：
```javascript
function startCountdown() {
    function updateCountdown() {
        const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
        if (!savedData) return;
        
        const deadline = new Date(savedData.deadlineDate);
        const now = new Date();
        const diff = deadline - now;
        
        if (diff <= 0) {
            daysElement.textContent = '0';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        // 计算天、时、分、秒
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // 更新显示
        daysElement.textContent = days;
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // 立即更新一次
    updateCountdown();
    
    // 每秒更新一次
    setInterval(updateCountdown, 1000);
}
```

### 2.2 AI每日目标计算功能

**原始需求**：
需要计算每日应写字数，基于剩余字数和剩余天数，向上取整。

**Prompt**：
```
请实现一个AI辅助的每日目标计算功能，要求：
1. 计算公式：每日应写 = 剩余字数 / 剩余天数，向上取整
2. 剩余字数 = 总字数 - 已完成字数
3. 处理边界情况（剩余天数为0或负数）
4. 将计算结果保存到localStorage
5. 更新UI显示每日目标
```

**实现代码**：
```javascript
// AI辅助的每日目标计算
function updateProgressDisplay() {
    const savedData = JSON.parse(localStorage.getItem('thesisDeadlineData'));
    if (!savedData) return;
    
    const { targetWords, deadlineDate, completedWords } = savedData;
    
    // 更新已完成字数
    completedWordsElement.textContent = completedWords;
    
    // 计算剩余天数
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diff = deadline - now;
    const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    // AI计算每日应写字数：剩余字数 / 剩余天数，向上取整
    const remainingWords = Math.max(0, targetWords - completedWords);
    const dailyTarget = remainingDays > 0 ? Math.ceil(remainingWords / remainingDays) : 0;
    dailyTargetElement.textContent = dailyTarget;
    
    // 更新进度条
    const progressPercentage = Math.min(100, Math.round((completedWords / targetWords) * 100));
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage}%`;
    
    // 更新本地存储
    savedData.dailyTarget = dailyTarget;
    localStorage.setItem('thesisDeadlineData', JSON.stringify(savedData));
}
```

## 3. 开发反思与经验总结

### 3.1 有效Prompt的特点

1. **具体明确**：提供详细的功能需求和技术要求
2. **分步骤引导**：将复杂任务拆分为多个简单步骤
3. **提供上下文**：包含项目背景和现有代码状态
4. **指定输出格式**：明确期望的代码结构和风格
5. **包含约束条件**：说明技术限制和性能要求

### 3.2 AI辅助开发的最佳实践

1. **模块化设计**：将功能拆分为独立的函数，便于AI理解和生成
2. **渐进式迭代**：从小功能开始，逐步扩展和完善
3. **代码审查**：仔细检查AI生成的代码，确保逻辑正确和安全
4. **错误处理**：主动要求添加错误处理和边界情况检查
5. **文档化**：记录开发过程中的Prompt和解决方案

### 3.3 未来改进方向

1. 添加数据可视化图表展示写作进度趋势
2. 实现多任务管理功能，支持多个论文项目
3. 添加提醒功能，可自定义提醒时间和频率
4. 优化移动端体验，添加手势操作支持
5. 实现数据导出功能，便于备份和分享