import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 🔍【关键修改】从环境变量读取并去除空格
    const apiKey = process.env.NOTION_KEY ? process.env.NOTION_KEY.trim() : '';
    const dbId = process.env.NOTION_LOGS_DB_ID ? process.env.NOTION_LOGS_DB_ID.trim() : '';

    // 🔍【调试日志】在 Vercel Logs 中查看（只显示前10位，保护安全）
    console.log(`[Logs API] Key Prefix: ${apiKey.substring(0, 10)}...`);
    console.log(`[Logs API] DB ID: ${dbId}`);

    // 初始化客户端
    const notion = new Client({ auth: apiKey });

    // === POST: 新增日志 ===
    if (req.method === 'POST') {
      const { name, date, category, status, type, result } = req.body;

      // 构建属性
      const properties = {
        'Name': { title: [{ text: { content: name || '未命名' } }] },
        'Date': { date: { start: date || new Date().toISOString() } },
        'Category': { select: { name: category } }
      };

      if (status) properties['Status'] = { select: { name: status } };
      if (type) properties['Type'] = { select: { name: type } };
      // 兼容 reason 和 result 字段
      if (result) properties['Result'] = { rich_text: [{ text: { content: result } }] };

      const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties: properties
      });

      return res.status(200).json({ success: true, id: response.id });
    }

    // === GET: 获取历史 ===
    if (req.method === 'GET') {
      const { category } = req.query;
      const response = await notion.databases.query({
        database_id: dbId,
        filter: category ? {
          property: 'Category',
          select: { equals: category }
        } : undefined,
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: 20
      });

      // 数据清洗
      const data = response.results.map(page => ({
        id: page.id,
        name: page.properties.Name?.title[0]?.plain_text || '无标题',
        date: page.properties.Date?.date?.start,
        status: page.properties.Status?.select?.name,
        result: page.properties.Result?.rich_text[0]?.plain_text || ''
      }));

      return res.status(200).json(data);
    }

  } catch (error) {
    console.error('[Logs API Error]:', error.body || error);
    // 返回详细的 Notion 错误信息
    return res.status(500).json({ error: error.message, code: error.code });
  }
}