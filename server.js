// server.js
// Final version for Vercel, API-only focus

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
// Use a router for better organization
const router = express.Router();

app.use(cors());
app.use(express.json());

const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

// Helper function to make requests to Cloudflare API
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

// --- API Routes ---
router.post('/all-zones', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, errors: [{ message: 'API Token is required.' }] });
    const data = await cloudflareRequest('/zones', token, 'GET');
    res.json(data);
});

router.post('/dns-records', async (req, res) => {
    const { token, zoneId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'GET');
    res.json(data);
});

router.post('/add-record', async (req, res) => {
    const { token, zoneId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1, proxied: false };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, 'POST', body);
    res.json(data);
});

router.put('/update-record', async (req, res) => {
    const { token, zoneId, recordId, type, name, content } = req.body;
    const body = { type, name, content, ttl: 1 };
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'PUT', body);
    res.json(data);
});

router.delete('/delete-record', async (req, res) => {
    const { token, zoneId, recordId } = req.body;
    const data = await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, token, 'DELETE');
    res.json(data);
});

// Use the router for all routes starting with /api
// The frontend will call endpoints like /api/all-zones
app.use('/api/', router);

// Export the app for Vercel to use
module.exports = app;
