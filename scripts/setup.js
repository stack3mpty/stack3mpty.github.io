#!/usr/bin/env node

/**
 * 自动化博客发布系统初始化脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupManager {
    constructor() {
        this.config = {
            projectRoot: process.cwd(),
            hexoConfig: {
                title: "stack3mpty's blog",
                subtitle: "个人博客",
                description: "基于Hexo的自动化博客",
                author: "stack3mpty",
                language: "zh-CN",
                timezone: "Asia/Shanghai",
                url: "https://stack3mpty.github.io",
                permalink: ":year/:month/:day/:title/",
                theme: "fluid"
            }
        };
    }

    /**
     * 创建必要的目录结构
     */
    createDirectories() {
        console.log('📁 创建目录结构...');
        
        const directories = [
            'source/_posts',
            'source/_drafts',
            'source/_pages',
            'source/_data',
            'themes',
            'scripts',
            'input/markdown',
            'input/images',
            'public',
            '.github/workflows'
        ];

        directories.forEach(dir => {
            const fullPath = path.join(this.config.projectRoot, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`  ✅ 创建目录: ${dir}`);
            } else {
                console.log(`  📁 目录已存在: ${dir}`);
            }
        });
    }

    /**
     * 创建Hexo配置文件
     */
    createHexoConfig() {
        console.log('⚙️ 创建Hexo配置文件...');
        
        const configContent = `# Hexo配置文件
# 网站信息
title: ${this.config.hexoConfig.title}
subtitle: ${this.config.hexoConfig.subtitle}
description: ${this.config.hexoConfig.description}
author: ${this.config.hexoConfig.author}
language: ${this.config.hexoConfig.language}
timezone: ${this.config.hexoConfig.timezone}

# URL设置
url: ${this.config.hexoConfig.url}
root: /
permalink: ${this.config.hexoConfig.permalink}
permalink_defaults:
pretty_urls:
  trailing_index: true
  trailing_html: true

# 目录设置
source_dir: source
public_dir: public
tag_dir: tags
archive_dir: archives
category_dir: categories
code_dir: downloads/code
i18n_dir: :lang
skip_render:

# 写作设置
new_post_name: :title.md
default_layout: post
titlecase: false
external_link:
  enable: true
  field: site
  exclude: ''
filename_case: 0
render_drafts: false
post_asset_folder: false
relative_link: false
future: true
highlight:
  enable: true
  line_number: true
  auto_detect: false
  tab_replace: ''
  wrap: true
  hljs: false

# 分类和标签
default_category: uncategorized
category_map:
tag_map:

# 日期/时间格式
date_format: YYYY-MM-DD
time_format: HH:mm:ss

# 分页设置
per_page: 10
pagination_dir: page

# 主题设置
theme: ${this.config.hexoConfig.theme}

# 部署设置
deploy:
  type: git
  repo: https://github.com/stack3mpty/stack3mpty.github.io.git
  branch: main

# 插件设置
plugins:
  - hexo-generator-feed
  - hexo-generator-sitemap
  - hexo-generator-search
  - hexo-renderer-marked
  - hexo-renderer-stylus

# 搜索设置
search:
  path: local-search.xml
  field: post
  content: true
  format: html

# 自动分类设置
auto_category:
  enable: true
  depth: 2

# 自动标签设置
auto_tag:
  enable: true
  max_tags: 10
`;

        const configPath = path.join(this.config.projectRoot, '_config.yml');
        fs.writeFileSync(configPath, configContent);
        console.log('  ✅ 已创建 _config.yml');
    }

    /**
     * 创建示例Markdown文件
     */
    createSampleFiles() {
        console.log('📝 创建示例文件...');
        
        // 示例Markdown文件
        const sampleMarkdown = `---
title: 欢迎使用自动化博客发布系统
date: ${new Date().toISOString()}
categories: [教程]
tags: [博客, 自动化, Hexo]
---

# 欢迎使用自动化博客发布系统

这是一个示例文章，展示了自动化博客发布系统的功能。

## 功能特点

- 🤖 自动分类和标签生成
- 📝 Markdown文件自动处理
- 🚀 一键发布到GitHub Pages
- 🔄 支持批量处理

## 使用方法

1. 将Markdown文件放入 \`input/markdown/\` 目录
2. 运行 \`npm run publish\` 命令
3. 系统会自动处理并发布文章

## 注意事项

- 确保Markdown文件格式正确
- 可以手动设置Front Matter
- 支持图片自动处理

---

*这是由自动化系统生成的示例文章*
`;

        const samplePath = path.join(this.config.projectRoot, 'input/markdown', '示例文章.md');
        fs.writeFileSync(samplePath, sampleMarkdown);
        console.log('  ✅ 已创建示例Markdown文件');

        // 创建README文件
        const readmeContent = `# 自动化博客发布系统

## 项目简介

这是一个基于Hexo的自动化博客发布系统，支持：

- 📝 自动读取Markdown文件
- 🤖 智能分类和标签生成
- 🚀 自动发布到GitHub Pages
- 🔄 支持批量处理

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 初始化系统

\`\`\`bash
npm run setup
\`\`\`

### 3. 发布文章

将Markdown文件放入 \`input/markdown/\` 目录，然后运行：

\`\`\`bash
npm run publish
\`\`\`

## 目录结构

\`\`\`
├── input/markdown/     # 输入Markdown文件
├── source/_posts/      # Hexo文章目录
├── scripts/           # 自动化脚本
├── public/            # 构建输出目录
└── .github/workflows/ # GitHub Actions
\`\`\`

## 配置说明

### 环境变量

- \`OPENAI_API_KEY\`: OpenAI API密钥（可选，用于AI分类）

### 自定义配置

编辑 \`scripts/auto-publish.js\` 文件中的配置选项。

## 使用方法

### 方法1：本地发布

1. 将Markdown文件放入 \`input/markdown/\` 目录
2. 运行 \`npm run publish\`
3. 系统会自动处理并发布

### 方法2：GitHub Actions

1. 将Markdown文件推送到 \`input/markdown/\` 目录
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
`;

        const readmePath = path.join(this.config.projectRoot, 'README.md');
        fs.writeFileSync(readmePath, readmeContent);
        console.log('  ✅ 已创建README.md');
    }

    /**
     * 安装Hexo主题
     */
    installTheme() {
        console.log('🎨 安装Hexo主题...');
        
        try {
            // 检查是否已安装主题
            const themePath = path.join(this.config.projectRoot, 'themes', this.config.hexoConfig.theme);
            if (fs.existsSync(themePath)) {
                console.log('  📁 主题已存在');
                return;
            }

            // 安装Fluid主题
            execSync(`git clone https://github.com/fluid-dev/hexo-theme-fluid.git themes/${this.config.hexoConfig.theme}`, {
                stdio: 'inherit'
            });
            console.log('  ✅ 主题安装完成');
        } catch (error) {
            console.log('  ⚠️ 主题安装失败，请手动安装');
            console.log(`  💡 运行: git clone https://github.com/fluid-dev/hexo-theme-fluid.git themes/${this.config.hexoConfig.theme}`);
        }
    }

    /**
     * 创建Git忽略文件
     */
    createGitignore() {
        console.log('📄 创建.gitignore文件...');
        
        const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# Hexo
public/
.deploy_git/
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Temporary files
tmp/
temp/
`;

        const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
        fs.writeFileSync(gitignorePath, gitignoreContent);
        console.log('  ✅ 已创建 .gitignore');
    }

    /**
     * 主执行函数
     */
    async run() {
        console.log('🚀 开始初始化自动化博客发布系统...\n');
        
        try {
            this.createDirectories();
            this.createHexoConfig();
            this.createSampleFiles();
            this.installTheme();
            this.createGitignore();
            
            console.log('\n🎉 初始化完成！');
            console.log('\n📋 下一步操作：');
            console.log('1. 将Markdown文件放入 input/markdown/ 目录');
            console.log('2. 运行 npm run publish 开始发布');
            console.log('3. 或者直接推送到GitHub触发自动发布');
            
        } catch (error) {
            console.error('❌ 初始化失败:', error.message);
            process.exit(1);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const setup = new SetupManager();
    setup.run();
}

module.exports = SetupManager;
