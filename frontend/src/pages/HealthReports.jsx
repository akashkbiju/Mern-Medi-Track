import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  Pill,
  HeartPulse,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Stethoscope,
  Download,
} from 'lucide-react';
import {
  getReports,
  generateReport,
  getReportById,
  downloadReportPdf,
} from '../services/reportApi';
import Button from '../components/ui/Button';

const TYPE_STYLES = {
  weekly: {
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    label: 'Weekly Report',
  },
  monthly: {
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    label: 'Monthly Report',
  },
  custom: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    label: 'Custom Range',
  },
};

export const HealthReports = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal / Drawer States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Form State for Generate
  const [generateConfig, setGenerateConfig] = useState({
    reportType: 'weekly',
    startDate: '',
    endDate: '',
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getReports({
        page: pagination.page,
        limit: pagination.limit,
      });
      setReports(res.data?.reports || []);
      setPagination(
        res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load health reports history.'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle Generate Submit
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        reportType: generateConfig.reportType,
      };
      if (generateConfig.reportType === 'custom') {
        if (!generateConfig.startDate || !generateConfig.endDate) {
          setError('Start date and end date are required for custom reports.');
          setIsGenerating(false);
          return;
        }
        if (generateConfig.startDate > generateConfig.endDate) {
          setError('Start date cannot be after end date.');
          setIsGenerating(false);
          return;
        }
        payload.startDate = generateConfig.startDate;
        payload.endDate = generateConfig.endDate;
      }

      const res = await generateReport(payload);
      setShowGenerateModal(false);
      setFeedback({
        type: 'success',
        message: 'Health report generated successfully.',
      });
      fetchReports();
      if (res.data) {
        setSelectedReport(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to generate health report.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Full Report Details
  const handleViewReport = async (reportId) => {
    setViewLoading(true);
    try {
      const res = await getReportById(reportId);
      setSelectedReport(res.data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load report details.',
      });
    } finally {
      setViewLoading(false);
    }
  };

  // Download PDF Report
  const handleDownloadPdf = async (reportId, e) => {
    if (e) e.stopPropagation();
    setDownloadingId(reportId);
    try {
      const blob = await downloadReportPdf(reportId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediTrack-Report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedback({
        type: 'success',
        message: 'PDF report downloaded successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to download PDF report.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Health Reports & Analytics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured longitudinal reports summarizing medication adherence, recorded vitals, and physician guidance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setError(null);
              setShowGenerateModal(true);
            }}
            className="py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reports List Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <FileText className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Health Reports Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Generate periodic health reports to consolidate your medication adherence rate, vital metrics trends, and active physician recommendations.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateModal(true)}
              className="py-2 px-4 text-xs font-semibold"
            >
              Generate First Report
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rpt) => {
            const typeConfig = TYPE_STYLES[rpt.reportType] || TYPE_STYLES.weekly;
            const startDateStr = new Date(rpt.startDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const endDateStr = new Date(rpt.endDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const generatedDateStr = new Date(rpt.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const adhScore = rpt.medicationSummary?.adherenceScore;

            return (
              <div
                key={rpt._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badge}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {startDateStr} — {endDateStr}
                      </span>
                      {adhScore !== null && adhScore !== undefined && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {adhScore}% Adherence
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                      {rpt.summary || 'Periodic health telemetry compilation.'}
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <Clock className="h-3 w-3" />
                      Generated {generatedDateStr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDownloadPdf(rpt._id, e)}
                    disabled={downloadingId === rpt._id}
                    className="py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-700 hover:text-teal-700 hover:bg-slate-50"
                  >
                    {downloadingId === rpt._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(rpt._id)}
                    className="py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1 text-teal-700 hover:bg-teal-50"
                  >
                    View Report
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{reports.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.total}</span> reports
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(pagination.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* GENERATE REPORT MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 max-w-md w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Generate Health Report
                </h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Report Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'weekly', label: 'Weekly (7d)' },
                    { type: 'monthly', label: 'Monthly (30d)' },
                    { type: 'custom', label: 'Custom' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() =>
                        setGenerateConfig({ ...generateConfig, reportType: item.type })
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        generateConfig.reportType === item.type
                          ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {generateConfig.reportType === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <label htmlFor="custom-report-start" className="block font-medium text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      id="custom-report-start"
                      type="date"
                      required
                      value={generateConfig.startDate}
                      onChange={(e) =>
                        setGenerateConfig({ ...generateConfig, startDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-report-end" className="block font-medium text-slate-600 mb-1">
                      End Date
                    </label>
                    <input
                      id="custom-report-end"
                      type="date"
                      required
                      value={generateConfig.endDate}
                      onChange={(e) =>
                        setGenerateConfig({ ...generateConfig, endDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Health reports compile eligible dose adherence, vital statistics, and active physician guidance. No medical conclusions or diagnoses are automatically formed.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isGenerating}
                  className="flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Compiling Telemetry...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT DETAIL DRAWER / MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      TYPE_STYLES[selectedReport.reportType]?.badge || TYPE_STYLES.weekly.badge
                    }`}
                  >
                    {selectedReport.reportType.toUpperCase()} HEALTH REPORT
                  </span>
                  <span className="text-xs text-slate-400">
                    Generated {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {new Date(selectedReport.startDate).toLocaleDateString()} —{' '}
                  {new Date(selectedReport.endDate).toLocaleDateString()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-teal-950 block mb-1">Summary Overview:</span>
              {selectedReport.summary}
            </div>

            {/* Medication Adherence Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-teal-600" />
                Medication Adherence Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Scheduled Doses</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedReport.medicationSummary?.totalScheduled || 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-medium">Taken</span>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">
                    {selectedReport.medicationSummary?.taken || 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-700 font-medium">Missed / Skipped</span>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">
                    {(selectedReport.medicationSummary?.missed || 0) +
                      (selectedReport.medicationSummary?.skipped || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
                  <span className="text-[11px] text-teal-700 font-medium">Adherence Score</span>
                  <p className="text-lg font-bold text-teal-900 mt-0.5">
                    {selectedReport.medicationSummary?.adherenceScore !== null
                      ? `${selectedReport.medicationSummary.adherenceScore}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Health Vitals Summary Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                Latest Vitals Overview
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Blood Pressure</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.latestBloodPressure?.systolic
                      ? `${selectedReport.healthSummary.latestBloodPressure.systolic}/${selectedReport.healthSummary.latestBloodPressure.diastolic} mmHg`
                      : 'No log recorded'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Blood Glucose</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.latestBloodSugar?.value
                      ? `${selectedReport.healthSummary.latestBloodSugar.value} ${selectedReport.healthSummary.latestBloodSugar.unit}`
                      : 'No log recorded'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Weight</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.latestWeight?.value
                      ? `${selectedReport.healthSummary.latestWeight.value} ${selectedReport.healthSummary.latestWeight.unit}`
                      : 'No log recorded'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Heart Rate</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.latestHeartRate?.value
                      ? `${selectedReport.healthSummary.latestHeartRate.value} bpm`
                      : 'No log recorded'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Temperature</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.latestTemperature?.value
                      ? `${selectedReport.healthSummary.latestTemperature.value} °${selectedReport.healthSummary.latestTemperature.unit}`
                      : 'No log recorded'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Total Vitals Logs</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedReport.healthSummary?.recordCount || 0} entries
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Recommendations in Report */}
            {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-teal-600" />
                  Active Doctor Recommendations
                </h4>
                <div className="space-y-2.5">
                  {selectedReport.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rec.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {rec.doctorName} ({rec.specialization})
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{rec.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400 italic">
                Compiled by MediTrack+ Healthcare System
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => handleDownloadPdf(selectedReport._id, e)}
                  disabled={downloadingId === selectedReport._id}
                  className="flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold"
                >
                  {downloadingId === selectedReport._id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  Close Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthReports;
