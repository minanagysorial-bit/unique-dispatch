const dotenv = require('dotenv');
dotenv.config();

const RelayMonitor = require('./relay_monitor');
const OpenPhoneCaller = require('./openphone_caller');
const { createServer } = require('./server');

async function main() {
  console.log(`=======================================================`);
  console.log(`   AMAZON RELAY DISPATCH AI COPILOT`);
  console.log(`   Production Automation & Voice Dispatch System`);
  console.log(`=======================================================`);

  const relayMonitor = new RelayMonitor();
  const openPhoneCaller = new OpenPhoneCaller();

  // Initialize Playwright browser contexts if live mode is active
  if (process.env.MOCK_MODE !== 'true') {
    console.log(`[Master] Initializing Playwright Automation sessions...`);
    await relayMonitor.initBrowser().catch(err => console.error('[Master] Relay init err:', err.message));
    await openPhoneCaller.initBrowser().catch(err => console.error('[Master] OpenPhone init err:', err.message));
  } else {
    console.log(`[Master] Running in Simulation/Fast Evaluation Mode.`);
  }

  // Create & Start Web Server
  const { app, PORT } = createServer(relayMonitor, openPhoneCaller);

  const server = app.listen(PORT, () => {
    console.log(`\n✅ Dispatch Dashboard & Control Center Live:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`-------------------------------------------------------`);
    console.log(`- 📋 Script & Question Config Editor: Active`);
    console.log(`- ⏱️ 2.0s Strict Silence & Brevity Rules: Enforced`);
    console.log(`- 🤖 Gemini 2.5 Flash Delay Report Engine: Ready`);
    console.log(`- 🛡️ Human-in-the-Loop Review Queue: Mandatory`);
    console.log(`-------------------------------------------------------\n`);
  });

  // Automated Monitoring Loop (if enabled)
  const intervalSec = parseInt(process.env.RELAY_CHECK_INTERVAL_SEC || '30', 10);
  console.log(`[Master] Active Relay monitoring heartbeat: every ${intervalSec}s`);

  const monitorInterval = setInterval(async () => {
    try {
      const tours = await relayMonitor.scrapeInTransitTours();
      const stoppedTours = relayMonitor.getDelayedTours();

      if (stoppedTours.length > 0) {
        console.log(`[Heartbeat] Monitored ${tours.length} active tours (${stoppedTours.length} STOPPED/DELAYED).`);
      }

      // If auto-dial is enabled in config or env
      if (process.env.AUTO_DIAL_STOPPED_DRIVERS === 'true') {
        for (const stoppedTour of stoppedTours) {
          if (stoppedTour.callStatus === 'IDLE') {
            console.log(`[Auto-Dispatcher] Triggering inquiry call for stopped tour ${stoppedTour.tourId}...`);
            relayMonitor.updateTourCallStatus(stoppedTour.tourId, 'CALLING');
            openPhoneCaller.callDriver(stoppedTour)
              .then(() => relayMonitor.updateTourCallStatus(stoppedTour.tourId, 'COMPLETED'))
              .catch(() => relayMonitor.updateTourCallStatus(stoppedTour.tourId, 'FAILED'));
            break; // Process one at a time
          }
        }
      }
    } catch (err) {
      console.error('[Master] Monitoring loop error:', err.message);
    }
  }, intervalSec * 1000);

  // Graceful shutdown
  const shutdown = async () => {
    console.log(`\n[Master] Shutting down Amazon Relay Dispatch Copilot...`);
    clearInterval(monitorInterval);
    server.close();
    await relayMonitor.close();
    await openPhoneCaller.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('[Master] Fatal Startup Error:', err);
  process.exit(1);
});
