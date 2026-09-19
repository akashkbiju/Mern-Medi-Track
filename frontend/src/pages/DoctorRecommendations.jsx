import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  User,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { getDoctorRecommendations } from '../services/doctorNotesApi';
import Button from '../components/ui/Button';

const PRIORITY_BADGES = {
  normal: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Standard Guidance',
  },
  important: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Important Recommendation',
  },
  urgent: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    label: 'High Priority',
  },
};

export const DoctorRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (selectedPriority !== 'all') {
        params.priority = selectedPriority;
      }

      const res = await getDoctorRecommendations(params);
      setRecommendations(res.data?.recommendations || []);
      setPagination(
        res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve doctor recommendations.'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedPriority]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const filteredRecs = recommendations.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (rec.title && rec.title.toLowerCase().includes(q)) ||
      (rec.content && rec.content.toLowerCase().includes(q)) ||
      (rec.doctor?.fullName && rec.doctor.fullName.toLowerCase().includes(q)) ||
      (rec.doctor?.specialization && rec.doctor.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Doctor Recommendations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Care instructions, lifestyle advice, and health guidance published by your approved doctors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            className="py-1 px-3 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by topic, guidance, or physician name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Priority:</span>
          {['all', 'urgent', 'important', 'normal'].map((pri) => (
            <button
              key={pri}
              onClick={() => {
                setSelectedPriority(pri);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`py-1 px-3 rounded-lg capitalize text-xs font-semibold transition-all ${
                selectedPriority === pri
                  ? 'bg-teal-700 text-white shadow-2xs font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Doctor Recommendations Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedPriority !== 'all'
                ? 'No recommendations match your search filter criteria. Try adjusting your filters.'
                : 'Your connected doctors have not published any health recommendations yet. When they share instructions or care guidance, they will appear right here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => {
            const priorityConfig = PRIORITY_BADGES[rec.priority] || PRIORITY_BADGES.normal;
            const docName = rec.doctor?.fullName ? `Dr. ${rec.doctor.fullName}` : 'Connected Physician';
            const spec = rec.doctor?.specialization || 'Healthcare Provider';
            const hospital = rec.doctor?.hospital;
            const dateStr = new Date(rec.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={rec._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:border-teal-200 transition-all space-y-4"
              >
                {/* Header: Doctor info + Priority + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                      {rec.doctor?.fullName ? rec.doctor.fullName[0].toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{docName}</h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                          <Stethoscope className="h-3 w-3" />
                          {spec}
                        </span>
                        {hospital && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Building2 className="h-3 w-3" />
                            {hospital}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityConfig.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dot}`} />
                      {priorityConfig.label}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div>
                  {rec.title && (
                    <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                      {rec.title}
                    </h3>
                  )}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {rec.content}
                  </div>
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
            Showing <span className="font-semibold text-slate-800">{filteredRecs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.total}</span> recommendations
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
    </div>
  );
};

export default DoctorRecommendations;
