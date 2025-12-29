import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 🔍【关键修改】从环境变量读取并去除空格
    const apiKey = process.env.NOTION_KEY ? process.env.NOTION_KEY.trim() : '';
    const configDbId = process.env.NOTION_CONFIG_DB_ID ? process.env.NOTION_CONFIG_DB_ID.trim() : '';

    const notion = new Client({ auth: apiKey });

    // === GET ===
    if (req.method === 'GET') {
      const response = await notion.databases.query({
        database_id: configDbId,
        filter: { property: 'Active', checkbox: { equals: true } },
        sorts: [{ property: 'Name', direction: 'ascending' }]
      });

      const supplements = response.results.map(page => ({
        id: page.id,
        name: page.properties.Name?.title[0]?.plain_text || '',
        dosage: page.properties.Dosage?.rich_text[0]?.plain_text || '',
        time: page.properties.Time?.select?.name || '早晨'
      }));

      return res.status(200).json(supplements);
    }

    // === POST ===
    if (req.method === 'POST') {
      const { action, id, name, dosage, time } = req.body;

      if (action === 'create') {
        await notion.pages.create({
          parent: { database_id: configDbId },
          properties: {
            'Name': { title: [{ text: { content: name } }] },
            'Dosage': { rich_text: [{ text: { content: dosage || '' } }] },
            'Time': { select: { name: time || '早晨' } },
            'Active': { checkbox: true }
          }
        });
        return res.status(200).json({ success: true });
      }

      if (action === 'delete' && id) {
        await notion.pages.update({
          page_id: id,
          properties: { 'Active': { checkbox: false } }
        });
        return res.status(200).json({ success: true });
      }
    }

  } catch (error) {
    console.error('[Supplements API Error]:', error.body || error);
    return res.status(500).json({ error: error.message });
  }
}