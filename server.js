// server.js
// *** النسخة النهائية المتوافقة مع Vercel ***

// 1. استيراد المكتبات
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

// 2. إعداد تطبيق Express
const app = express();

// 3. تفعيل الإضافات (Middleware)
app.use(cors());
app.use(express.json());
// خدمة الملفات الثابتة من مجلد 'public'
// *** تم تصحيح المسار ليعمل على Vercel ***
app.use(express.static(path.join(process.cwd(), 'public')));

// الرابط الأساسي لواجهة برمجة تطبيقات كلاودفلير
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

// دالة مساعدة لإجراء الطلبات إلى كلاودفلير
async function cloudflareRequest(endpoint, token, method, body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    try {
        const response = await fetch(`${CLOUDFLARE_API_BASE_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Cloudflare API request error:', error);
        return { success: false, errors: [{ message: error.message }] };
    }
}

// --- 4. تعريف نقاط النهاية (API Endpoints) ---

// نقطة النهاية لجلب كل النطاقات (Zones)
app.post('/api/all-zones', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, errors: [{ message: 'API Token is required.' }] });
    }
    const data = await cloudflareRequest('/zones', token, 'GET');
    res.json(data);
});

// نقطة النهاية لجلب سجلات DNS
app.post('/api/dns-records', async (req, res) => {
    const { token, zoneId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'GET');
    res.json(data);
});

// نقطة النهاية لإضافة سجل DNS
app.post('/api/add-record', async (req, res) => {
    const { token, zoneId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1, proxied: false };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'POST', body);
    res.json(data);
});

// نقطة النهاية لتحديث سجل DNS
app.put('/api/update-record', async (req, res) => {
    const { token, zoneId, recordId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1 };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'PUT', body);
    res.json(data);
});

// نقطة النهاية لحذف سجل DNS
app.delete('/api/delete-record', async (req, res) => {
    const { token, zoneId, recordId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'DELETE');
    res.json(data);
});

// نقطة النهاية لخدمة الواجهة الأمامية
// هذا يضمن أن أي رابط يدخله المستخدم، يتم توجيهه إلى صفحة index.html
app.get('*', (req, res) => {
  // *** تم تصحيح المسار ليعمل بشكل صحيح في بيئة Vercel ***
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});


// 5. تصدير التطبيق
// هذا هو التغيير الأهم. بدل app.listen، نقوم بتصدير التطبيق
// لكي تتمكن Vercel من التعامل معه كدالة serverless.
module.exports = app;
