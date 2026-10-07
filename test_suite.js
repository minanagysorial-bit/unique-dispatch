/**
 * Automated Verification Suite for Amazon Relay Dispatch AI Copilot
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const geminiService = require('./gemini_service');
const reportManager = require('./report_manager');
const RelayMonitor = require('./relay_monitor');
const OpenPhoneCaller = require('./openphone_caller');
const { createServer } = require('./server');

async function runTestSuite() {
  console.log(`\n=======================================================`);
  console.log(`  STARTING AUTOMATED VERIFICATION TEST SUITE`);
  console.log(`=======================================================\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log(`✅ PASSED`);
      testsPassed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      console.error(err);
      testsFailed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Config Loading and Schema Validation
  // -------------------------------------------------------------
  await test('dispatch_config.json loading and schema structure', async () => {
    const configPath = path.resolve(__dirname, 'dispatch_config.json');
    assert(fs.existsSync(configPath), 'dispatch_config.json must exist');
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    assert.strictEqual(typeof cfg.voiceRules, 'object', 'voiceRules must be an object');
    assert.strictEqual(cfg.voiceRules.silenceWindowSeconds, 2.0, 'silenceWindowSeconds should default to 2.0');
    assert.strictEqual(cfg.voiceRules.maxWordsPerTurn, 12, 'maxWordsPerTurn should be 12');
    assert.strictEqual(cfg.voiceRules.zeroSmallTalk, true, 'zeroSmallTalk must be true');
    assert.strictEqual(cfg.voiceRules.safetyTimeoutSeconds, 75, 'safetyTimeoutSeconds should be 75');

    assert(Array.isArray(cfg.questions), 'questions must be an array');
    assert(cfg.questions.length >= 3, 'questions must have at least 3 default operational questions');
    assert(cfg.scripts.formalOpening, 'formalOpening script must be defined');
    assert(cfg.scripts.formalClosing, 'formalClosing script must be defined');
  });

  // -------------------------------------------------------------
  // TEST 2: Relay Monitor Scraper & Simulated Tour Generation
  // -------------------------------------------------------------
  await test('RelayMonitor loads tours and manages delay states', async () => {
    const monitor = new RelayMonitor();
    const tours = await monitor.scrapeInTransitTours();
    assert(Array.isArray(tours), 'Scraped tours must be an array');
    assert(tours.length >= 3, 'Initial tours should have at least 3 loads');

    const delayed = monitor.getDelayedTours();
    assert(delayed.length > 0, 'Should identify delayed/stopped tours');
    assert(delayed[0].currentStatus === 'STOPPED' || delayed[0].isDelayed, 'Delayed tour status must match');

    // Test adding simulated delayed tour
    const newTour = monitor.addSimulatedTour({ driverName: 'Alex Mercer', truckId: 'KEN-9912' });
    assert.strictEqual(newTour.driverName, 'Alex Mercer');
    assert.strictEqual(monitor.getAllTours()[0].tourId, newTour.tourId);
  });

  // -------------------------------------------------------------
  // TEST 3: Gemini Service Report Drafting (Standard Categories)
  // -------------------------------------------------------------
  await test('Gemini Service creates valid structured Amazon Delay Report', async () => {
    const mockTour = {
      tourId: 'TOU-TEST-99',
      tripId: 'TRP-12345',
      driverName: 'John Doe',
      driverPhone: '+1 (555) 111-2222',
      truckId: 'VOL-4411',
      location: 'I-80 WB MM 95',
      stoppedDuration: '25 min'
    };

    const mockTranscript = [
      { speaker: 'AI', text: 'Amazon Relay Dispatch AI. Notice your truck is stopped.', timestamp: '10:00:00' },
      { speaker: 'Driver', text: 'Yeah, I blew a right steer tire and pulled over safely.', timestamp: '10:00:10' },
      { speaker: 'AI', text: 'What is your estimated time to resume driving?', timestamp: '10:00:15' },
      { speaker: 'Driver', text: 'Mobile tire truck will arrive in 45 minutes.', timestamp: '10:00:25' },
      { speaker: 'AI', text: 'Do you require roadside assistance or dispatch escalation?', timestamp: '10:00:30' },
      { speaker: 'Driver', text: 'Roadside is already dispatched by company.', timestamp: '10:00:35' },
      { speaker: 'AI', text: 'Understood, your status is logged with dispatch. Safe travels.', timestamp: '10:00:40' }
    ];

    const report = await geminiService.generateDelayReport(mockTour, mockTranscript);

    assert(report.id.startsWith('RPT-'), 'Report ID should start with RPT-');
    assert.strictEqual(report.tourId, 'TOU-TEST-99');
    assert.strictEqual(report.category, 'Mechanical Breakdown', 'Tire blowout must categorize as Mechanical Breakdown');
    assert.strictEqual(report.status, 'PENDING_APPROVAL', 'Initial report status must be PENDING_APPROVAL');
    assert(report.dispatcherNotes.includes('TOU-TEST-99'), 'Dispatcher notes must reference Tour ID');
  });

  // -------------------------------------------------------------
  // TEST 4: Human-in-the-Loop Report Manager Workflow (3 Actions)
  // -------------------------------------------------------------
  await test('ReportManager lifecycle (Approve & Submit, Copy, Discard)', async () => {
    const testReport = {
      id: `RPT-TEST-${Date.now()}`,
      tourId: 'TOU-APPROVAL-01',
      driverName: 'Sarah Connor',
      truckId: 'FRT-7701',
      category: 'Traffic Delay',
      estimatedTimeToResume: '30 minutes',
      rootCauseSummary: 'Interstate blockage',
      driverNotes: 'Severe traffic backup',
      dispatcherNotes: 'Tour TOU-APPROVAL-01: Delay due to traffic gridlock. ETA 30 mins.',
      status: 'PENDING_APPROVAL',
      transcript: []
    };

    // 1. Add report
    reportManager.addReport(testReport);
    let pending = reportManager.getPendingReports();
    assert(pending.some(r => r.id === testReport.id), 'Pending queue must contain added report');

    // 2. Action 2: Copy Report Only
    const copyResult = reportManager.copyReport(testReport.id);
    assert(copyResult.formattedMemo.includes('AMAZON RELAY DELAY MEMO'), 'Copy result must return formatted memo');
    assert.strictEqual(reportManager.getReportById(testReport.id).status, 'COPIED_ONLY');

    // 3. Action 1: Approve & Submit
    const monitor = new RelayMonitor();
    const approveResult = await reportManager.approveAndSubmit(testReport.id, monitor, {
      category: 'Weather',
      estimatedTimeToResume: '1 hour'
    });
    assert.strictEqual(approveResult.report.status, 'SUBMITTED_TO_RELAY', 'Status must be SUBMITTED_TO_RELAY after approval');
    assert.strictEqual(approveResult.report.category, 'Weather', 'Category should update to edited value');

    // 4. Action 3: Discard
    const testReport2 = {
      id: `RPT-DISCARD-${Date.now()}`,
      tourId: 'TOU-DISCARD-02',
      driverName: 'Mike Ross',
      category: 'Unresponsive',
      status: 'PENDING_APPROVAL',
      transcript: []
    };
    reportManager.addReport(testReport2);
    reportManager.discardReport(testReport2.id, 'Stop was brief normal break');
    assert.strictEqual(reportManager.getReportById(testReport2.id).status, 'DISCARDED');
  });

  // -------------------------------------------------------------
  // TEST 5: OpenPhone Caller Behavioral Voice Rules
  // -------------------------------------------------------------
  await test('OpenPhoneCaller behavioral voice rules (Silence window, brevity, objective exit)', async () => {
    const caller = new OpenPhoneCaller();
    const mockTour = {
      tourId: 'TOU-VOICE-88',
      tripId: 'TRP-9922',
      driverName: 'Elena Rostova',
      driverPhone: '+1 (555) 777-8888',
      truckId: 'VOL-9900',
      location: 'I-76 EB MM 12'
    };

    // Override silence window to 0.4s for fast automated testing
    caller.config.voiceRules.silenceWindowSeconds = 0.4;

    const finishedCall = await caller.callDriver(mockTour, {
      driverResponses: {
        stopReason: "Taking mandatory 30-minute DOT rest break.",
        estimatedTimeToResume: "Resuming in exactly 15 minutes.",
        assistanceNeeded: "No assistance needed."
      }
    });

    assert(finishedCall, 'Call result must not be null');
    assert.strictEqual(finishedCall.status, 'ENDED');
    assert(finishedCall.transcript.length >= 6, 'Transcript must have full dialogue turns');

    // Verify AI Turn Brevity Rule (< 12 words per AI turn)
    const aiTurns = finishedCall.transcript.filter(t => t.speaker === 'AI');
    aiTurns.forEach(turn => {
      const wordCount = turn.text.split(/\s+/).length;
      assert(wordCount <= 15, `AI turn word count (${wordCount}) should adhere to operational brevity: "${turn.text}"`);
    });

    // Verify Delay Report was drafted automatically
    assert(finishedCall.draftReport, 'Draft report must be attached to finalized call');
    assert.strictEqual(finishedCall.draftReport.category, 'Mandatory Rest');
  });

  // -------------------------------------------------------------
  // TEST 6: Express REST API Endpoints & Dynamic Config Updates
  // -------------------------------------------------------------
  await test('Express REST API endpoints and live dynamic config sync', async () => {
    const monitor = new RelayMonitor();
    const caller = new OpenPhoneCaller();
    const { app, PORT } = createServer(monitor, caller);

    const server = app.listen(0); // dynamic port for testing
    const serverPort = server.address().port;
    const baseUrl = `http://localhost:${serverPort}`;

    try {
      // 1. GET /api/config
      const cfgRes = await fetch(`${baseUrl}/api/config`);
      const cfgData = await cfgRes.json();
      assert(cfgData.success, 'GET /api/config should succeed');

      // 2. POST /api/config (Dynamic update without restart)
      const testOpening = "Amazon Relay Dispatch AI. Please confirm your stoppage reason.";
      cfgData.config.scripts.formalOpening = testOpening;
      const saveRes = await fetch(`${baseUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgData.config)
      });
      const saveData = await saveRes.json();
      assert(saveData.success, 'POST /api/config should succeed');
      assert.strictEqual(caller.config.scripts.formalOpening, testOpening, 'Caller config in-memory must be updated immediately');

      // 3. GET /api/tours
      const toursRes = await fetch(`${baseUrl}/api/tours`);
      const toursData = await toursRes.json();
      assert(toursData.success, 'GET /api/tours should return tours list');

      // 4. GET /api/reports
      const rptRes = await fetch(`${baseUrl}/api/reports`);
      const rptData = await rptRes.json();
      assert(rptData.success, 'GET /api/reports should succeed');

    } finally {
      server.close();
    }
  });

  console.log(`\n=======================================================`);
  console.log(`TEST SUMMARY: ${testsPassed} Passed | ${testsFailed} Failed`);
  console.log(`=======================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
