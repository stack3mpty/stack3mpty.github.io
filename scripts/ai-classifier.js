/**
 * AI智能分类器
 * 功能：使用AI技术智能分析文章内容，生成分类和标签
 */

const axios = require('axios');

class AIClassifier {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        this.baseURL = options.baseURL || 'https://api.openai.com/v1';
        this.model = options.model || 'gpt-3.5-turbo';
        this.enabled = !!this.apiKey;
    }

    /**
     * 分析文章内容并生成分类和标签
     */
    async classifyContent(title, content) {
        if (!this.enabled) {
            console.log('⚠️ AI分类器未启用，使用基础分类');
            return this.basicClassification(title, content);
        }

        try {
            const prompt = this.buildClassificationPrompt(title, content);
            const response = await this.callOpenAI(prompt);
            return this.parseAIResponse(response);
        } catch (error) {
            console.error('❌ AI分类失败，使用基础分类:', error.message);
            return this.basicClassification(title, content);
        }
    }

    /**
     * 构建分类提示词
     */
    buildClassificationPrompt(title, content) {
        return `请分析以下博客文章，并为其生成合适的分类和标签。

文章标题: ${title}
文章内容: ${content.substring(0, 1000)}...

请按照以下JSON格式返回结果：
{
    "categories": ["分类1", "分类2"],
    "tags": ["标签1", "标签2", "标签3"],
    "summary": "文章摘要",
    "keywords": ["关键词1", "关键词2"]
}

要求：
1. 分类应该是中文，不超过3个
2. 标签应该是中文，5-10个
3. 摘要不超过100字
4. 关键词3-5个
5. 只返回JSON，不要其他内容`;
    }

    /**
     * 调用OpenAI API
     */
    async callOpenAI(prompt) {
        const response = await axios.post(
            `${this.baseURL}/chat/completions`,
            {
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * 解析AI响应
     */
    parseAIResponse(response) {
        try {
            // 提取JSON部分
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('无法解析AI响应');
            }

            const result = JSON.parse(jsonMatch[0]);
            return {
                categories: result.categories || ['未分类'],
                tags: result.tags || [],
                summary: result.summary || '',
                keywords: result.keywords || []
            };
        } catch (error) {
            console.error('解析AI响应失败:', error.message);
            return this.basicClassification('', '');
        }
    }

    /**
     * 基础分类（备用方案）
     */
    basicClassification(title, content) {
        const text = (title + ' ' + content).toLowerCase();
        
        // 分类规则
        const categoryRules = {
            '技术': ['技术', '编程', '代码', '开发', '前端', '后端', 'javascript', 'python', 'java', 'react', 'vue', 'node'],
            '教程': ['教程', '指南', '步骤', '如何', '学习', '入门', '教学', '方法'],
            '生活': ['生活', '日常', '感悟', '思考', '随笔', '心情', '日记'],
            '工具': ['工具', '软件', '推荐', '使用', '技巧', '效率', '应用'],
            '建站': ['建站', '博客', '网站', '部署', 'hexo', 'github', '服务器']
        };

        // 标签规则
        const tagRules = {
            '前端': ['html', 'css', 'javascript', 'react', 'vue', '前端'],
            '后端': ['node', 'python', 'java', 'php', '后端', 'api'],
            '工具': ['工具', '软件', '推荐', '效率'],
            '教程': ['教程', '指南', '学习', '入门'],
            '生活': ['生活', '日常', '感悟', '思考']
        };

        // 匹配分类
        const matchedCategories = [];
        for (const [category, keywords] of Object.entries(categoryRules)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                matchedCategories.push(category);
            }
        }

        // 匹配标签
        const matchedTags = [];
        for (const [tag, keywords] of Object.entries(tagRules)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                matchedTags.push(tag);
            }
        }

        return {
            categories: matchedCategories.length > 0 ? matchedCategories : ['未分类'],
            tags: matchedTags.length > 0 ? matchedTags : ['博客'],
            summary: content.substring(0, 100) + '...',
            keywords: this.extractKeywords(text)
        };
    }

    /**
     * 提取关键词
     */
    extractKeywords(text) {
        const commonWords = ['的', '是', '在', '有', '和', '与', '或', '但', '因为', '所以', '如果', '当', '这', '那'];
        const words = text
            .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !commonWords.includes(word))
            .slice(0, 5);

        return [...new Set(words)];
    }

    /**
     * 批量处理文章
     */
    async batchClassify(articles) {
        const results = [];
        
        for (const article of articles) {
            console.log(`🤖 分析文章: ${article.title}`);
            const classification = await this.classifyContent(article.title, article.content);
            results.push({
                ...article,
                ...classification
            });
        }

        return results;
    }
}

module.exports = AIClassifier;
