import { reportService } from '../services/reportService.js';
import { pdfReportService } from '../services/pdfReportService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health Reports Controller
 */

/**
 * @desc    Generate a structured health report
 * @route   POST /api/reports/generate
 * @access  Private (Patient only)
 */
export const generateReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reportType, startDate, endDate } = req.body;

  const report = await reportService.generateReport({
    userId,
    reportType,
    startDate,
    endDate,
    generatedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, report, 'Health report generated successfully'));
});

/**
 * @desc    Get paginated health reports for authenticated user
 * @route   GET /api/reports
 * @access  Private (Patient only)
 */
export const getReports = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, reportType } = req.query;

  const result = await reportService.getUserReports(userId, {
    page,
    limit,
    reportType,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Health reports retrieved successfully'));
});

/**
 * @desc    Get latest health report for authenticated user
 * @route   GET /api/reports/latest
 * @access  Private (Patient only)
 */
export const getLatestReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const report = await reportService.getLatestReport(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Latest health report retrieved successfully'));
});

/**
 * @desc    Get a single health report by ID (Patient or authorized Doctor)
 * @route   GET /api/reports/:id
 * @access  Private
 */
export const getReportById = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const requestingUser = { id: req.user.id, role: req.user.role };

  const report = await reportService.getReportById(reportId, requestingUser);

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Health report retrieved successfully'));
});

/**
 * @desc    Stream health report as PDF inline
 * @route   GET /api/reports/:id/pdf
 * @access  Private (Patient or authorized Doctor)
 */
export const getReportPdf = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const requestingUser = { id: req.user.id, role: req.user.role };

  const report = await reportService.getReportById(reportId, requestingUser);
  const pdfBuffer = await pdfReportService.generateReportPDF(report);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="MediTrack-Report-${reportId}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.status(200).send(pdfBuffer);
});

/**
 * @desc    Download health report as PDF attachment
 * @route   GET /api/reports/:id/download
 * @access  Private (Patient or authorized Doctor)
 */
export const downloadReportPdf = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const requestingUser = { id: req.user.id, role: req.user.role };

  const report = await reportService.getReportById(reportId, requestingUser);
  const pdfBuffer = await pdfReportService.generateReportPDF(report);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="MediTrack-Report-${reportId}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.status(200).send(pdfBuffer);
});

export default {
  generateReport,
  getReports,
  getLatestReport,
  getReportById,
  getReportPdf,
  downloadReportPdf,
};

