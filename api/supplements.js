// api/supplements.js
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });
const CONFIG_DB_ID = process.env.NOTION_CONFIG_DB_ID; // 注意：这是新库的 ID

export default async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // === GET: 获取当前配置列表 ===
    if (req.method === 'GET') {
      const response = await notion.databases.query({
        database_id: CONFIG_DB_ID,
        filter: {
          property: 'Active',
          checkbox: { equals: true } // 只拉取激活状态的
        },
        sorts: [{ property: 'Name', direction: 'ascending' }]
      });

      // 格式化数据给前端
      const supplements = response.results.map(page => ({
        id: page.id, // Notion Page ID，用于后续修改/删除
        name: page.properties.Name.title[0]?.plain_text || '',
        dosage: page.properties.Dosage.rich_text[0]?.plain_text || '',
        time: page.properties.Time.select?.name || '早晨'
      }));

      return res.status(200).json(supplements);
    }

    // === POST: 新增或更新配置 ===
    if (req.method === 'POST') {
      const { action, id, name, dosage, time } = req.body;

      // 1. 新增 (Create)
      if (action === 'create') {
        await notion.pages.create({
          parent: { database_id: CONFIG_DB_ID },
          properties: {
            'Name': { title: [{ text: { content: name } }] },
            'Dosage': { rich_text: [{ text: { content: dosage || '' } }] },
            'Time': { select: { name: time || '早晨' } },
            'Active': { checkbox: true }
          }
        });
        return res.status(200).json({ success: true });
      }

      // 2. 软删除 (Delete -> Archive)
      if (action === 'delete' && id) {
        await notion.pages.update({
          page_id: id,
          properties: {
            'Active': { checkbox: false } // 标记为不活跃，不真删
          }
        });
        return res.status(200).json({ success: true });
      }

      // 3. 更新 (Update - 可选，目前你的UI主要是删了重加，这里预留)
      // ...
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}