import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Users, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Could not load users. Please check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  const verifyDoctor = async (doctorId) => {
    try {
      setVerifyingId(doctorId);
      await api.put(`/admin/doctors/${doctorId}/verify`);
      // Update local state to reflect the verification
      setUsers(users.map(u => {
        if (u._id === doctorId) {
          return { ...u, isVerified: true }; // Just simulating the update
        }
        return u;
      }));
      // Fetch fresh data just in case
      fetchUsers();
    } catch (err) {
      console.error('Failed to verify doctor:', err);
      alert(err.response?.data?.message || 'Failed to verify doctor. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const doctors = users.filter((u) => u.role === 'doctor');
  const patients = users.filter((u) => u.role === 'patient');
  const admins = users.filter((u) => u.role === 'admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage users and verify doctor credentials.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Doctors</p>
            <p className="text-2xl font-bold text-slate-900">{doctors.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Administrators</p>
            <p className="text-2xl font-bold text-slate-900">{admins.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-slate-500" />
            Doctor Verification Queue
          </h2>
          <button
            onClick={fetchUsers}
            className="text-sm text-primary hover:text-primary-dark font-medium"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="p-6">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Loading users...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p>No doctors registered in the system yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="pb-3 font-medium px-4">Doctor Name</th>
                    <th className="pb-3 font-medium px-4">Email</th>
                    <th className="pb-3 font-medium px-4">Status</th>
                    <th className="pb-3 font-medium px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doctor) => {
                    // isVerified is returned directly on the doctor object via the safeUser augmentation
                    const isVerified = Boolean(doctor.isVerified);

                    return (
                      <tr key={doctor._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">{doctor.fullName}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">{doctor.email}</td>
                        <td className="py-4 px-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Shield className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {!isVerified ? (
                            <button
                              onClick={() => verifyDoctor(doctor._id)}
                              disabled={verifyingId === doctor._id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {verifyingId === doctor._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Verifying
                                </>
                              ) : (
                                'Verify Doctor'
                              )}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Approved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
