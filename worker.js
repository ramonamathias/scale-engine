const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const redis = new Redis();
const workerName = `Worker-${process.argv[2] || 'Delta_' + Math.floor(Math.random() * 900 + 100)}`;

console.log(`[System Initialization] ${workerName} online and awaiting queue load payloads...`);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function startWorkerPipeline() {
    while (true) {
        try {
            // Atomic blocking queue pop
            const res = await redis.brpop('task_queue', 0);
            if (!res) continue;

            const [queueName, rawJobData] = res;
            const job = JSON.parse(rawJobData);
            
            console.log(`[${workerName}] Processing task sequence profile: ${job.taskId}`);

            // Simulate heavy computational processing lag (2000ms)
            await delay(2000);

            // Determine naming layout
            const fileIdentifier = job.customName ? job.customName : `report_${job.taskId}`;
            const targetDownloadPath = path.join(__dirname, 'downloads', `${fileIdentifier}.pdf`);

            // Create a new PDF document stream
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(targetDownloadPath);
            doc.pipe(writeStream);

            // ==========================================
            // 1. BRANDING HEADER BANNER
            // ==========================================
            doc.rect(0, 0, 612, 40).fill('#2b2927'); 
            doc.fillColor('#faf8f5')
               .font('Helvetica-Bold')
               .fontSize(10)
               .text('SCALEENGINE AUTOMATED GENERATION PIPELINE', 50, 15, { characterSpacing: 1.5 });

            // ==========================================
            // 2. DOCUMENT TITLE
            // ==========================================
            doc.moveDown(3.5);
            doc.fillColor('#2b2927')
               .font('Helvetica-Bold')
               .fontSize(22)
               .text('ENTERPRISE PERFORMANCE REPORT', { align: 'left' });
            
            // Clean accent rule line under title
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2ded5').lineWidth(1).stroke();

            // ==========================================
            // 3. PIXEL-PERFECT METADATA GRID
            // ==========================================
            doc.moveDown(1.5);
            doc.fillColor('#706b64').font('Helvetica-Bold').fontSize(9).text('SYSTEM METADATA HEADER', { characterSpacing: 0.5 });
            doc.moveDown(0.5);

            // Define starting layout coordinates for grid rows
            let currentY = doc.y;
            const labelX = 50;
            const valueX = 170; // Hard margin block preventing text collisions
            const rowSpacing = 18;

            // Row 1: Task ID
            doc.fillColor('#706b64').font('Helvetica').fontSize(10).text('Task Reference ID:', labelX, currentY);
            doc.fillColor('#2b2927').font('Courier').text(job.taskId, valueX, currentY);
            
            // Row 2: Worker Name
            currentY += rowSpacing;
            doc.fillColor('#706b64').font('Helvetica').text('Processed By:', labelX, currentY);
            doc.fillColor('#2b2927').font('Helvetica-Bold').text(workerName, valueX, currentY);
            
            // Row 3: Timestamp
            currentY += rowSpacing;
            doc.fillColor('#706b64').font('Helvetica').text('Timestamp Created:', labelX, currentY);
            doc.fillColor('#2b2927').font('Courier').text(new Date().toISOString(), valueX, currentY);
            
            // Row 4: Status Indicator
            currentY += rowSpacing;
            doc.fillColor('#706b64').font('Helvetica').text('Execution Status:', labelX, currentY);
            doc.fillColor('#047857').font('Helvetica-Bold').text('VERIFIED SUCCESSFUL', valueX, currentY);

            // Separator rule line below grid data block
            doc.moveDown(1.5);
            doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2ded5').stroke();

            // ==========================================
            // 4. USER PAYLOAD TEXT CONTENT BLOCK
            // ==========================================
            doc.moveDown(1.8);
            doc.fillColor('#706b64').font('Helvetica-Bold').fontSize(9).text('USER PAYLOAD DATA CONTENT', { characterSpacing: 0.5 });
            
            doc.moveDown(0.8);
            // Revert X coordinate baseline position to standard 50 margin indentation
            doc.fillColor('#2b2927').font('Helvetica', 50).fontSize(11).text(job.userContent, 50, doc.y, {
                lineGap: 5,
                align: 'justify',
                width: 512 // Explicitly restrains text width bounding box
            });

            // Finalize PDF asset generation
            doc.end();

            // Wait for file system stream to finish writing cleanly
            await new Promise((resolve) => writeStream.on('finish', resolve));

            // Update state and asset paths to Redis
            await redis.hset(`job:${job.taskId}`, 
                'state', 'Completed',
                'processedBy', workerName,
                'downloadUrl', `/downloads/${fileIdentifier}.pdf`
            );

            console.log(`[${workerName}] Finished processing: ${fileIdentifier}.pdf`);

        } catch (error) {
            console.error(`[CRITICAL WRITER FAULT] Execution loop disrupted:`, error);
            await delay(1000);
        }
    }
}

startWorkerPipeline();