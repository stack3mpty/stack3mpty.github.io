# 自动化博客发布系统

## 项目简介

这是一个基于Hexo的自动化博客发布系统，支持：

- 📝 自动读取Markdown文件
- 🤖 智能分类和标签生成
- 🚀 自动发布到GitHub Pages
- 🔄 支持批量处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化系统

```bash
npm run setup
```

### 3. 发布文章

将Markdown文件放入 `input/markdown/` 目录，然后运行：

```bash
npm run publish
```

## 目录结构

```
├── input/markdown/     # 输入Markdown文件
├── source/_posts/      # Hexo文章目录
├── scripts/           # 自动化脚本
├── public/            # 构建输出目录
└── .github/workflows/ # GitHub Actions
```

## 配置说明

### 环境变量

- `OPENAI_API_KEY`: OpenAI API密钥（可选，用于AI分类）

### 自定义配置

编辑 `scripts/auto-publish.js` 文件中的配置选项。

## 使用方法

### 方法1：本地发布

1. 将Markdown文件放入 `input/markdown/` 目录
2. 运行 `npm run publish`
3. 系统会自动处理并发布

### 方法2：GitHub Actions

1. 将Markdown文件推送到 `input/markdown/` 目录
2. GitHub Actions会自动触发发布流程

## 注意事项

- 确保Markdown文件格式正确
- 支持Front Matter元数据
- 图片文件会自动处理
- 支持批量发布

## 故障排除

如果遇到问题，请检查：

1. Node.js版本是否 >= 14.0.0
2. 依赖是否正确安装
3. Git配置是否正确
4. GitHub权限是否足够

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
