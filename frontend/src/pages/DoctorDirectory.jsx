import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Stethoscope,
  Building,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { searchDoctors, sendConnectionRequest, getPatientPendingRequests, getPatientConnections } from '../services/connectionApi';
import DoctorCard from '../components/doctor/DoctorCard';
import Button from '../components/ui/Button';

const SPECIALIZATIONS = [
  'All Specialties',
  'Cardiology',
  'General Medicine',
  'Endocrinology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Psychiatry',
  'Gastroenterology',
  'Pulmonology',
];

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [statusMap, setStatusMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('All Specialties');
  const [hospital, setHospital] = useState('');

  // Fetch connection status for patient
  const fetchConnectionStatuses = useCallback(async () => {
    try {
      const [pendingRes, connectedRes] = await Promise.all([
        getPatientPendingRequests(),
        getPatientConnections(),
      ]);

      const map = new Map();
      if (pendingRes?.data) {
        pendingRes.data.forEach((req) => {
          if (req.doctor?.id) map.set(req.doctor.id, 'pending');
        });
      }
      if (connectedRes?.data) {
        connectedRes.data.forEach((conn) => {
          if (conn.doctor?.id) map.set(conn.doctor.id, 'approved');
        });
      }
      setStatusMap(map);
    } catch {
      // Non-critical background status sync
    }
  }, []);

  // Fetch doctors list
  const fetchDoctors = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
        };
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (specialization && specialization !== 'All Specialties') {
          params.specialization = specialization;
        }
        if (hospital.trim()) params.hospital = hospital.trim();

        const response = await searchDoctors(params);
        setDoctors(response.data.doctors || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Unable to retrieve doctors directory.',
        });
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, specialization, hospital]
  );

  useEffect(() => {
    fetchDoctors(1);
    fetchConnectionStatuses();
  }, [fetchDoctors, fetchConnectionStatuses]);

  const handleConnect = async (doctorId) => {
    setConnectingId(doctorId);
    setFeedback(null);
    try {
      await sendConnectionRequest(doctorId);
      setStatusMap((prev) => new Map(prev).set(doctorId, 'pending'));
      setFeedback({
        type: 'success',
        message: 'Connection request sent successfully. The physician will be notified.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send connection request.',
      });
    } finally {
      setConnectingId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSpecialization('All Specialties');
    setHospital('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <Stethoscope className="h-3.5 w-3.5" />
              Physician Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Find a Doctor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Connect with verified healthcare professionals to coordinate your care and medication regimen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              fetchDoctors(pagination.page);
              fetchConnectionStatuses();
            }}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by physician name or keyword..."
              className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all"
            />
          </div>

          {/* Specialty Dropdown */}
          <div>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all bg-white"
            >
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Hospital/Clinic name..."
              className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Doctors Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              No healthcare providers match your current search parameters. Try broadening your criteria or reset your filters.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="py-2 px-4 text-xs font-semibold"
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doctor) => {
            const currentStatus = statusMap.get(doctor.id) || 'none';
            return (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                status={currentStatus}
                onConnect={handleConnect}
                isConnecting={connectingId === doctor.id}
              />
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.pages}</span> ({pagination.total} doctors)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchDoctors(pagination.page - 1)}
              className="py-1.5 px-3 text-xs font-semibold"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchDoctors(pagination.page + 1)}
              className="py-1.5 px-3 text-xs font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDirectory;
