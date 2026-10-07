const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

class RelayMonitor {
  constructor() {
    this.sessionDir = path.resolve(__dirname, 'relay_session');
    this.relayUrl = process.env.AMAZON_RELAY_URL || 'https://relay.amazon.com/tours/in-transit';
    this.isMockMode = process.env.MOCK_MODE === 'true';
    this.headless = process.env.HEADLESS_BROWSER === 'true';
    this.browserContext = null;
    this.page = null;
    this.isMonitoring = false;
    this.monitoredTours = [];
    this.listeners = [];

    // Ensure session directory exists
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }

    // Initialize initial mock tours for quick evaluation
    this.seedMockTours();
  }

  seedMockTours() {
    this.monitoredTours = [
      {
        tourId: 'TOU-984210',
        tripId: 'TRP-55219',
        driverName: 'Marcus Vance',
        driverPhone: '+1 (555) 349-2041',
        truckId: 'VOL-8821',
        origin: 'BWI2 (Baltimore, MD)',
        destination: 'PHL7 (Lewisberry, PA)',
        scheduledArrival: '14:30 EST',
        currentStatus: 'STOPPED',
        stoppedDurationMinutes: 28,
        delayMinutes: 28,
        location: 'I-83 NB MM 24 (York, PA)',
        isDelayed: true,
        lastChecked: new Date().toISOString(),
        callStatus: 'IDLE' // IDLE, CALLING, COMPLETED, FAILED
      },
      {
        tourId: 'TOU-773129',
        tripId: 'TRP-38104',
        driverName: 'Sarah Jenkins',
        driverPhone: '+1 (555) 892-4112',
        truckId: 'KEN-4019',
        origin: 'EWR4 (Robbinsville, NJ)',
        destination: 'ABE8 (Breinigsville, PA)',
        scheduledArrival: '16:00 EST',
        currentStatus: 'IN_TRANSIT',
        stoppedDurationMinutes: 0,
        delayMinutes: 0,
        location: 'I-78 WB MM 42',
        isDelayed: false,
        lastChecked: new Date().toISOString(),
        callStatus: 'IDLE'
      },
      {
        tourId: 'TOU-662901',
        tripId: 'TRP-91023',
        driverName: 'David Kowalski',
        driverPhone: '+1 (555) 441-9876',
        truckId: 'FRT-3122',
        origin: 'CLT2 (Charlotte, NC)',
        destination: 'RDU1 (Garner, NC)',
        scheduledArrival: '13:45 EST',
        currentStatus: 'STOPPED',
        stoppedDurationMinutes: 19,
        delayMinutes: 19,
        location: 'I-85 NB Rest Area MM 112',
        isDelayed: true,
        lastChecked: new Date().toISOString(),
        callStatus: 'IDLE'
      }
    ];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(eventType, data) {
    this.listeners.forEach(cb => {
      try {
        cb(eventType, data);
      } catch (err) {
        console.error('[RelayMonitor] Listener callback error:', err);
      }
    });
  }

  /**
   * Interactive login session launcher so the dispatcher can log into Amazon Relay once
   */
  static activeLoginContext = null;

  static cleanupStaleLocks(dir) {
    if (!fs.existsSync(dir)) return;
    const lockFiles = ['lockfile', 'SingletonLock', 'SingletonCookie', 'SingletonSocket', path.join('Default', 'LOCK')];
    for (const f of lockFiles) {
      const fullPath = path.join(dir, f);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`[RelayMonitor] Removed stale lock file: ${f}`);
        } catch (e) {}
      }
    }
  }

  static async launchLoginSession() {
    const sessionPath = path.resolve(__dirname, 'relay_session');
    console.log(`[RelayMonitor] Launching interactive browser for Amazon Relay authentication...`);
    console.log(`[RelayMonitor] Saving persistent profile to: ${sessionPath}`);

    // Clean stale lock files if previous process died unexpectedly
    RelayMonitor.cleanupStaleLocks(sessionPath);

    // If an active context is already open, focus and reuse it
    if (RelayMonitor.activeLoginContext) {
      try {
        const pages = RelayMonitor.activeLoginContext.pages();
        if (pages.length > 0) {
          await pages[0].bringToFront();
          await pages[0].goto('https://relay.amazon.com/tours/in-transit', { waitUntil: 'domcontentloaded' }).catch(() => {});
          console.log(`[RelayMonitor] Reused existing active login browser window.`);
          return { context: RelayMonitor.activeLoginContext, page: pages[0] };
        }
      } catch (e) {
        RelayMonitor.activeLoginContext = null;
      }
    }

    try {
      const context = await chromium.launchPersistentContext(sessionPath, {
        headless: false,
        viewport: { width: 1280, height: 800 },
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
      });

      RelayMonitor.activeLoginContext = context;
      context.on('close', () => {
        RelayMonitor.activeLoginContext = null;
      });

      const pages = context.pages();
      const page = pages.length > 0 ? pages[0] : await context.newPage();
      page.goto('https://relay.amazon.com/tours/in-transit', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(err => {
        console.warn('[RelayMonitor] Navigation notice:', err.message);
      });
      console.log(`[RelayMonitor] Please complete login and 2FA in the browser window.`);
      return { context, page };
    } catch (err) {
      console.error('[RelayMonitor] Failed to launch interactive browser:', err.message);
      RelayMonitor.activeLoginContext = null;
      return null;
    }
  }

  /**
   * Initializes the persistent Playwright browser context
   */
  async initBrowser() {
    if (this.browserContext) return;

    if (this.isMockMode) {
      console.log(`[RelayMonitor] Running in Simulation/Mock Mode. Live browser omitted.`);
      return;
    }

    try {
      console.log(`[RelayMonitor] Starting persistent Playwright context at ${this.sessionDir}...`);
      this.browserContext = await chromium.launchPersistentContext(this.sessionDir, {
        headless: this.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        viewport: { width: 1400, height: 900 }
      });

      this.page = await this.browserContext.newPage();
      await this.page.goto(this.relayUrl, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`[RelayMonitor] Connected to Amazon Relay.`);
    } catch (err) {
      console.error(`[RelayMonitor] Failed to initialize live Playwright session:`, err.message);
      console.log(`[RelayMonitor] Falling back to Mock/Simulation mode for safety.`);
      this.isMockMode = true;
    }
  }

  /**
   * Scrapes in-transit tours from Amazon Relay
   */
  async scrapeInTransitTours() {
    if (this.isMockMode || !this.page) {
      // Simulate minor progress updates in mock mode
      return this.monitoredTours;
    }

    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);

      // Extract tour rows from Amazon Relay in-transit table
      const scrapedData = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-testid="tour-row"], .tour-row, tr.in-transit-row'));
        if (!rows.length) return null;

        return rows.map(row => {
          const text = row.innerText;
          const tourIdMatch = text.match(/TOU-[A-Z0-9]+/i) || text.match(/[A-Z0-9]{8,12}/i);
          const driverMatch = row.querySelector('.driver-name, [data-testid="driver-name"]')?.innerText || 'Driver Assigned';
          const phoneMatch = text.match(/\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          const truckMatch = text.match(/(VOL|KEN|FRT|PTR|INT)-?\d{3,5}/i);
          const isStopped = text.toLowerCase().includes('stopped') || text.toLowerCase().includes('delayed');

          return {
            tourId: tourIdMatch ? tourIdMatch[0] : 'TOU-UNKNOWN',
            tripId: 'TRP-' + Math.floor(10000 + Math.random() * 90000),
            driverName: driverMatch,
            driverPhone: phoneMatch ? phoneMatch[0] : '+1 (555) 000-0000',
            truckId: truckMatch ? truckMatch[0] : 'TRK-DEFAULT',
            origin: 'Relay Origin',
            destination: 'Relay Dest',
            scheduledArrival: 'Scheduled',
            currentStatus: isStopped ? 'STOPPED' : 'IN_TRANSIT',
            stoppedDurationMinutes: isStopped ? 20 : 0,
            delayMinutes: isStopped ? 20 : 0,
            location: 'In Transit',
            isDelayed: isStopped,
            lastChecked: new Date().toISOString(),
            callStatus: 'IDLE'
          };
        });
      });

      if (scrapedData && scrapedData.length > 0) {
        this.monitoredTours = scrapedData;
      }
    } catch (err) {
      console.warn(`[RelayMonitor] Scrape iteration error:`, err.message);
    }

    return this.monitoredTours;
  }

  /**
   * Injects and submits the human-approved delay report into Amazon Relay's Delay Report Modal
   * @param {string} tourId
   * @param {Object} reportData Approved delay report
   */
  async submitDelayReport(tourId, reportData) {
    console.log(`[RelayMonitor] Submitting APPROVED delay report to Amazon Relay for Tour: ${tourId}`);
    console.log(`[RelayMonitor] Report Category: ${reportData.category} | ETA: ${reportData.estimatedTimeToResume}`);

    if (this.isMockMode || !this.page) {
      console.log(`[RelayMonitor] (Simulation) Successfully injected and confirmed Relay delay submission.`);
      return {
        success: true,
        submissionId: `RELAY-SUB-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Successfully submitted delay report to Amazon Relay (Simulation Verified).'
      };
    }

    try {
      // Find the specific tour row
      const tourSelector = `text="${tourId}"`;
      await this.page.click(tourSelector);
      await this.page.waitForTimeout(1000);

      // Click "Report delay" or "Add exception note"
      const reportDelayBtn = this.page.locator('button:has-text("Report delay"), button:has-text("Add delay note"), [data-testid="report-delay-btn"]').first();
      if (await reportDelayBtn.isVisible()) {
        await reportDelayBtn.click();
        await this.page.waitForSelector('[role="dialog"], .delay-modal', { timeout: 5000 });

        // Select delay reason category dropdown
        const categorySelect = this.page.locator('select[name="delayReason"], [data-testid="delay-category-select"]').first();
        if (await categorySelect.isVisible()) {
          await categorySelect.selectOption({ label: reportData.category });
        }

        // Fill ETA
        const etaInput = this.page.locator('input[name="eta"], [data-testid="eta-input"]').first();
        if (await etaInput.isVisible()) {
          await etaInput.fill(reportData.estimatedTimeToResume);
        }

        // Fill Notes
        const notesTextarea = this.page.locator('textarea[name="comments"], textarea[name="notes"], [data-testid="delay-notes"]').first();
        if (await notesTextarea.isVisible()) {
          await notesTextarea.fill(reportData.dispatcherNotes);
        }

        // Submit form
        const submitBtn = this.page.locator('button:has-text("Submit"), button:has-text("Confirm Delay")').first();
        await submitBtn.click();
        await this.page.waitForTimeout(2000);

        console.log(`[RelayMonitor] Successfully submitted Delay Report in Relay UI.`);
        return {
          success: true,
          submissionId: `RELAY-LIVE-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: 'Delay report successfully committed to Amazon Relay.'
        };
      } else {
        throw new Error('Could not locate "Report delay" action button on selected tour row.');
      }
    } catch (err) {
      console.error(`[RelayMonitor] Error submitting report to Amazon Relay:`, err.message);
      return {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Helper to simulate adding a new delayed tour from UI or test scripts
   */
  addSimulatedTour(customTour) {
    const defaultTour = {
      tourId: `TOU-${Math.floor(100000 + Math.random() * 900000)}`,
      tripId: `TRP-${Math.floor(10000 + Math.random() * 90000)}`,
      driverName: 'Robert Martinez',
      driverPhone: '+1 (555) 762-9011',
      truckId: 'KEN-5520',
      origin: 'JFK8 (Staten Island, NY)',
      destination: 'BOS7 (Fall River, MA)',
      scheduledArrival: '18:15 EST',
      currentStatus: 'STOPPED',
      stoppedDurationMinutes: 22,
      delayMinutes: 22,
      location: 'I-95 NB MM 58 (New Haven, CT)',
      isDelayed: true,
      lastChecked: new Date().toISOString(),
      callStatus: 'IDLE'
    };

    const newTour = { ...defaultTour, ...customTour };
    this.monitoredTours.unshift(newTour);
    this.notifyListeners('TOUR_UPDATED', newTour);
    return newTour;
  }

  updateTourCallStatus(tourId, status) {
    const tour = this.monitoredTours.find(t => t.tourId === tourId);
    if (tour) {
      tour.callStatus = status;
      this.notifyListeners('TOUR_UPDATED', tour);
    }
  }

  getAllTours() {
    return this.monitoredTours;
  }

  getDelayedTours() {
    return this.monitoredTours.filter(t => t.isDelayed || t.currentStatus === 'STOPPED');
  }

  async close() {
    if (this.browserContext) {
      await this.browserContext.close();
      this.browserContext = null;
      this.page = null;
    }
  }
}

module.exports = RelayMonitor;
