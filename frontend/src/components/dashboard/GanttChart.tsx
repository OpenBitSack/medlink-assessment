import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatientEvent } from '../../types';

interface GanttChartProps {
  events: PatientEvent[];
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Medication|Psychiatric': { bg: '#7526c3', border: '#5a1d96', text: '#ffffff' },
  'Medication|Non-Psychiatric': { bg: '#0ea5e9', border: '#0284c7', text: '#ffffff' },
  'Medical Event': { bg: '#e11d48', border: '#be123c', text: '#ffffff' },
  'Social/Life Event': { bg: '#059669', border: '#047857', text: '#ffffff' },
};

function getEventColor(event: PatientEvent) {
  if (event.event_category === 'Medication') {
    return CATEGORY_COLORS[`Medication|${event.event_subcategory}`] || CATEGORY_COLORS['Medication|Psychiatric'];
  }
  return CATEGORY_COLORS[event.event_category] || { bg: '#6b7280', border: '#4b5563', text: '#ffffff' };
}

const ROW_HEIGHT = 34;
const LABEL_WIDTH = 260;
const YEAR_WIDTH = 240;
const MONTH_WIDTH = YEAR_WIDTH / 12;

export function GanttChart({ events }: GanttChartProps) {
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    showPsychMeds: true,
    showNonPsychMeds: true,
  });
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());
  const [tooltip, setTooltip] = useState<{ event: PatientEvent; x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filters.category !== 'all' && e.event_category !== filters.category) return false;
      if (filters.status !== 'all') {
        if (filters.status === 'Active' && e.status !== 'Active') return false;
        if (filters.status === 'Completed' && e.status !== 'Completed') return false;
      }
      if (e.event_category === 'Medication') {
        if (e.event_subcategory === 'Psychiatric' && !filters.showPsychMeds) return false;
        if (e.event_subcategory === 'Non-Psychiatric' && !filters.showNonPsychMeds) return false;
      }
      return true;
    });
  }, [events, filters]);

  const groups = useMemo(() => {
    const grouped: Record<string, PatientEvent[]> = {
      'Psychiatric Medication': [],
      'Non-Psychiatric Medication': [],
      'Medical Events': [],
      'Social/Life Events': [],
    };

    for (const e of filteredEvents) {
      if (e.event_category === 'Medication') {
        if (e.event_subcategory === 'Psychiatric') grouped['Psychiatric Medication'].push(e);
        else grouped['Non-Psychiatric Medication'].push(e);
      } else if (e.event_category === 'Medical Event') {
        grouped['Medical Events'].push(e);
      } else {
        grouped['Social/Life Events'].push(e);
      }
    }

    return Object.entries(grouped).filter(([, items]) => items.length > 0);
  }, [filteredEvents]);

  const { minYear, years } = useMemo(() => {
    if (events.length === 0) return { minYear: 2019, maxYear: 2024, years: [] as number[] };
    const dates = events.map((e) => new Date(e.start_date).getFullYear());
    const min = Math.min(...dates);
    const max = Math.max(...dates, today.getFullYear());
    const yrs = [];
    for (let y = min; y <= max; y++) yrs.push(y);
    return { minYear: min, maxYear: max, years: yrs };
  }, [events, today]);

  const dateToX = useCallback((dateStr: string): number => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const dayOfYear = Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000);
    const daysInYear = 365 + (year % 4 === 0 ? 1 : 0);
    const yearOffset = (year - minYear) * YEAR_WIDTH;

    if (collapsedYears.has(year)) {
      return yearOffset + 20;
    }

    return yearOffset + (dayOfYear / daysInYear) * YEAR_WIDTH;
  }, [minYear, collapsedYears]);

  const totalWidth = years.length * YEAR_WIDTH;

  const toggleYear = (year: number) => {
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const handleBarHover = (event: PatientEvent, e: React.MouseEvent) => {
    setTooltip({ event, x: e.clientX, y: e.clientY });
  };

  let rowIndex = 0;

  return (
    <div ref={containerRef} className="bg-surface-white rounded-xl border border-surface-border overflow-hidden shadow-sm relative">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-surface-border bg-surface/50">
        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Filter</span>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="bg-surface-white text-text-secondary text-xs rounded-md px-2.5 py-1.5 border border-surface-border focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
        >
          <option value="all">All Categories</option>
          <option value="Medication">Medications</option>
          <option value="Medical Event">Medical Events</option>
          <option value="Social/Life Event">Social/Life Events</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-surface-white text-text-secondary text-xs rounded-md px-2.5 py-1.5 border border-surface-border focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="h-4 w-px bg-surface-border" />

        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.showPsychMeds}
            onChange={(e) => setFilters({ ...filters, showPsychMeds: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-brand"
          />
          <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Psychiatric Meds</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.showNonPsychMeds}
            onChange={(e) => setFilters({ ...filters, showNonPsychMeds: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-[#0ea5e9]"
          />
          <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Non-Psychiatric Meds</span>
        </label>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 px-5 py-2.5 border-b border-surface-border bg-surface-white">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
            <span className="text-[11px] text-text-muted font-medium">
              {key.includes('|') ? key.split('|')[1] + ' Meds' : key}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-3 h-3 rounded border-2 border-dashed border-text-muted/40" />
          <span className="text-[11px] text-text-muted font-medium">Ongoing</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="overflow-x-auto relative" style={{ cursor: 'default' }}>
        <div style={{ minWidth: LABEL_WIDTH + totalWidth + 40 }}>
          {/* Year headers */}
          <div className="flex sticky top-0 z-10 bg-surface-white border-b border-surface-border">
            <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="shrink-0 px-5 flex items-center h-10 border-r border-surface-border">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Event</span>
            </div>
            <div className="flex">
              {years.map((year) => (
                <div
                  key={year}
                  style={{ width: collapsedYears.has(year) ? 40 : YEAR_WIDTH }}
                  className="border-r border-surface-border flex items-center justify-center h-10 cursor-pointer hover:bg-brand-bg/50 transition-colors"
                  onClick={() => toggleYear(year)}
                >
                  <span className="text-xs font-semibold text-text-secondary">
                    {year}
                    <span className="text-text-muted ml-1 text-[10px]">
                      {collapsedYears.has(year) ? '▸' : '▾'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Month markers */}
          <div className="flex border-b border-surface-border/60">
            <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="shrink-0 border-r border-surface-border" />
            <div className="flex">
              {years.map((year) =>
                collapsedYears.has(year) ? (
                  <div key={year} style={{ width: 40 }} className="border-r border-surface-border/30" />
                ) : (
                  <div key={year} className="flex" style={{ width: YEAR_WIDTH }}>
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                      <div
                        key={i}
                        style={{ width: MONTH_WIDTH }}
                        className="text-center text-[9px] text-text-muted/50 py-0.5 border-r border-surface-border/20"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Data rows */}
          {groups.map(([groupName, items]) => {
            return (
              <div key={groupName}>
                {/* Group header */}
                <div className="flex bg-surface-muted/50 border-b border-surface-border/40">
                  <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="shrink-0 px-5 py-2 border-r border-surface-border">
                    <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                      {groupName}
                    </span>
                  </div>
                  <div style={{ width: totalWidth }} />
                </div>

                {/* Event rows */}
                {items.map((event) => {
                  const color = getEventColor(event);
                  const startX = dateToX(event.start_date);
                  const endDate = event.end_date || today.toISOString().split('T')[0];
                  const isSingleDay = event.start_date === event.end_date || event.start_date === endDate;
                  const endX = isSingleDay ? startX + 10 : dateToX(endDate);
                  const width = Math.max(endX - startX, 8);
                  const isOngoing = !event.end_date;
                  rowIndex++;

                  return (
                    <div
                      key={event.event_id}
                      className="flex border-b border-surface-border/20 hover:bg-brand-bg/20 transition-colors"
                    >
                      <div
                        style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
                        className="shrink-0 px-5 flex items-center border-r border-surface-border"
                        title={event.event_name}
                      >
                        <div className="flex items-center gap-2">
                          {event.status === 'Active' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-safe shrink-0" />
                          )}
                          <span className="text-xs text-text-secondary truncate">{event.event_name}</span>
                        </div>
                      </div>
                      <div className="relative" style={{ width: totalWidth, height: ROW_HEIGHT }}>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 rounded cursor-pointer transition-all hover:brightness-110 hover:shadow-md"
                          style={{
                            left: startX,
                            width,
                            height: 20,
                            backgroundColor: color.bg,
                            borderLeft: `3px solid ${color.border}`,
                            opacity: isOngoing ? 0.85 : 1,
                            backgroundImage: isOngoing
                              ? `repeating-linear-gradient(90deg, transparent, transparent 8px, ${color.border}30 8px, ${color.border}30 12px)`
                              : undefined,
                          }}
                          onMouseEnter={(e) => handleBarHover(event, e)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {width > 60 && (
                            <span
                              className="absolute inset-0 flex items-center px-2 text-[10px] font-medium truncate"
                              style={{ color: color.text }}
                            >
                              {event.event_name}
                            </span>
                          )}
                          {isSingleDay && (
                            <div
                              className="absolute -top-0.5 -left-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                              style={{ backgroundColor: color.border }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

      </div>

      {/* Tooltip — fixed position so it's never clipped by overflow containers */}
      <AnimatePresence>
        {tooltip && (() => {
          const viewportH = window.innerHeight;
          const tooltipHeight = 180;
          const showAbove = tooltip.y + tooltipHeight > viewportH;
          const viewportW = window.innerWidth;
          const clampedX = Math.min(tooltip.x + 14, viewportW - 290);
          return (
          <motion.div
            initial={{ opacity: 0, y: showAbove ? -5 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: showAbove ? -5 : 5 }}
            className="fixed z-[100] bg-surface-white border border-surface-border rounded-xl shadow-xl p-4 max-w-xs pointer-events-none"
            style={{
              left: clampedX,
              top: showAbove ? tooltip.y - tooltipHeight - 8 : tooltip.y + 12,
            }}
          >
            <p className="text-sm font-serif font-semibold text-text-primary mb-1.5">{tooltip.event.event_name}</p>
            <div className="space-y-1 text-[11px] text-text-secondary">
              <p>
                <span className="text-text-muted font-medium">Category:</span>{' '}
                {tooltip.event.event_category}
                {tooltip.event.event_subcategory ? ` — ${tooltip.event.event_subcategory}` : ''}
              </p>
              <p>
                <span className="text-text-muted font-medium">Period:</span>{' '}
                {tooltip.event.start_date}
                {tooltip.event.end_date ? ` → ${tooltip.event.end_date}` : ' → Ongoing'}
              </p>
              <p>
                <span className="text-text-muted font-medium">Status:</span>{' '}
                <span className={tooltip.event.status === 'Active' ? 'text-safe font-medium' : ''}>
                  {tooltip.event.status}
                </span>
              </p>
              {tooltip.event.notes && (
                <p className="mt-1.5 text-text-muted italic leading-relaxed border-t border-surface-border pt-1.5">{tooltip.event.notes}</p>
              )}
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
