const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const geminiService = require('./gemini_service');
const reportManager = require('./report_manager');
const ttsService = require('./tts_service');

function createServer(relayMonitor, openPhoneCaller) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Active SSE client connections
  const sseClients = [];

  function broadcastEvent(eventType, payload) {
    const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach(res => {
      try {
        res.write(data);
      } catch (err) {
        // Client disconnected
      }
    });
  }

  // Hook listeners to broadcast SSE events to connected dashboards
  if (relayMonitor) {
    relayMonitor.onUpdate((type, data) => broadcastEvent(type, data));
  }
  if (openPhoneCaller) {
    openPhoneCaller.onUpdate((type, data) => {
      broadcastEvent(type, data);
      // If a report was just drafted from a completed call, automatically save it in the approval queue
      if (type === 'REPORT_DRAFTED' && data.report) {
        reportManager.addReport(data.report);
      }
    });
  }
  reportManager.onUpdate((type, data) => broadcastEvent(type, data));

  // ==========================================
  // MICROSOFT EDGE NEURAL TTS STREAMING
  // ==========================================
  app.get('/api/tts', async (req, res) => {
    try {
      const text = req.query.text || '';
      const speaker = req.query.speaker || 'AI';
      const voice = req.query.voice || null;

      if (!text || !text.trim()) {
        return res.status(400).send('Text query parameter is required.');
      }

      const buffer = await ttsService.generateSpeechBuffer(text, speaker, voice);
      if (!buffer || buffer.length === 0) {
        return res.status(500).send('Failed to synthesize speech.');
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
      res.send(buffer);
    } catch (err) {
      console.error('[Server] TTS endpoint error:', err.message);
      res.status(500).send('TTS synthesis error.');
    }
  });

  app.get('/api/tts/voices', (req, res) => {
    res.json({
      success: true,
      defaultAIVoice: ttsService.defaultAIVoice,
      defaultDriverVoice: ttsService.defaultDriverVoice,
      voices: ttsService.getAvailableVoices()
    });
  });

  app.post('/api/tts/synthesize', async (req, res) => {
    try {
      const { text, speaker, voice } = req.body;
      const buffer = await ttsService.generateSpeechBuffer(text, speaker, voice);
      if (buffer) {
        const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&speaker=${encodeURIComponent(speaker || 'AI')}`;
        res.json({ success: true, audioUrl, bytes: buffer.length });
      } else {
        res.status(500).json({ success: false, error: 'Synthesis failed.' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // SERVER-SENT EVENTS (Real-Time Live Feed)
  // ==========================================
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);
    console.log(`[Server] Dashboard client connected to live SSE feed. Total clients: ${sseClients.length}`);

    // Send initial snapshot
    res.write(`event: INITIAL_STATE\ndata: ${JSON.stringify({
      tours: relayMonitor ? relayMonitor.getAllTours() : [],
      activeCall: openPhoneCaller ? openPhoneCaller.getActiveCall() : null,
      pendingReports: reportManager.getPendingReports(),
      allReports: reportManager.getAllReports(),
      config: openPhoneCaller ? openPhoneCaller.config : {}
    })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
      console.log(`[Server] Dashboard client disconnected. Total clients: ${sseClients.length}`);
    });
  });

  // ==========================================
  // DYNAMIC CONFIG & SCRIPTS MANAGEMENT
  // ==========================================
  app.get('/api/config', (req, res) => {
    try {
      const configPath = path.resolve(__dirname, 'dispatch_config.json');
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json({ success: true, config: data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/config', (req, res) => {
    try {
      const updatedConfig = req.body;
      const configPath = path.resolve(__dirname, 'dispatch_config.json');
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');

      // Update caller in memory immediately without restarting server
      if (openPhoneCaller) {
        openPhoneCaller.updateConfig(updatedConfig);
      }

      broadcastEvent('CONFIG_UPDATED', updatedConfig);
      console.log(`[Server] Dynamic dispatch config updated and persisted to dispatch_config.json.`);
      res.json({ success: true, message: 'Configuration saved and applied immediately.', config: updatedConfig });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // RELAY TOURS & MONITORING
  // ==========================================
  app.get('/api/tours', async (req, res) => {
    try {
      const tours = relayMonitor ? await relayMonitor.scrapeInTransitTours() : [];
      res.json({ success: true, tours });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tours/simulate', (req, res) => {
    try {
      const customTour = req.body || {};
      const newTour = relayMonitor ? relayMonitor.addSimulatedTour(customTour) : null;
      res.json({ success: true, tour: newTour });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Active 3-minute retry timers for unresponsive drivers
  const activeRetryTimers = {};

  function handleUnresponsiveDriver(tour) {
    if (!tour) return;
    const retryDelayMs = 180000; // 3 minutes (180 seconds)
    console.log(`[UnresponsiveDriver] Tour ${tour.tourId} (${tour.driverName}) is unresponsive. Sending automated SMS and queuing 3-minute redial...`);

    const smsText = `Amazon Relay Dispatch: We noticed tractor ${tour.truckId || 'assigned'} is stopped at ${tour.location || 'route'}. Please reply with your status and ETA immediately.`;
    
    if (openPhoneCaller) {
      openPhoneCaller.sendDirectSms(tour, smsText).catch(() => {});
    }

    tour.callStatus = 'UNRESPONSIVE_SMS_SENT';
    tour.retryScheduledAt = Date.now() + retryDelayMs;
    tour.unresponsiveRetries = (tour.unresponsiveRetries || 0) + 1;

    if (relayMonitor) {
      relayMonitor.notifyListeners('TOUR_UPDATED', tour);
    }
    broadcastEvent('UNRESPONSIVE_ALERT', {
      tour,
      message: `Automated SMS sent to ${tour.driverName}. Redialing in 3 minutes.`,
      retryScheduledAt: tour.retryScheduledAt
    });

    if (activeRetryTimers[tour.tourId]) {
      clearTimeout(activeRetryTimers[tour.tourId]);
    }

    activeRetryTimers[tour.tourId] = setTimeout(async () => {
      delete activeRetryTimers[tour.tourId];
      const currentTour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tour.tourId) : null;
      if (currentTour && (currentTour.currentStatus === 'STOPPED' || currentTour.isDelayed)) {
        console.log(`[Auto-Redial] ⏳ 3-minute timer expired for Tour ${tour.tourId}. Automatically initiating second voice call to ${tour.driverName}...`);
        currentTour.callStatus = 'CALLING';
        currentTour.retryScheduledAt = null;
        if (relayMonitor) relayMonitor.notifyListeners('TOUR_UPDATED', currentTour);
        broadcastEvent('AUTOREDIAL_TRIGGERED', { tour: currentTour, attempt: currentTour.unresponsiveRetries + 1 });

        if (openPhoneCaller) {
          try {
            await openPhoneCaller.callDriver(currentTour);
            if (relayMonitor) relayMonitor.updateTourCallStatus(currentTour.tourId, 'COMPLETED');
          } catch (err) {
            console.error('[Auto-Redial] Redial call error:', err);
            if (relayMonitor) relayMonitor.updateTourCallStatus(currentTour.tourId, 'FAILED');
          }
        }
      }
    }, retryDelayMs);
  }

  // ==========================================
  // OPERATIONAL VOICE CALLS
  // ==========================================
  app.get('/api/calls/active', (req, res) => {
    const active = openPhoneCaller ? openPhoneCaller.getActiveCall() : null;
    res.json({ success: true, activeCall: active });
  });

  app.get('/api/calls/history', (req, res) => {
    const history = openPhoneCaller ? openPhoneCaller.getCallHistory() : [];
    res.json({ success: true, history });
  });

  app.post('/api/calls/trigger', async (req, res) => {
    try {
      const { tourId, driverName, driverPhone, truckId, location, mockScenario, scenarioType } = req.body;

      let tour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tourId) : null;
      if (!tour) {
        tour = {
          tourId: tourId || `TOU-${Math.floor(100000 + Math.random() * 900000)}`,
          tripId: `TRP-${Math.floor(10000 + Math.random() * 90000)}`,
          driverName: driverName || 'Marcus Vance',
          driverPhone: driverPhone || '+1 (555) 349-2041',
          truckId: truckId || 'VOL-8821',
          location: location || 'I-80 EB MM 142'
        };
      }

      if (relayMonitor) {
        relayMonitor.updateTourCallStatus(tour.tourId, 'CALLING');
      }

      // Start call asynchronously so endpoint returns immediate confirmation
      res.json({
        success: true,
        message: `Initiating operational voice inquiry to ${tour.driverName} (${tour.driverPhone})...`,
        tour
      });

      if (openPhoneCaller) {
        openPhoneCaller.callDriver(tour, { driverResponses: mockScenario, scenarioType })
          .then(finishedCall => {
            if (scenarioType === 'inaudible_clarification' || finishedCall?.status === 'UNRESPONSIVE' || finishedCall?.status === 'TIMED_OUT') {
              handleUnresponsiveDriver(tour);
            } else if (relayMonitor && tour.tourId) {
              relayMonitor.updateTourCallStatus(tour.tourId, 'COMPLETED');
            }
          })
          .catch(err => {
            console.error(`[Server] Call error:`, err);
            handleUnresponsiveDriver(tour);
          });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Manual Instant Redial
  app.post('/api/tours/:tourId/redial-now', async (req, res) => {
    try {
      const { tourId } = req.params;
      if (activeRetryTimers[tourId]) {
        clearTimeout(activeRetryTimers[tourId]);
        delete activeRetryTimers[tourId];
      }
      const tour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tourId) : null;
      if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

      tour.callStatus = 'CALLING';
      tour.retryScheduledAt = null;
      if (relayMonitor) relayMonitor.notifyListeners('TOUR_UPDATED', tour);

      res.json({ success: true, message: `Redialing ${tour.driverName} now...`, tour });

      if (openPhoneCaller) {
        openPhoneCaller.callDriver(tour)
          .then(() => relayMonitor && relayMonitor.updateTourCallStatus(tour.tourId, 'COMPLETED'))
          .catch(err => {
            console.error('[Server] Manual redial error:', err);
            relayMonitor && relayMonitor.updateTourCallStatus(tour.tourId, 'FAILED');
          });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cancel 3-Minute Scheduled Retry
  app.post('/api/tours/:tourId/cancel-retry', (req, res) => {
    const { tourId } = req.params;
    if (activeRetryTimers[tourId]) {
      clearTimeout(activeRetryTimers[tourId]);
      delete activeRetryTimers[tourId];
    }
    const tour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tourId) : null;
    if (tour) {
      tour.callStatus = 'IDLE';
      tour.retryScheduledAt = null;
      if (relayMonitor) relayMonitor.notifyListeners('TOUR_UPDATED', tour);
    }
    res.json({ success: true, message: 'Scheduled retry cancelled.' });
  });

  // Trigger 100% Automated SMS/Chat Inquiry with Driver
  app.post('/api/chat/automated-inquiry', async (req, res) => {
    try {
      const { tourId, driverName, driverPhone, truckId, location, mockScenario } = req.body;

      let tour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tourId) : null;
      if (!tour) {
        tour = {
          tourId: tourId || `TOU-${Math.floor(100000 + Math.random() * 900000)}`,
          tripId: `TRP-${Math.floor(10000 + Math.random() * 90000)}`,
          driverName: driverName || 'Marcus Vance',
          driverPhone: driverPhone || '+1 (555) 349-2041',
          truckId: truckId || 'VOL-8821',
          location: location || 'I-80 EB MM 142'
        };
      }

      res.json({
        success: true,
        message: `Starting automated SMS/Chat inquiry with ${tour.driverName}...`,
        tour
      });

      if (openPhoneCaller) {
        openPhoneCaller.startAutomatedChat(tour, { driverResponses: mockScenario })
          .catch(err => console.error('[Server] Chat inquiry error:', err));
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Terminate any active operational voice call immediately
  app.post('/api/calls/terminate', async (req, res) => {
    try {
      console.log(`[Server] Received Force Hangup request from operator.`);
      if (openPhoneCaller) {
        await openPhoneCaller.forceTerminateCall('OPERATOR_FORCE_HANGUP');
      }
      broadcastEvent('CALL_ENDED', { status: 'ENDED', reason: 'OPERATOR_FORCE_HANGUP' });
      res.json({ success: true, message: 'Call terminated immediately.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Terminate any active automated SMS/Chat inquiry immediately
  app.post('/api/chat/terminate', async (req, res) => {
    try {
      if (openPhoneCaller) {
        await openPhoneCaller.forceTerminateCall('OPERATOR_FORCE_HANGUP');
      }
      broadcastEvent('CHAT_ENDED', { status: 'ENDED', reason: 'OPERATOR_FORCE_HANGUP' });
      res.json({ success: true, message: 'Chat inquiry terminated.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dynamic Interactive Live Turn (Microphone roleplay / driver call)
  app.post('/api/calls/interactive-turn', async (req, res) => {
    try {
      const { tourId, transcript = [] } = req.body;
      const tour = relayMonitor ? relayMonitor.getAllTours().find(t => t.tourId === tourId) || {} : {};
      const config = openPhoneCaller ? openPhoneCaller.config : {};

      const turnResult = await geminiService.generateInteractiveTurn({
        tourDetails: tour,
        transcript,
        questions: config.questions || [],
        scripts: config.scripts || {}
      });

      // If this turn completes the conversation, draft the official Delay Report immediately!
      if (turnResult.isClosing) {
        console.log(`[Interactive Call] Live conversation completed. Compiling delay report...`);
        const report = await geminiService.generateDelayReport(
          {
            tourId: tour.tourId || tourId || `TOU-${Math.floor(100000 + Math.random() * 900000)}`,
            tripId: tour.tripId,
            driverName: tour.driverName || 'Driver',
            driverPhone: tour.driverPhone || '+1 (555) 349-2041',
            truckId: tour.truckId || 'VOL-8821',
            location: tour.location || 'In Transit',
            stoppedDuration: 'Live interactive voice inquiry completed'
          },
          transcript
        );
        reportManager.addReport(report);
        broadcastEvent('REPORT_DRAFTED', { report });
        turnResult.draftReport = report;
      }

      res.json({ success: true, ...turnResult });
    } catch (err) {
      console.error('[Server] Interactive turn error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // HUMAN-IN-THE-LOOP APPROVAL & REPORTS
  // ==========================================
  app.get('/api/reports', (req, res) => {
    const filter = req.query.status;
    let reports = reportManager.getAllReports();
    if (filter === 'pending') {
      reports = reportManager.getPendingReports();
    }
    res.json({ success: true, reports });
  });

  // Export Delay Reports to CSV
  app.get('/api/reports/export.csv', (req, res) => {
    try {
      const reports = reportManager.getAllReports();
      const headers = ['Report ID', 'Tour ID', 'Driver Name', 'Phone', 'Truck ID', 'Category', 'ETA', 'Appointment Impact', 'Root Cause', 'Status', 'Created At'];
      
      const rows = reports.map(r => [
        `"${r.id || ''}"`,
        `"${r.tourId || ''}"`,
        `"${r.driverName || ''}"`,
        `"${r.driverPhone || ''}"`,
        `"${r.truckId || ''}"`,
        `"${r.category || ''}"`,
        `"${r.estimatedTimeToResume || ''}"`,
        `"${(r.appointmentImpact || '').replace(/"/g, '""')}"`,
        `"${(r.rootCauseSummary || '').replace(/"/g, '""')}"`,
        `"${r.status || ''}"`,
        `"${r.createdAt || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Amazon_Relay_Delay_Reports.csv"');
      res.status(200).send('\uFEFF' + csvContent); // Include BOM for Excel UTF-8 compatibility
    } catch (err) {
      res.status(500).send('Error generating CSV: ' + err.message);
    }
  });

  // Toggle Auto-Pilot Mode
  app.post('/api/settings/autopilot', (req, res) => {
    const { enabled } = req.body;
    process.env.AUTO_DIAL_STOPPED_DRIVERS = enabled ? 'true' : 'false';
    console.log(`[Auto-Pilot] Autonomous Dispatch Mode set to: ${enabled ? 'ENABLED' : 'PAUSED'}`);
    broadcastEvent('AUTOPILOT_TOGGLED', { enabled: Boolean(enabled) });
    res.json({ success: true, enabled: Boolean(enabled) });
  });

  app.get('/api/reports/:id', (req, res) => {
    const report = reportManager.getReportById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, report });
  });

  app.put('/api/reports/:id', (req, res) => {
    try {
      const updated = reportManager.updateReport(req.params.id, req.body);
      res.json({ success: true, message: 'Report updated successfully.', report: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Action 1: [Approve & Submit to Relay]
  app.post('/api/reports/:id/approve', async (req, res) => {
    try {
      const editedData = req.body.reportData || req.body;
      const { report, relayResult } = await reportManager.approveAndSubmit(
        req.params.id,
        relayMonitor,
        editedData
      );
      res.json({
        success: true,
        message: 'Report approved and submitted to Amazon Relay successfully.',
        report,
        relayResult
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Action 2: [Copy Report Only]
  app.post('/api/reports/:id/copy', (req, res) => {
    try {
      const { report, formattedMemo } = reportManager.copyReport(req.params.id);
      res.json({
        success: true,
        message: 'Report memo prepared for external clipboard.',
        formattedMemo,
        report
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Action 3: [Discard]
  app.post('/api/reports/:id/discard', (req, res) => {
    try {
      const reason = req.body.reason || 'Operator deemed stop normal';
      const discarded = reportManager.discardReport(req.params.id, reason);
      res.json({
        success: true,
        message: 'Report successfully discarded and archived.',
        report: discarded
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 1ST-TIME AUTH SESSION LAUNCHERS
  // ==========================================
  app.post('/api/sessions/login-relay', async (req, res) => {
    try {
      const RelayMonitorClass = require('./relay_monitor');
      const sessionResult = await RelayMonitorClass.launchLoginSession();
      if (sessionResult) {
        res.json({ success: true, message: 'Chromium window opened for Amazon Relay 2FA login.' });
      } else {
        res.json({ success: true, message: 'Relay browser session active or initialized.' });
      }
    } catch (err) {
      console.error('[Server] Relay login launch error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sessions/login-openphone', async (req, res) => {
    try {
      const OpenPhoneCallerClass = require('./openphone_caller');
      const sessionResult = await OpenPhoneCallerClass.launchLoginSession();
      if (sessionResult) {
        res.json({ success: true, message: 'Chromium window opened for OpenPhone authentication.' });
      } else {
        res.json({ success: true, message: 'OpenPhone browser session active or initialized.' });
      }
    } catch (err) {
      console.error('[Server] OpenPhone login launch error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update Gemini API Key live
  app.post('/api/gemini/key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: 'API key is required' });
    geminiService.updateApiKey(apiKey);
    res.json({ success: true, message: 'Gemini API Key updated successfully.' });
  });

  // ==========================================
  // DISPATCHER COPILOT CHAT ASSISTANT
  // ==========================================
  app.post('/api/copilot/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) return res.status(400).json({ success: false, error: 'Message is required' });
      const reply = await geminiService.chatWithCopilot(message, history || []);
      res.json({ success: true, reply });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return { app, PORT };
}

if (require.main === module) {
  const RelayMonitor = require('./relay_monitor');
  const OpenPhoneCaller = require('./openphone_caller');
  const monitor = new RelayMonitor();
  const caller = new OpenPhoneCaller();
  const { app, PORT } = createServer(monitor, caller);
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Amazon Relay Dispatch AI Copilot running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = { createServer };
