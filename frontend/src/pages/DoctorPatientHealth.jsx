import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Activity,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  RefreshCw,
  Scale,
  Droplets,
  Heart,
  Thermometer,
} from 'lucide-react';
import {
  getPatientHealthRecords,
  getPatientHealthSummary,
  getPatientHealthAnalytics,
  getPatientContext,
} from '../services/doctorHealthApi';
import HealthMetricCard from '../components/health/HealthMetricCard';
import HealthChart from '../components/health/HealthChart';
import PatientHealthRecords from '../components/doctor/PatientHealthRecords';
import Button from '../components/ui/Button';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
];

export const DoctorPatientHealth = () => {
  const { patientId } = useParams();

  // State
  const [patientInfo, setPatientInfo] = useState(null);
  const [connectionContext, setConnectionContext] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recordsData, setRecordsData] = useState({
    records: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });

  // Query Controls
  const [selectedMetric, setSelectedMetric] = useState('all'); // 'all' | 'weight' | 'bloodPressure' | etc.
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [recordFilters, setRecordFilters] = useState({ startDate: '', endDate: '', metric: '' });
  const [page, setPage] = useState(1);

  // Status & Error handling
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(null); // { message }
  const [generalError, setGeneralError] = useState(null);

  /**
   * Fetch patient metadata and high-level health summary
   */
  const loadPatientOverview = useCallback(async () => {
    setLoading(true);
    setAccessDenied(null);
    setGeneralError(null);

    try {
      const [contextRes, summaryRes] = await Promise.all([
        getPatientContext(patientId),
        getPatientHealthSummary(patientId),
      ]);

      setConnectionContext(contextRes.data);
      setPatientInfo(contextRes.data.patient || summaryRes.data.patient);
      setSummaryData(summaryRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied({
          message:
            err.response.data?.message ||
            "You do not have permission to view this patient's health records.",
        });
      } else {
        setGeneralError(
          err.response?.data?.message || 'Unable to retrieve patient health overview.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  /**
   * Fetch trend analytics based on period and selected metric
   */
  const loadAnalytics = useCallback(async () => {
    if (accessDenied) return;
    setAnalyticsLoading(true);

    try {
      const params = {
        metric: selectedMetric,
        period,
      };

      if (period === 'custom') {
        if (!customRange.startDate || !customRange.endDate) {
          setAnalyticsLoading(false);
          return;
        }
        params.startDate = customRange.startDate;
        params.endDate = customRange.endDate;
      }

      const res = await getPatientHealthAnalytics(patientId, params);
      setAnalyticsData(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied({
          message:
            err.response.data?.message ||
            "You do not have permission to view this patient's health records.",
        });
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [patientId, period, customRange, selectedMetric, accessDenied]);

  /**
   * Fetch paginated records history
   */
  const loadRecords = useCallback(async () => {
    if (accessDenied) return;
    setRecordsLoading(true);

    try {
      const params = {
        page,
        limit: 20,
      };
      if (recordFilters.startDate) params.startDate = recordFilters.startDate;
      if (recordFilters.endDate) params.endDate = recordFilters.endDate;
      if (recordFilters.metric) params.metric = recordFilters.metric;

      const res = await getPatientHealthRecords(patientId, params);
      setRecordsData({
        records: res.data.records || [],
        pagination: res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
      });
      if (res.data.patient && !patientInfo) {
        setPatientInfo(res.data.patient);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied({
          message:
            err.response.data?.message ||
            "You do not have permission to view this patient's health records.",
        });
      }
    } finally {
      setRecordsLoading(false);
    }
  }, [patientId, page, recordFilters, accessDenied, patientInfo]);

  // Initial load
  useEffect(() => {
    loadPatientOverview();
  }, [loadPatientOverview]);

  // Analytics load upon filter change
  useEffect(() => {
    if (!accessDenied) {
      loadAnalytics();
    }
  }, [loadAnalytics, accessDenied]);

  // Records load upon pagination/filter change
  useEffect(() => {
    if (!accessDenied) {
      loadRecords();
    }
  }, [loadRecords, accessDenied]);

  // Period change handler
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Custom date range submit
  const handleCustomRangeApply = (e) => {
    e.preventDefault();
    if (customRange.startDate && customRange.endDate) {
      if (customRange.startDate > customRange.endDate) {
        alert('Start date cannot be after end date.');
        return;
      }
      loadAnalytics();
    }
  };

  // Record filters update
  const handleRecordFilterChange = (newFilters) => {
    setPage(1);
    setRecordFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetRecordFilters = () => {
    setPage(1);
    setRecordFilters({ startDate: '', endDate: '', metric: '' });
  };

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        <div className="h-28 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  // ACCESS DENIED / UNAUTHORIZED STATE
  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Health record access unavailable</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{accessDenied.message}</p>
        </div>
        <div className="pt-2">
          <Link to="/doctor/connections">
            <Button variant="primary" className="py-2.5 px-5 text-xs font-semibold">
              Return to Connected Patients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // GENERAL ERROR STATE
  if (generalError) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Patient Health Information Error</h2>
        <p className="text-xs text-slate-500">{generalError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPatientOverview}
          className="py-2 px-4 text-xs font-semibold"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  const latestMetrics = summaryData?.latest || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Link
            to="/doctor/connections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Connected Patients
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-xs flex-shrink-0">
              {patientInfo?.fullName ? patientInfo.fullName[0].toUpperCase() : <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {patientInfo?.fullName || 'Connected Patient'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <ShieldCheck className="h-3 w-3" />
                  Connected
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Activity className="h-3 w-3" />
                  Health Records Access: Enabled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                {patientInfo?.gender && (
                  <span className="capitalize">Gender: {patientInfo.gender}</span>
                )}
                {patientInfo?.dateOfBirth && (
                  <span>DOB: {new Date(patientInfo.dateOfBirth).toLocaleDateString()}</span>
                )}
                <span>Total Records: {summaryData?.recordCount || 0}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                loadPatientOverview();
                loadAnalytics();
                loadRecords();
              }}
              className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Health Summary Cards Row */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Latest Recorded Vitals
          </h2>
          <span className="text-xs text-slate-400">Click a card to highlight trend below</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Weight Card */}
          <HealthMetricCard
            metricKey="weight"
            data={latestMetrics.weight || {}}
            isSelected={selectedMetric === 'weight'}
            onClick={() => setSelectedMetric(selectedMetric === 'weight' ? 'all' : 'weight')}
          />

          {/* Blood Pressure Card */}
          <HealthMetricCard
            metricKey="bloodPressure"
            data={latestMetrics.bloodPressure || {}}
            isSelected={selectedMetric === 'bloodPressure'}
            onClick={() =>
              setSelectedMetric(selectedMetric === 'bloodPressure' ? 'all' : 'bloodPressure')
            }
          />

          {/* Blood Sugar Card */}
          <HealthMetricCard
            metricKey="bloodSugar"
            data={latestMetrics.bloodSugar || {}}
            isSelected={selectedMetric === 'bloodSugar'}
            onClick={() =>
              setSelectedMetric(selectedMetric === 'bloodSugar' ? 'all' : 'bloodSugar')
            }
          />

          {/* Heart Rate Card */}
          <HealthMetricCard
            metricKey="heartRate"
            data={latestMetrics.heartRate || {}}
            isSelected={selectedMetric === 'heartRate'}
            onClick={() =>
              setSelectedMetric(selectedMetric === 'heartRate' ? 'all' : 'heartRate')
            }
          />

          {/* Temperature Card */}
          <HealthMetricCard
            metricKey="temperature"
            data={latestMetrics.temperature || {}}
            isSelected={selectedMetric === 'temperature'}
            onClick={() =>
              setSelectedMetric(selectedMetric === 'temperature' ? 'all' : 'temperature')
            }
          />
        </div>
      </div>

      {/* Health Analytics Trends Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Patient Vital Trends
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous longitudinal data visualization across clinical monitoring periods
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePeriodChange(opt.value)}
                  className={`py-1.5 px-3 rounded-lg transition-all ${
                    period === opt.value
                      ? 'bg-white text-teal-700 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Range Picker when period is 'custom' */}
        {period === 'custom' && (
          <form
            onSubmit={handleCustomRangeApply}
            className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-start-date" className="font-medium text-slate-600">
                Start:
              </label>
              <input
                id="analytics-start-date"
                type="date"
                value={customRange.startDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="analytics-end-date" className="font-medium text-slate-600">
                End:
              </label>
              <input
                id="analytics-end-date"
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="py-1 px-3 text-xs font-semibold"
            >
              Apply Range
            </Button>
          </form>
        )}

        {/* Charts Display */}
        {analyticsLoading ? (
          <div className="h-72 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-xs text-slate-400 font-medium">Generating trend charts...</p>
          </div>
        ) : !analyticsData || !analyticsData.data || analyticsData.data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            <Activity className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium">
              No trend telemetry recorded for the selected monitoring window.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedMetric === 'all' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthChart metric="weight" data={analyticsData.data} />
                <HealthChart metric="bloodPressure" data={analyticsData.data} />
                <HealthChart metric="bloodSugar" data={analyticsData.data} />
                <HealthChart metric="heartRate" data={analyticsData.data} />
                <div className="lg:col-span-2">
                  <HealthChart metric="temperature" data={analyticsData.data} />
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <HealthChart metric={selectedMetric} data={analyticsData.data} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patient Health Records Table */}
      <PatientHealthRecords
        records={recordsData.records}
        pagination={recordsData.pagination}
        loading={recordsLoading}
        onPageChange={(newPage) => setPage(newPage)}
        filters={recordFilters}
        onFilterChange={handleRecordFilterChange}
        onResetFilters={handleResetRecordFilters}
      />
    </div>
  );
};

export default DoctorPatientHealth;
