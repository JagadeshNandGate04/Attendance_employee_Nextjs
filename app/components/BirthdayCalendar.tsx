'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Cake, ChevronLeft, ChevronRight, Gift, Sparkles } from 'lucide-react';
import type { BirthdayCalendarData, EmployeeBirthday } from '../store/dashboard/dashboardSlice';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_OFFSETS = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const getDaysInMonth = (year: number, month: number) => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const getFirstWeekday = (year: number, month: number) => {
  const adjustedYear = month < 3 ? year - 1 : year;
  return (
    adjustedYear +
    Math.floor(adjustedYear / 4) -
    Math.floor(adjustedYear / 100) +
    Math.floor(adjustedYear / 400) +
    WEEKDAY_OFFSETS[month - 1] +
    1
  ) % 7;
};

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function BirthdayCalendar({
  data,
  loading,
  error,
  onRetry,
}: {
  data: BirthdayCalendarData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(1);
  const [today, setToday] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const birthdays = data?.birthdays ?? [];

  useEffect(() => {
    const now = new Date();
    const currentDate = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
    setToday(currentDate);
    setViewMonth(currentDate.month);
  }, []);

  const monthBirthdays = useMemo(
    () => birthdays.filter((birthday) => birthday.month === viewMonth).sort((a, b) => a.day - b.day || a.name.localeCompare(b.name)),
    [birthdays, viewMonth],
  );
  const birthdaysByDay = useMemo(() => {
    const grouped = new Map<number, EmployeeBirthday[]>();
    monthBirthdays.forEach((birthday) => {
      grouped.set(birthday.day, [...(grouped.get(birthday.day) ?? []), birthday]);
    });
    return grouped;
  }, [monthBirthdays]);
  const calendarYear = today?.year ?? 2024;
  const daysInMonth = getDaysInMonth(calendarYear, viewMonth);
  const firstWeekday = getFirstWeekday(calendarYear, viewMonth);
  const activeDay = selectedDay ?? (viewMonth === today?.month ? today.day : monthBirthdays[0]?.day ?? 1);
  const activeBirthdays = birthdaysByDay.get(activeDay) ?? [];

  const changeMonth = (step: number) => {
    setViewMonth((current) => ((current - 1 + step + 12) % 12) + 1);
    setSelectedDay(null);
  };

  return (
    <section className="relative isolate overflow-hidden rounded-[30px] border border-[#E8DCCB] bg-[#FFFDF9] shadow-[0_18px_50px_rgba(87,68,46,0.08)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-[#FCE6DB] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 h-64 w-64 rounded-full bg-[#E9EFDF] opacity-80 blur-3xl" />

      <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div
                initial={shouldReduceMotion ? false : { rotate: -12, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FCE9E1] text-[#C85D44] shadow-sm"
              >
                <Cake className="h-6 w-6" aria-hidden="true" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] text-[#B66A4F] uppercase">Little moments, big celebrations</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#34372F] sm:text-3xl">Birthday calendar</h2>
                <p className="mt-1 text-sm text-stone-500">Make someone’s day a little brighter.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E6EBDf] bg-white/80 px-4 py-2 text-right shadow-xs">
              <p className="text-2xl font-black leading-none text-[#5D6953]">{monthBirthdays.length}</p>
              <p className="mt-1 text-[10px] font-extrabold tracking-widest text-stone-500 uppercase">This month</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-2xl bg-[#F7F4EC] px-3 py-2.5 sm:px-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-600 transition hover:bg-white hover:text-[#C85D44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85D44]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={viewMonth}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -7 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                className="text-lg font-black text-[#34372F]"
              >
                {MONTHS[viewMonth - 1]}
              </motion.h3>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-600 transition hover:bg-white hover:text-[#C85D44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85D44]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label={`${MONTHS[viewMonth - 1]} birthday calendar`}>
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} aria-hidden="true" className="pb-2 text-center text-[10px] font-black tracking-wider text-stone-400 uppercase sm:text-xs">
                {weekday}
              </div>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => (
              <div key={`blank-${index}`} role="presentation" />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const people = birthdaysByDay.get(day) ?? [];
              const isSelected = day === activeDay;
              const isToday = viewMonth === today?.month && day === today.day;
              return (
                <motion.button
                  key={`${viewMonth}-${day}`}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${MONTHS[viewMonth - 1]} ${day}${people.length ? `, ${people.length} ${people.length === 1 ? 'birthday' : 'birthdays'}` : ''}`}
                  onClick={() => setSelectedDay(day)}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : index * 0.008 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                  className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl border text-sm font-bold transition sm:min-h-14 ${
                    isSelected
                      ? 'border-[#C85D44] bg-[#C85D44] text-white shadow-[0_7px_16px_rgba(200,93,68,0.24)]'
                      : people.length
                        ? 'border-[#F2D8CE] bg-[#FFF5F0] text-[#70483D] hover:border-[#D98A72]'
                        : 'border-transparent bg-white/70 text-stone-600 hover:border-[#E9E2D6] hover:bg-white'
                  }`}
                >
                  {isToday && <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#5D6953]'}`} />}
                  <span>{day}</span>
                  {people.length > 0 && (
                    <span className={`mt-0.5 flex items-center gap-0.5 ${isSelected ? 'text-white/90' : 'text-[#C85D44]'}`} aria-hidden="true">
                      {Array.from({ length: Math.min(people.length, 3) }, (_, dot) => <span key={dot} className="h-1 w-1 rounded-full bg-current" />)}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-stone-500">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#C85D44]" />Today</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#F1C5B5]" />Birthday</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[#B66A4F]"><Sparkles className="h-3.5 w-3.5" />Select a date to celebrate</span>
          </div>
        </div>

        <aside className="relative flex min-h-[300px] flex-col overflow-hidden bg-[#5D6953] p-5 text-white sm:p-7 lg:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-1 top-0 h-28 w-28 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-2 text-[#E1E9D8]">
            <Gift className="h-4 w-4" />
            <p className="text-xs font-black tracking-[0.18em] uppercase">On the celebration list</p>
          </div>
          <h3 className="relative mt-3 text-2xl font-black">{MONTHS[viewMonth - 1]} birthdays</h3>
          <p className="relative mt-1 text-sm text-white/65">{activeBirthdays.length ? `Celebrating on the ${activeDay}${activeDay % 10 === 1 && activeDay !== 11 ? 'st' : activeDay % 10 === 2 && activeDay !== 12 ? 'nd' : activeDay % 10 === 3 && activeDay !== 13 ? 'rd' : 'th'}` : 'A good day to send a little cheer.'}</p>

          <div className="relative mt-6 flex-1">
            {loading ? (
              <div role="status" className="flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
                Gathering the birthday wishes…
              </div>
            ) : error ? (
              <div role="alert" className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85">
                <p>{error}</p>
                <button type="button" onClick={onRetry} className="mt-3 font-bold underline underline-offset-4">Try again</button>
              </div>
            ) : activeBirthdays.length ? (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeBirthdays.map((birthday, index) => (
                    <motion.article
                      key={birthday.id}
                      layout
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.22, delay: shouldReduceMotion ? 0 : index * 0.04 }}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4D6C8] text-sm font-black text-[#8D4C3A] ring-2 ring-white/20">
                        {initialsFor(birthday.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold">{birthday.name}</p>
                        <p className="mt-0.5 text-xs text-white/60">{birthday.emp_code}</p>
                      </div>
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-[#F8D8C8]">{MONTHS[birthday.month - 1]?.slice(0, 3)} {birthday.day}</span>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            ) : monthBirthdays.length ? (
              <div className="flex h-full min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-5 text-center">
                <Sparkles className="mb-2 h-5 w-5 text-[#E8C9A6]" />
                <p className="text-sm font-bold">No birthdays on this day</p>
                <p className="mt-1 text-xs text-white/60">Tap a highlighted date to see who’s celebrating.</p>
              </div>
            ) : (
              <div className="flex h-full min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-5 text-center">
                <Cake className="mb-2 h-5 w-5 text-[#E8C9A6]" />
                <p className="text-sm font-bold">No birthdays this month</p>
                <p className="mt-1 text-xs text-white/60">Try another month to find the next celebration.</p>
              </div>
            )}
          </div>
          <p className="relative mt-6 text-[11px] font-semibold tracking-wide text-white/45">A small message can make someone’s whole day.</p>
        </aside>
      </div>
    </section>
  );
}
