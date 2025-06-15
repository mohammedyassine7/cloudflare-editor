// server.js
// هذا هو الخادم الخلفي (Backend) الذي سيعمل كوسيط آمن
// بين واجهتك الأمامية (HTML) وواجهة برمجة تطبيقات كلاودفلير (Cloudflare API)
// *** نسخة معدلة للنشر على الإنترنت ***

// 1. استيراد المكتبات الضرورية
const express = require('express');        // إطار عمل لتسهيل بناء الخادم
const fetch = require('node-fetch');       // مكتبة لإجراء طلبات HTTP (مثل fetch في المتصفح)
const cors = require('cors');              // مكتبة للسماح للواجهة الأمامية بالتواصل مع هذا الخادم
const path = require('path');              // مكتبة للتعامل مع مسارات الملفات (جديد)

// 2. إعداد تطبيق Express
const app = express();
const port = process.env.PORT || 3000; // المنفذ الذي سيستمع إليه الخادم. مهم لمنصات الاستضافة

// 3. تفعيل الإضافات (Middleware)
app.use(cors());
app.use(express.json());

// *** جديد: خدمة الملفات الثابتة (الواجهة الأمامية) ***
// هذا السطر يخبر الخادم أن أي ملف مطلوب (مثل index.html, css, js)
// يجب البحث عنه داخل مجلد اسمه 'public'
app.use(express.static(path.join(__dirname, 'public')));


// الرابط الأساسي لواجهة برمجة تطبيقات كلاودفلير
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

/**
 * دالة مساعدة لإنشاء طلبات Fetch إلى كلاودفلير
 * (هذه الدالة تبقى كما هي)
 */
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
// (هذه المسارات تبقى كما هي)

app.post('/api/all-zones', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, errors: [{ message: 'API Token is required.' }] });
    }
    const data = await cloudflareRequest('/zones', token, 'GET');
    res.json(data);
});

app.post('/api/dns-records', async (req, res) => {
    const { token, zoneId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'GET');
    res.json(data);
});

app.post('/api/add-record', async (req, res) => {
    const { token, zoneId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1, proxied: false };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'POST', body);
    res.json(data);
});

app.put('/api/update-record', async (req, res) => {
    const { token, zoneId, recordId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1 };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'PUT', body);
    res.json(data);
});

app.delete('/api/delete-record', async (req, res) => {
    const { token, zoneId, recordId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'DELETE');
    res.json(data);
});

// *** جديد: معالجة كل الطلبات الأخرى ***
// هذا السطر يضمن أن أي رابط يدخله المستخدم، يتم توجيهه إلى صفحة index.html
// وهذا مهم للتطبيقات التي تستخدم التوجيه من جانب العميل (Client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// 5. تشغيل الخادم
app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
});
