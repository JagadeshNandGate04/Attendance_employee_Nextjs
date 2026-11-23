'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TopNav from '../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyCalendar, type CalendarEvent } from '../store/calendar/calendarSlice';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

function getEventLabel(event: CalendarEvent) {
  if (event.type === 'COMMON_HOLIDAY') return 'Common holiday';
  if (event.type === 'EMPLOYEE_HOLIDAY') return 'Employee holiday';
  if (event.type === 'PENDING_LEAVE') return 'Pending leave';
  return event.type.replaceAll('_', ' ').toLowerCase();
}

export default function HolidayPage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.calendar);
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState('');
  const [monthDirection, setMonthDirection] = useState(0);

  useEffect(() => {
    void dispatch(fetchMyCalendar({ month, year }));
  }, [dispatch, month, year]);

  const currentMonthDate = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const effectiveSelectedDate =
    selectedDate ||
    (data?.calendar.days.some((day) => day.date === currentMonthDate)
      ? currentMonthDate
      : data?.calendar.days[0]?.date || '');
  const selectedDay = useMemo(
    () => data?.calendar.days.find((day) => day.date === effectiveSelectedDate),
    [data, effectiveSelectedDate]
  );

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayMap = new Map(data?.calendar.days.map((day) => [day.date, day]) || []);
    const cells: Array<{ date: string; day: number; outside: boolean }> = [];

    for (let index = 0; index < firstDay; index += 1) {
      const date = new Date(year, month - 1, 1 - (firstDay - index));
      cells.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        day: date.getDate(),
        outside: true,
      });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        outside: false,
      });
    }
    while (cells.length % 7 !== 0) {
      const nextDate = new Date(year, month - 1, daysInMonth + (cells.length - firstDay - daysInMonth + 1));
      cells.push({
        date: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
        day: nextDate.getDate(),
        outside: true,
      });
    }

    return { cells, dayMap };
  }, [data, month, year]);

  const changeMonth = (offset: number) => {
    setMonthDirection(offset);
    const next = new Date(year, month - 1 + offset, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
    setSelectedDate('');
  };

  const events = data?.calendar.events || [];
  const holidayEvents = events.filter(
    (event) => event.type === 'COMMON_HOLIDAY' || event.type === 'EMPLOYEE_HOLIDAY'
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <svg className="h-full w-full object-cover opacity-90" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none">
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76" />
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96" />
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44" />
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288" />
        </svg>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 18, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] border border-[#ECE3D3]/90 bg-[#FCFAF7]/95 p-4 shadow-[0_24px_70px_rgba(72,60,45,0.12)] backdrop-blur-sm sm:rounded-[42px] sm:p-6 lg:p-8"
      >
        <TopNav active="holiday" />

        <motion.header
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="flex flex-col justify-between gap-4 border-b border-[#ECE3D3] pb-5 sm:flex-row sm:items-center"
        >
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#707C65]">EMPLOYEE CALENDAR</span>
            <h1 className="mt-1 text-3xl font-black text-stone-900 sm:text-4xl">Holiday Calendar</h1>
            <p className="mt-1 text-sm text-stone-600">View holidays, weekly offs, attendance, and pending leave.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5DDCE] bg-white text-lg font-black text-[#5D6953] shadow-xs transition active:scale-90 hover:-translate-x-0.5 hover:border-[#707C65] hover:bg-[#F6F8F3]">‹</button>
            <button type="button" onClick={() => { setMonthDirection(0); setMonth(today.getMonth() + 1); setYear(today.getFullYear()); setSelectedDate(''); }} className="rounded-xl border border-[#E5DDCE] bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-[#707C65] hover:bg-[#F6F8F3] active:scale-95">Today</button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5DDCE] bg-white text-lg font-black text-[#5D6953] shadow-xs transition active:scale-90 hover:translate-x-0.5 hover:border-[#707C65] hover:bg-[#F6F8F3]">›</button>
          </div>
        </motion.header>

        {error && (
          <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-sm font-bold text-[#C85D44]">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-white shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#E5DDCE] bg-[#F7F3EB] px-5 py-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${year}-${month}`}
                  initial={{ opacity: 0, x: monthDirection >= 0 ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: monthDirection >= 0 ? -24 : 24 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                <span className="text-xs font-black uppercase tracking-widest text-[#707C65]">{year}</span>
                <h2 className="text-2xl font-black text-stone-900">{MONTH_NAMES[month - 1]}</h2>
                </motion.div>
              </AnimatePresence>
              {loading && <span className="text-sm font-bold text-[#5D6953] animate-pulse">Loading…</span>}
            </div>

            <div className="p-3 sm:p-5">
              <div className="grid grid-cols-7 border-b border-[#ECE3D3] pb-3">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-black uppercase tracking-wider text-[#707C65]">{day}</div>
                ))}
              </div>
              <motion.div
                key={`grid-${year}-${month}`}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-7"
              >
                {calendarCells.cells.map((cell) => {
                  const dayData = calendarCells.dayMap.get(cell.date);
                  const commonHoliday = dayData?.events.find((event) => event.type === 'COMMON_HOLIDAY');
                  const employeeHoliday = dayData?.events.find((event) => event.type === 'EMPLOYEE_HOLIDAY');
                  const pendingLeave = dayData?.events.find((event) => event.type === 'PENDING_LEAVE');
                  const isSelected = effectiveSelectedDate === cell.date;
                  const isToday = cell.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                  return (
                    <motion.button
                      key={cell.date}
                      type="button"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(Number(cell.date.slice(-2)) * 0.008, 0.18), duration: 0.22 }}
                      whileHover={!cell.outside ? { y: -3, scale: 1.015 } : undefined}
                      whileTap={!cell.outside ? { scale: 0.97 } : undefined}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`relative min-h-20 border-b border-r border-[#ECE3D3] p-2 text-left transition sm:min-h-28 sm:p-3 ${
                        cell.outside ? 'bg-[#FAF8F4] text-stone-300' : 'bg-white hover:bg-[#F6F8F3]'
                      } ${isSelected ? 'z-10 ring-2 ring-inset ring-[#707C65]' : ''}`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${isToday ? 'bg-[#5D6953] text-white' : 'text-stone-800'}`}>{cell.day}</span>
                      <div className="mt-1 space-y-1">
                        {commonHoliday && <span className="inline-flex max-w-full truncate rounded-full border border-[#F2C5B7] bg-[#FEF1EC] px-2 py-1 text-[10px] font-black text-[#B84D38] sm:text-xs">{commonHoliday.name}</span>}
                        {employeeHoliday && <span className="inline-flex max-w-full truncate rounded-full border border-[#DDD1BB] bg-[#F3E9D8] px-2 py-1 text-[10px] font-black text-[#76512F] sm:text-xs">{employeeHoliday.name}</span>}
                        {pendingLeave && <span className="inline-flex max-w-full truncate rounded-full border border-[#CDD7C5] bg-[#EDF1E8] px-2 py-1 text-[10px] font-black text-[#46513F] sm:text-xs">Pending leave</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="flex flex-col gap-4"
          >
            <section className="overflow-hidden rounded-3xl border-2 border-[#D9E2D2] bg-white p-6 shadow-[0_16px_35px_rgba(72,60,45,0.10)]">
              <span className="inline-flex rounded-full border border-[#D9E2D2] bg-[#EAF0E6] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#46513F]">
                SELECTED DAY
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight text-stone-900 sm:text-[28px]">
                {effectiveSelectedDate ? new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${effectiveSelectedDate}T12:00:00`)) : 'Select a date'}
              </h3>
              <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div
                  key={effectiveSelectedDate}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-4 space-y-2"
                >
                  {selectedDay.events.length === 0 && (
                    <p className="rounded-xl bg-[#F7F3EB] px-3 py-2.5 text-sm font-medium text-stone-600">No calendar event</p>
                  )}
                  {selectedDay.events.map((event, index) => (
                    <div
                      key={`${event.type}-${index}`}
                      className="rounded-2xl border-2 border-[#F0C9BC] bg-[#FFF9F6] px-4 py-4 shadow-xs"
                    >
                        <p className="text-lg font-black text-stone-900">{event.name || getEventLabel(event)}</p>
                        <p className="mt-1.5 inline-flex rounded-full bg-[#F8DDD3] px-2.5 py-1 text-xs font-black text-[#A84A35]">{getEventLabel(event)}</p>
                        {event.type === 'PENDING_LEAVE' && <p className="mt-2 text-sm font-semibold text-stone-600">{formatEventDate(event.from_date || selectedDate)} – {formatEventDate(event.to_date || selectedDate)} · {event.days} day(s)</p>}
                      </div>
                  ))}
                </motion.div>
              ) : (
                <motion.p
                  key="empty-day"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-stone-500"
                >
                  Calendar details will appear here.
                </motion.p>
              )}
              </AnimatePresence>
            </section>

            <section className="rounded-3xl border-2 border-[#D9E2D2] bg-[#F7F3EB] p-6 shadow-[0_16px_35px_rgba(72,60,45,0.10)]">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-stone-900">This month</h3>
                <span className="rounded-full border border-[#CBD6C3] bg-[#5D6953] px-3.5 py-1.5 text-sm font-black text-white shadow-sm">{holidayEvents.length} holidays</span>
              </div>
              <div className="mt-3 space-y-2">
                {holidayEvents.length === 0 && <p className="text-sm text-stone-500">No holidays listed.</p>}
                {holidayEvents.map((event, index) => (
                  <motion.button
                    key={`${event.type}-${event.date}-${event.name}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.07 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => event.date && setSelectedDate(event.date)}
                    className="flex w-full items-center justify-between rounded-2xl border-2 border-[#ECE3D3] bg-white px-4 py-4 text-left shadow-xs transition hover:border-[#C87961]"
                  >
                    <span>
                      <span className="block text-base font-black text-stone-900">{event.name}</span>
                      <span className="mt-1 block text-sm font-semibold text-stone-500">{getEventLabel(event)}</span>
                    </span>
                    {event.date && <span className="ml-3 shrink-0 rounded-xl bg-[#FEF1EC] px-3 py-2 text-base font-black text-[#B84D38]">{formatEventDate(event.date)}</span>}
                  </motion.button>
                ))}
              </div>
            </section>
          </motion.aside>
        </div>
      </motion.main>
    </div>
  );
}
