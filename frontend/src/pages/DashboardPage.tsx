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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text-primary">MedLink</span>
            </a>
            <div className="h-4 w-px bg-surface-border" />
            <span className="text-text-muted text-xs font-medium">Clinician Dashboard</span>
          </div>
          <a
            href="/"
            className="text-xs text-brand hover:text-brand-dark transition-colors font-medium"
          >
            ← Patient Interview
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* Patient info card */}
        <div className="bg-surface-white rounded-xl border border-surface-border p-5 mb-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-serif font-semibold text-text-primary">Patient Timeline</h1>
              <p className="text-text-secondary text-sm mt-0.5">Longitudinal health history — P001</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="bg-stat-bg text-white rounded-lg px-4 py-2.5 min-w-[80px]">
                <span className="text-white/70 text-[10px] uppercase tracking-wider">Events</span>
                <p className="font-bold text-lg mt-0.5">{events.length}</p>
              </div>
              <div className="bg-stat-bg text-white rounded-lg px-4 py-2.5 min-w-[80px]">
                <span className="text-white/70 text-[10px] uppercase tracking-wider">Active</span>
                <p className="font-bold text-lg mt-0.5 text-emerald-300">
                  {events.filter((e) => e.status === 'Active').length}
                </p>
              </div>
              <div className="bg-stat-bg text-white rounded-lg px-4 py-2.5 min-w-[80px]">
                <span className="text-white/70 text-[10px] uppercase tracking-wider">Span</span>
                <p className="font-bold text-sm mt-1">
                  {events.length > 0
                    ? `${new Date(Math.min(...events.map((e) => new Date(e.start_date).getTime()))).getFullYear()} — Now`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <GanttChart events={events} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-white border-t border-surface-border text-text-muted py-6 px-4 text-center text-xs">
        <p>© 2026 MedLink Global Inc. All rights reserved. — AI-Powered Precision Psychiatry Platform</p>
      </footer>
    </div>
  );
}
