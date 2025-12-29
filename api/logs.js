// api/logs.js
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });
const LOGS_DB_ID = process.env.NOTION_LOGS_DB_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // POST: 新增日志 (用药 / 打卡 / 检查计划)
    if (req.method === 'POST') {
      const { name, date, category, status, type, result } = req.body;

      const properties = {
        'Name': { title: [{ text: { content: name } }] },
        'Date': { date: { start: date } },
        'Category': { select: { name: category } }
      };

      // 如果有额外字段，动态添加
      if (status) properties['Status'] = { select: { name: status } };
      if (type) properties['Type'] = { select: { name: type } };
      if (result) properties['Result'] = { rich_text: [{ text: { content: result } }] };

      const response = await notion.pages.create({
        parent: { database_id: LOGS_DB_ID },
        properties: properties
      });

      return res.status(200).json({ success: true, id: response.id });
    }

    // GET: 获取历史 (比如补剂打卡日历 / 检查历史)
    if (req.method === 'GET') {
      const { category } = req.query; // 前端传 ?category=...
      const response = await notion.databases.query({
        database_id: LOGS_DB_ID,
        filter: category ? {
          property: 'Category',
          select: { equals: category }
        } : undefined,
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: 50
      });

      // 简化数据返回给前端
      const data = response.results.map(page => ({
        id: page.id,
        name: page.properties.Name.title[0]?.plain_text,
        date: page.properties.Date.date?.start,
        status: page.properties.Status?.select?.name,
        result: page.properties.Result?.rich_text[0]?.plain_text
      }));

      return res.status(200).json(data);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}