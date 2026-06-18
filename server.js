const express = require('express');
const Redis = require('ioredis');
const path = require('path');
const fs = require('fs');

const app = express();
const redis = new Redis(); // Connects to local Redis instance

app.use(express.json());
// Serve static assets from public folder where your index.html lives
app.use(express.static(path.join(__dirname, 'public')));
// Expose the downloads folder to the browser
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Ensure downloads directory exists
if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
}

// 1. Enqueue a custom user task
app.post('/enqueue', async (req, requireResponse) => {
    const { taskType, userContent, customName } = req.body;
    
    // Generate a unique fallback token ID if no custom name is passed
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const taskId = `task_${Date.now()}_${uniqueId}`;
    
    const jobPayload = {
        taskId,
        taskType,
        userContent: userContent || "Default system diagnostic confirmation string.",
        customName: customName ? customName.replace(/[^a-z0-9_]/gi, '_') : null // Sanitize filename
    };

    // Track initial processing state in Redis hash map store
    await redis.hset(`job:${taskId}`, 'state', 'Processing');

    // Push task payload into the Redis list queue
    await redis.lpush('task_queue', JSON.stringify(jobPayload));

    requireResponse.status(202).json({ taskId });
});

// 2. Poll status updates
app.get('/status/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const jobData = await redis.hgetall(`job:${taskId}`);
    
    if (!jobData || Object.keys(jobData).length === 0) {
        return res.status(404).json({ error: "Task structural reference not discovered." });
    }

    res.json(jobData);
});

app.listen(3000, () => {
    console.log('ScaleEngine Gateway Operational on http://localhost:3000');
});