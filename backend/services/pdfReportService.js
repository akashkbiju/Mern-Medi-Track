import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.resolve(__dirname, '../storage/reports');

// Ensure reports directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Professional PDF Report Generation Service for MediTrack+
 * Formats structured HealthReport records into academic and presentation-ready medical reports.
 */
export const pdfReportService = {
  /**
   * Generates a PDF buffer for a structured HealthReport document.
   *
   * @param {Object} report - Structured HealthReport document
   * @returns {Promise<Buffer>} PDF binary buffer
   */
  generateReportPDF: async (report) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `MediTrack+ Health Report - ${report._id}`,
            Author: 'MediTrack+ Smart Health Management System',
            Subject: `${report.reportType.toUpperCase()} Health Telemetry Report`,
          },
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);

          // Save safe local copy to storage directory
          try {
            const safeFileName = `report-${report._id}.pdf`;
            const fullPath = path.join(STORAGE_DIR, safeFileName);
            fs.writeFileSync(fullPath, pdfBuffer);
          } catch (writeErr) {
            logger.warn(`Could not cache PDF to storage: ${writeErr.message}`);
          }

          resolve(pdfBuffer);
        });

        doc.on('error', (err) => reject(err));

        // Colors
        const primaryColor = '#0F172A'; // Slate 900
        const tealColor = '#0D9488'; // Teal 600
        const darkTeal = '#115E59'; // Teal 800
        const mutedColor = '#64748B'; // Slate 500
        const borderColor = '#CBD5E1'; // Slate 300
        const bgLight = '#F8FAFC'; // Slate 50

        // ==========================================
        // 1. HEADER SECTION
        // ==========================================
        doc
          .rect(40, 40, 515, 60)
          .fillAndStroke(tealColor, tealColor);

        doc
          .fillColor('#FFFFFF')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('MediTrack+', 55, 52);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text('Smart Medication & Health Management System', 55, 73);

        const typeLabel = `${(report.reportType || 'Health').toUpperCase()} REPORT`;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(typeLabel, 400, 60, { width: 140, align: 'right' });

        doc.moveDown(3);

        // ==========================================
        // 2. PATIENT & PERIOD INFORMATION BOX
        // ==========================================
        const startDateStr = new Date(report.startDate).toLocaleDateString();
        const endDateStr = new Date(report.endDate).toLocaleDateString();
        const generatedDateStr = new Date(report.createdAt).toLocaleDateString();
        const patientName = report.patientInfo?.name || 'Authorized Patient';

        const infoBoxY = 115;
        doc
          .roundedRect(40, infoBoxY, 515, 65, 6)
          .fillAndStroke(bgLight, borderColor);

        doc.fillColor(primaryColor);

        // Column 1: Patient
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Patient Name:', 55, infoBoxY + 12)
          .font('Helvetica')
          .text(patientName, 130, infoBoxY + 12);

        if (report.patientInfo?.email) {
          doc
            .font('Helvetica-Bold')
            .text('Account Email:', 55, infoBoxY + 28)
            .font('Helvetica')
            .text(report.patientInfo.email, 130, infoBoxY + 28);
        }

        doc
          .font('Helvetica-Bold')
          .text('Report ID:', 55, infoBoxY + 44)
          .font('Helvetica')
          .text(report._id.toString(), 130, infoBoxY + 44);

        // Column 2: Period & Date
        doc
          .font('Helvetica-Bold')
          .text('Reporting Period:', 320, infoBoxY + 12)
          .font('Helvetica')
          .text(`${startDateStr} - ${endDateStr}`, 410, infoBoxY + 12);

        doc
          .font('Helvetica-Bold')
          .text('Generated Date:', 320, infoBoxY + 28)
          .font('Helvetica')
          .text(generatedDateStr, 410, infoBoxY + 28);

        doc
          .font('Helvetica-Bold')
          .text('Status:', 320, infoBoxY + 44)
          .font('Helvetica')
          .text('Verified Complete', 410, infoBoxY + 44);

        // ==========================================
        // 3. CLINICAL SUMMARY STATEMENT
        // ==========================================
        let cursorY = 195;
        doc
          .fillColor(darkTeal)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Summary Overview', 40, cursorY);

        cursorY += 16;
        doc
          .fillColor(primaryColor)
          .fontSize(9)
          .font('Helvetica')
          .text(report.summary || 'Periodic health telemetry compilation.', 40, cursorY, {
            width: 515,
            lineGap: 3,
          });

        cursorY = doc.y + 14;

        // ==========================================
        // 4. MEDICATION ADHERENCE SECTION
        // ==========================================
        doc
          .fillColor(darkTeal)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Medication Adherence Summary', 40, cursorY);

        cursorY += 18;

        const med = report.medicationSummary || {};
        const adhScore = med.adherenceScore !== null && med.adherenceScore !== undefined ? `${med.adherenceScore}%` : 'N/A';
        const adhCards = [
          { label: 'Scheduled', val: med.totalScheduled || 0 },
          { label: 'Taken', val: med.taken || 0 },
          { label: 'Missed', val: med.missed || 0 },
          { label: 'Skipped', val: med.skipped || 0 },
          { label: 'Adherence', val: adhScore },
        ];

        const cardWidth = 98;
        const cardGap = 6;
        adhCards.forEach((c, idx) => {
          const x = 40 + idx * (cardWidth + cardGap);
          doc
            .roundedRect(x, cursorY, cardWidth, 42, 4)
            .fillAndStroke(bgLight, borderColor);

          doc
            .fillColor(mutedColor)
            .fontSize(8)
            .font('Helvetica')
            .text(c.label, x + 5, cursorY + 8, { width: cardWidth - 10, align: 'center' });

          doc
            .fillColor(primaryColor)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(c.val.toString(), x + 5, cursorY + 22, { width: cardWidth - 10, align: 'center' });
        });

        cursorY += 56;

        // ==========================================
        // 5. HEALTH VITALS SECTION
        // ==========================================
        doc
          .fillColor(darkTeal)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Vital Measurements Overview', 40, cursorY);

        cursorY += 18;

        const health = report.healthSummary || {};
        const bpStr = health.latestBloodPressure?.systolic
          ? `${health.latestBloodPressure.systolic}/${health.latestBloodPressure.diastolic} mmHg`
          : 'None recorded';
        const bsStr = health.latestBloodSugar?.value
          ? `${health.latestBloodSugar.value} ${health.latestBloodSugar.unit || 'mg/dL'}`
          : 'None recorded';
        const wtStr = health.latestWeight?.value
          ? `${health.latestWeight.value} ${health.latestWeight.unit || 'kg'}`
          : 'None recorded';
        const hrStr = health.latestHeartRate?.value
          ? `${health.latestHeartRate.value} bpm`
          : 'None recorded';
        const tpStr = health.latestTemperature?.value
          ? `${health.latestTemperature.value} °${health.latestTemperature.unit || 'C'}`
          : 'None recorded';

        const vitalsRows = [
          ['Blood Pressure (Latest)', bpStr],
          ['Blood Glucose (Latest)', bsStr],
          ['Body Weight (Latest)', wtStr],
          ['Heart Rate (Latest)', hrStr],
          ['Body Temperature (Latest)', tpStr],
          ['Total Telemetry Entries', `${health.recordCount || 0} measurement records`],
        ];

        doc
          .rect(40, cursorY, 515, vitalsRows.length * 18 + 6)
          .fillAndStroke('#FFFFFF', borderColor);

        vitalsRows.forEach((row, i) => {
          const rowY = cursorY + 6 + i * 18;
          if (i % 2 === 1) {
            doc.rect(41, rowY - 2, 513, 18).fill(bgLight);
          }
          doc
            .fillColor(primaryColor)
            .fontSize(8.5)
            .font('Helvetica-Bold')
            .text(row[0], 55, rowY);
          doc
            .font('Helvetica')
            .text(row[1], 280, rowY);
        });

        cursorY += vitalsRows.length * 18 + 20;

        // ==========================================
        // 6. DOCTOR RECOMMENDATIONS SECTION
        // ==========================================
        // Only include patient-visible recommendations; private notes strictly excluded!
        if (report.recommendations && report.recommendations.length > 0) {
          doc
            .fillColor(darkTeal)
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Physician Care Recommendations', 40, cursorY);

          cursorY += 16;

          report.recommendations.forEach((rec, rIdx) => {
            if (cursorY > 700) {
              doc.addPage();
              cursorY = 50;
            }

            const recBoxY = cursorY;
            doc
              .roundedRect(40, recBoxY, 515, 46, 4)
              .fillAndStroke(bgLight, borderColor);

            const docName = rec.doctorName || 'Doctor';
            const spec = rec.specialization ? `(${rec.specialization})` : '';
            const priorityBadge = `[${(rec.priority || 'normal').toUpperCase()}]`;

            doc
              .fillColor(tealColor)
              .fontSize(9)
              .font('Helvetica-Bold')
              .text(`${priorityBadge} ${rec.title || 'Guidance'}`, 50, recBoxY + 8);

            doc
              .fillColor(mutedColor)
              .fontSize(8)
              .font('Helvetica')
              .text(`${docName} ${spec}`, 350, recBoxY + 8, { width: 195, align: 'right' });

            doc
              .fillColor(primaryColor)
              .fontSize(8.5)
              .font('Helvetica')
              .text(rec.content, 50, recBoxY + 22, { width: 495, lineBreak: true });

            cursorY += 52;
          });
        }

        // ==========================================
        // 7. MEDICAL DISCLAIMER & FOOTER
        // ==========================================
        if (cursorY > 720) {
          doc.addPage();
          cursorY = 50;
        }

        doc
          .roundedRect(40, 750, 515, 36, 4)
          .fillAndStroke('#FEF3C7', '#FDE68A');

        doc
          .fillColor('#92400E')
          .fontSize(7.5)
          .font('Helvetica')
          .text(
            'DISCLAIMER: This document is an automated longitudinal health telemetry report generated by MediTrack+ for informational and tracking purposes. It does not contain an automatic medical conclusion, diagnosis, or prescription.',
            50,
            756,
            { width: 495, lineGap: 2 }
          );

        doc
          .fillColor(mutedColor)
          .fontSize(8)
          .font('Helvetica')
          .text('Generated by MediTrack+ Smart Health System  •  Confidential Medical Telemetry', 40, 796, {
            width: 515,
            align: 'center',
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Get secure file path reference for database storage
   */
  getSafeFilePath: (reportId) => {
    return `storage/reports/report-${reportId}.pdf`;
  },
};

export default pdfReportService;
