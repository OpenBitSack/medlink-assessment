import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { GanttChart } from '../components/dashboard/GanttChart';
import type { PatientEvent } from '../types';

export function DashboardPage() {
  const [events, setEvents] = useState<PatientEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/sample_patient_data.csv')
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse<PatientEvent>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          transform: (value) => value.trim(),
        });
        setEvents(result.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-lighter bg-surface-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text-primary">MedLink</span>
            </a>
            <span className="text-text-muted text-xs">/ Clinician Dashboard</span>
          </div>
          <a
            href="/"
            className="text-xs text-primary-light hover:text-primary transition-colors"
          >
            ← Back to Interview
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Patient info card */}
        <div className="bg-surface-light rounded-2xl border border-surface-lighter p-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Patient Timeline</h1>
              <p className="text-text-secondary text-sm mt-0.5">Longitudinal health history — P001</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="bg-surface rounded-lg px-3 py-2 border border-surface-lighter">
                <span className="text-text-muted">Events</span>
                <p className="text-text-primary font-semibold mt-0.5">{events.length}</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 border border-surface-lighter">
                <span className="text-text-muted">Active</span>
                <p className="text-safe font-semibold mt-0.5">
                  {events.filter((e) => e.status === 'Active').length}
                </p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 border border-surface-lighter">
                <span className="text-text-muted">Timespan</span>
                <p className="text-text-primary font-semibold mt-0.5">
                  {events.length > 0
                    ? `${new Date(Math.min(...events.map((e) => new Date(e.start_date).getTime()))).getFullYear()} — Present`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <GanttChart events={events} />
        )}
      </main>
    </div>
  );
}
