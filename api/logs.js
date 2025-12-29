import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // CORS 和 基础设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 从环境变量读取 Key，并去除可能存在的空格
  const apiKey = process.env.NOTION_KEY ? process.env.NOTION_KEY.trim() : '';
  const dbId = process.env.NOTION_LOGS_DB_ID ? process.env.NOTION_LOGS_DB_ID.trim() : '';
  
  const notion = new Client({ auth: apiKey });

  try {
    // === GET: 获取日志 ===
    if (req.method === 'GET') {
      const { category, date, limit } = req.query;
      
      const filter = { and: [] };
      if (category) filter.and.push({ property: 'Category', select: { equals: category } });
      if (date) filter.and.push({ property: 'Date', date: { equals: date } });

      const response = await notion.databases.query({
        database_id: dbId,
        filter: filter.and.length > 0 ? filter : undefined,
        sorts: [{ property: 'Date', direction: 'descending' }],
        // 如果传了 limit (如日历热力图)，则使用 limit，否则默认 50 条
        page_size: limit ? parseInt(limit) : 50 
      });
      
      const data = response.results.map(page => ({
        id: page.id,
        name: page.properties.Name?.title[0]?.plain_text || '',
        date: page.properties.Date?.date?.start,
        status: page.properties.Status?.select?.name,
        type: page.properties.Type?.select?.name,
        // 兼容处理 Result 字段 (Rich Text)
        result: page.properties.Result?.rich_text[0]?.plain_text || ''
      }));
      
      return res.status(200).json(data);
    }

    // === POST: 新增 ===
    if (req.method === 'POST') {
      const { name, date, category, status, type, result } = req.body;
      
      const properties = {
        'Name': { title: [{ text: { content: name || '未命名' } }] },
        'Date': { date: { start: date || new Date().toISOString().split('T')[0] } },
        'Category': { select: { name: category } }
      };

      if (status) properties['Status'] = { select: { name: status } };
      if (type) properties['Type'] = { select: { name: type } };
      if (result) properties['Result'] = { rich_text: [{ text: { content: result } }] };

      const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties: properties
      });
      
      return res.status(200).json({ success: true, id: response.id });
    }

    // === PUT: 修改 ===
    if (req.method === 'PUT') {
      const { id, name, date, status, type, result } = req.body;
      const properties = {};
      
      if (name) properties['Name'] = { title: [{ text: { content: name } }] };
      if (date) properties['Date'] = { date: { start: date } };
      if (status) properties['Status'] = { select: { name: status } };
      if (type) properties['Type'] = { select: { name: type } };
      if (result) properties['Result'] = { rich_text: [{ text: { content: result } }] };

      await notion.pages.update({ page_id: id, properties });
      return res.status(200).json({ success: true });
    }

    // === DELETE: 归档 (软删除) ===
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await notion.pages.update({ page_id: id, archived: true });
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('[Logs API Error]:', error.body || error);
    return res.status(500).json({ error: error.message });
  }
}