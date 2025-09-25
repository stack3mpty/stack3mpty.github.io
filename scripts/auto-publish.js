#!/usr/bin/env node

/**
 * Hexo博客自动化发布脚本
 * 功能：读取Markdown文件，自动分类，生成Hexo文章，发布到GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

class AutoPublisher {
    constructor() {
        this.config = {
            inputDir: './input/markdown',
            postsDir: './source/_posts',
            draftsDir: './source/_drafts',
            publicDir: './public',
            hexoConfig: './_config.yml'
        };
        
        this.ensureDirectories();
    }

    /**
     * 确保必要的目录存在
     */
    ensureDirectories() {
        const dirs = [
            this.config.inputDir,
            this.config.postsDir,
            this.config.draftsDir,
            './scripts',
            './input'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ 创建目录: ${dir}`);
            }
        });
    }

    /**
     * 读取输入目录中的所有Markdown文件
     */
    async readInputFiles() {
        const inputDir = this.config.inputDir;
        if (!fs.existsSync(inputDir)) {
            console.log('❌ 输入目录不存在，请创建并放入Markdown文件');
            return [];
        }

        const files = fs.readdirSync(inputDir)
            .filter(file => file.endsWith('.md'))
            .map(file => ({
                filename: file,
                path: path.join(inputDir, file),
                content: fs.readFileSync(path.join(inputDir, file), 'utf8')
            }));

        console.log(`📁 找到 ${files.length} 个Markdown文件`);
        return files;
    }

    /**
     * 处理单个Markdown文件
     */
    async processFile(file) {
        try {
            console.log(`\n🔄 处理文件: ${file.filename}`);
            
            // 解析Front Matter
            const parsed = matter(file.content);
            const frontMatter = parsed.data;
            const content = parsed.content;

            // 生成文章元数据
            const metadata = await this.generateMetadata(file.filename, content, frontMatter);
            
            // 生成Hexo文章
            const hexoPost = this.generateHexoPost(metadata, content);
            
            // 保存到posts目录
            const outputPath = path.join(this.config.postsDir, file.filename);
            fs.writeFileSync(outputPath, hexoPost);
            
            console.log(`✅ 已生成文章: ${outputPath}`);
            return { success: true, path: outputPath, metadata };
            
        } catch (error) {
            console.error(`❌ 处理文件失败: ${file.filename}`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 生成文章元数据（分类、标签等）
     */
    async generateMetadata(filename, content, existingFrontMatter) {
        const title = existingFrontMatter.title || this.extractTitle(content) || filename.replace('.md', '');
        const date = existingFrontMatter.date || new Date().toISOString();
        
        // 智能分类和标签生成
        const categories = await this.generateCategories(content, title);
        const tags = await this.generateTags(content, title);
        
        return {
            title,
            date,
            categories,
            tags,
            ...existingFrontMatter
        };
    }

    /**
     * 从内容中提取标题
     */
    extractTitle(content) {
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('# ')) {
                return line.replace('# ', '').trim();
            }
        }
        return null;
    }

    /**
     * 智能生成分类
     */
    async generateCategories(content, title) {
        // 简单的关键词匹配分类
        const categoryMap = {
            '技术': ['技术', '编程', '代码', '开发', '前端', '后端', 'JavaScript', 'Python', 'Java'],
            '教程': ['教程', '指南', '步骤', '如何', '学习', '入门'],
            '生活': ['生活', '日常', '感悟', '思考', '随笔'],
            '工具': ['工具', '软件', '推荐', '使用', '技巧'],
            '建站': ['建站', '博客', '网站', '部署', 'Hexo', 'GitHub']
        };

        const text = (title + ' ' + content).toLowerCase();
        const matchedCategories = [];

        for (const [category, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                matchedCategories.push(category);
            }
        }

        return matchedCategories.length > 0 ? matchedCategories : ['未分类'];
    }

    /**
     * 智能生成标签
     */
    async generateTags(content, title) {
        // 简单的关键词提取
        const commonWords = ['的', '是', '在', '有', '和', '与', '或', '但', '因为', '所以', '如果', '当', '这', '那', '一个', '一些', '所有', '每个'];
        
        const words = (title + ' ' + content)
            .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !commonWords.includes(word))
            .slice(0, 10);

        return [...new Set(words)]; // 去重
    }

    /**
     * 生成Hexo文章格式
     */
    generateHexoPost(metadata, content) {
        const frontMatter = [
            '---',
            `title: "${metadata.title}"`,
            `date: ${metadata.date}`,
        ];

        if (metadata.categories && metadata.categories.length > 0) {
            if (metadata.categories.length === 1) {
                frontMatter.push(`categories: ${metadata.categories[0]}`);
            } else {
                frontMatter.push(`categories: [${metadata.categories.join(', ')}]`);
            }
        }

        if (metadata.tags && metadata.tags.length > 0) {
            frontMatter.push(`tags: [${metadata.tags.join(', ')}]`);
        }

        // 添加其他元数据
        Object.keys(metadata).forEach(key => {
            if (!['title', 'date', 'categories', 'tags'].includes(key)) {
                frontMatter.push(`${key}: ${metadata[key]}`);
            }
        });

        frontMatter.push('---', '');
        
        return frontMatter.join('\n') + content;
    }

    /**
     * 执行Hexo构建
     */
    async buildHexo() {
        try {
            console.log('\n🔨 执行Hexo构建...');
            execSync('hexo generate', { stdio: 'inherit' });
            console.log('✅ Hexo构建完成');
            return true;
        } catch (error) {
            console.error('❌ Hexo构建失败:', error.message);
            return false;
        }
    }

    /**
     * 提交到GitHub
     */
    async commitToGitHub() {
        try {
            console.log('\n📤 提交到GitHub...');
            
            // 添加所有更改
            execSync('git add .', { stdio: 'inherit' });
            
            // 提交更改
            const commitMessage = `自动发布: ${new Date().toLocaleString()}`;
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            // 推送到远程仓库
            execSync('git push origin main', { stdio: 'inherit' });
            
            console.log('✅ 已推送到GitHub');
            return true;
        } catch (error) {
            console.error('❌ GitHub提交失败:', error.message);
            return false;
        }
    }

    /**
     * 主执行函数
     */
    async run() {
        console.log('🚀 开始自动化博客发布流程...\n');
        
        try {
            // 1. 读取输入文件
            const files = await this.readInputFiles();
            if (files.length === 0) {
                console.log('📝 没有找到Markdown文件，请将文件放入 input/markdown/ 目录');
                return;
            }

            // 2. 处理每个文件
            const results = [];
            for (const file of files) {
                const result = await this.processFile(file);
                results.push(result);
            }

            // 3. 统计结果
            const successCount = results.filter(r => r.success).length;
            console.log(`\n📊 处理完成: ${successCount}/${files.length} 个文件成功`);

            if (successCount > 0) {
                // 4. 构建Hexo
                const buildSuccess = await this.buildHexo();
                
                if (buildSuccess) {
                    // 5. 提交到GitHub
                    await this.commitToGitHub();
                    console.log('\n🎉 自动化发布完成！');
                }
            }

        } catch (error) {
            console.error('❌ 执行过程中出现错误:', error.message);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const publisher = new AutoPublisher();
    publisher.run();
}

module.exports = AutoPublisher;
