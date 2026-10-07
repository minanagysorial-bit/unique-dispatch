const fs = require('fs');
const path = require('path');

class ReportManager {
  constructor() {
    this.storePath = path.resolve(__dirname, 'reports_store.json');
    this.reports = [];
    this.listeners = [];
    this.loadStore();
  }

  loadStore() {
    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        this.reports = JSON.parse(raw);
      } catch (err) {
        console.warn('[ReportManager] Failed to read reports_store.json, initializing empty store:', err.message);
        this.reports = [];
      }
    } else {
      this.seedInitialReports();
      this.saveStore();
    }
  }

  seedInitialReports() {
    this.reports = [
      {
        id: 'RPT-INIT-101',
        tourId: 'TOU-984210',
        tripId: 'TRP-55219',
        driverName: 'Marcus Vance',
        driverPhone: '+1 (555) 349-2041',
        truckId: 'VOL-8821',
        location: 'I-83 NB MM 24 (York, PA)',
        category: 'Mechanical Breakdown',
        estimatedTimeToResume: '45 minutes',
        rootCauseSummary: 'Flat right trailer drive tire. Mobile roadside tire service dispatched.',
        driverNotes: 'Driver Marcus stated: "Got a flat drive tire on the right side of the trailer. Mobile roadside service is en route, estimated 45 mins."',
        dispatcherNotes: '[OFFICIAL RELAY DELAY MEMO]\nTour ID: TOU-984210 | Trip ID: TRP-55219 | Tractor: VOL-8821\nDriver: Marcus Vance | Location: I-83 NB MM 24\nReason: Mechanical Breakdown (Flat right trailer drive tire).\nRoadside Action: Mobile tire service unit ETA 45 minutes.\nEstimated Departure: 15:15 EST. No load temperature/security compromise.',
        requiresRoadsideAssistance: true,
        confidenceScore: 0.96,
        transcript: [
          { speaker: 'AI', text: 'Amazon Relay Dispatch AI. Notice your truck is stopped.', timestamp: '14:02:10' },
          { speaker: 'Driver', text: 'Hey, I got a flat drive tire on the right side of the trailer.', timestamp: '14:02:18' },
          { speaker: 'AI', text: 'What is your estimated time to resume driving?', timestamp: '14:02:22' },
          { speaker: 'Driver', text: 'Mobile tire truck is on the way, they told me about 45 minutes.', timestamp: '14:02:30' },
          { speaker: 'AI', text: 'Do you require roadside assistance or dispatch escalation?', timestamp: '14:02:34' },
          { speaker: 'Driver', text: 'Carrier roadside is handling it. We are good.', timestamp: '14:02:40' },
          { speaker: 'AI', text: 'Understood, your status is logged with dispatch. Safe travels.', timestamp: '14:02:44' }
        ],
        status: 'PENDING_APPROVAL', // PENDING_APPROVAL, SUBMITTED_TO_RELAY, COPIED_ONLY, DISCARDED
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        source: 'Gemini 2.5 Flash'
      }
    ];
  }

  saveStore() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.reports, null, 2), 'utf8');
    } catch (err) {
      console.error('[ReportManager] Failed to persist reports_store.json:', err.message);
    }
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(eventType, data) {
    this.listeners.forEach(cb => {
      try {
        cb(eventType, data);
      } catch (err) {
        console.error('[ReportManager] Listener error:', err);
      }
    });
  }

  addReport(report) {
    this.reports.unshift(report);
    this.saveStore();
    this.notifyListeners('REPORT_ADDED', report);
    return report;
  }

  getAllReports() {
    return this.reports;
  }

  getPendingReports() {
    return this.reports.filter(r => r.status === 'PENDING_APPROVAL');
  }

  getReportById(id) {
    return this.reports.find(r => r.id === id);
  }

  updateReport(id, updates) {
    const report = this.getReportById(id);
    if (!report) throw new Error(`Report ${id} not found`);

    if (updates.category) report.category = updates.category;
    if (updates.estimatedTimeToResume) report.estimatedTimeToResume = updates.estimatedTimeToResume;
    if (updates.driverNotes) report.driverNotes = updates.driverNotes;
    if (updates.dispatcherNotes) report.dispatcherNotes = updates.dispatcherNotes;
    if (updates.rootCauseSummary) report.rootCauseSummary = updates.rootCauseSummary;

    report.updatedAt = new Date().toISOString();
    this.saveStore();
    this.notifyListeners('REPORT_UPDATED', report);
    return report;
  }

  /**
   * Action 1: [Approve & Submit to Relay]
   */
  async approveAndSubmit(id, relayMonitor, editedData = {}) {
    const report = this.getReportById(id);
    if (!report) throw new Error(`Report ${id} not found`);

    if (editedData) {
      this.updateReport(id, editedData);
    }

    // Call Relay Monitor automation to submit to Amazon Relay UI
    let relayResult = { success: true, submissionId: `RELAY-MOCK-${Date.now()}` };
    if (relayMonitor) {
      relayResult = await relayMonitor.submitDelayReport(report.tourId, report);
    }

    report.status = 'SUBMITTED_TO_RELAY';
    report.submittedAt = new Date().toISOString();
    report.relaySubmissionResult = relayResult;

    this.saveStore();
    this.notifyListeners('REPORT_SUBMITTED', report);
    return { report, relayResult };
  }

  /**
   * Action 2: [Copy Report Only]
   */
  copyReport(id) {
    const report = this.getReportById(id);
    if (!report) throw new Error(`Report ${id} not found`);

    report.status = 'COPIED_ONLY';
    report.copiedAt = new Date().toISOString();

    const formattedMemo = `=====================================================
AMAZON RELAY DELAY MEMO - OPERATIONAL EXCEPTION REPORT
=====================================================
Tour ID:       ${report.tourId}
Trip ID:       ${report.tripId || 'N/A'}
Driver Name:   ${report.driverName} (${report.driverPhone || 'N/A'})
Truck / Unit:  ${report.truckId || 'N/A'}
Current Spot:  ${report.location || 'In Transit'}
Delay Category: ${report.category}
Estimated ETA: ${report.estimatedTimeToResume}
Root Cause:    ${report.rootCauseSummary}

DRIVER STATEMENT:
${report.driverNotes}

OFFICIAL DISPATCHER SUBMISSION NOTE:
${report.dispatcherNotes}
=====================================================`;

    this.saveStore();
    this.notifyListeners('REPORT_COPIED', report);
    return { report, formattedMemo };
  }

  /**
   * Action 3: [Discard]
   */
  discardReport(id, reason = 'Operator deemed stop normal') {
    const report = this.getReportById(id);
    if (!report) throw new Error(`Report ${id} not found`);

    report.status = 'DISCARDED';
    report.discardedAt = new Date().toISOString();
    report.discardReason = reason;

    this.saveStore();
    this.notifyListeners('REPORT_DISCARDED', report);
    return report;
  }
}

module.exports = new ReportManager();
