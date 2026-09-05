import { Link } from 'react-router-dom';
import { Activity, Shield, Bell, BarChart, Smartphone } from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 py-4 px-6 sm:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Activity className="text-secondary" />
          MediTrack+
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" to="/login">Login</Button>
          <Button variant="primary" to="/register">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
              Smart Medication & Health Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Manage your medicines, monitor your health, track medication adherence, and securely connect with healthcare professionals.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button to="/register" className="px-8 py-3 text-lg">
                Get Started
              </Button>
              <Link to="/login" className="text-sm font-semibold leading-6 text-primary hover:text-primary-light">
                Login <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Section with UI Preview */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-secondary">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                A professional healthcare dashboard
              </p>
            </div>
            
            <div className="mt-16 sm:mt-20 lg:mt-24">
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-8 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mock Cards for Preview */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                      <Bell size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Upcoming Reminder</p>
                      <p className="text-xl font-bold">8:00 AM</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-success/10 p-3 rounded-full text-success">
                      <BarChart size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Adherence</p>
                      <p className="text-xl font-bold">92%</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Health Status</p>
                      <p className="text-xl font-bold">Optimal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-primary">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Bell className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Smart Medication Reminders
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Never miss a dose with our intelligent reminder system that adapts to your schedule.</dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-primary">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <BarChart className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Medication Adherence
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Track your consistency visually and see your health habits improve over time.</dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-primary">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Privacy & Security
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Your health data is encrypted and securely stored. We prioritize your privacy above all else.</dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-primary">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Smartphone className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Accessible Anywhere
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">Access your dashboard on desktop, tablet, or mobile with our fully responsive design.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary py-12">
        <div className="mx-auto max-w-7xl px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-slate-400">
              &copy; 2026 MediTrack+. All rights reserved. (Demo Project)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
