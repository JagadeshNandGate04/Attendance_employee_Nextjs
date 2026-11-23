'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyDashboard } from '../store/dashboard/dashboardSlice';
import TopNav from '../components/topNavBar';

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, string[]> = {
  home: ['M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'],
  calendar: ['M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'],
  file: ['M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'],
  send: ['M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'],
  sun: ['M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'],
  gear: [
    'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
    'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  ],
  bell: ['M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'],
  chevronRight: ['M8.25 4.5l7.5 7.5-7.5 7.5'],
  chevronDown: ['M19.5 8.25l-7.5 7.5-7.5-7.5'],
  arrowRight: ['M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3'],
  clock: ['M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'],
  refresh: ['M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'],
  menu: ['M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'],
};

function Icon({ name, className = 'h-4 w-4', stroke = 2 }: { name: string; className?: string; stroke?: number }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={stroke} viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name].map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

const MOODS = [
  { emoji: '😔', label: 'Down', quote: '“Even the darkest night will end and the sun will rise.” — Victor Hugo' },
  { emoji: '😕', label: 'Hesitant', quote: '“You don’t have to see the whole staircase, just take the first step.” — Martin Luther King Jr.' },
  { emoji: '😐', label: 'Neutral', quote: '“Peace comes from within. Do not seek it without.” — Siddhārtha Gautama' },
  { emoji: '🙂', label: 'Content', quote: '“Keep your face always toward the sunshine, and shadows will fall behind you.” — Walt Whitman' },
  { emoji: '🤩', label: 'Energized', quote: '“Energy flows where attention goes. Harness today’s momentum.”' },
];

type Question = { q: string; options: string[]; answer: number; why: string };

const BRAIN_QUESTIONS: Question[] = [
  { q: 'What comes next? 2, 6, 12, 20, 30, ?', options: ['38', '40', '42', '44'], answer: 2, why: 'The gaps grow by 2 each time (4, 6, 8, 10, 12), so 30 + 12 = 42.' },
  { q: 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much is the ball?', options: ['10 cents', '5 cents', '15 cents', '1 cent'], answer: 1, why: 'Ball = 5c, bat = $1.05. The difference is $1.00 and the total is $1.10.' },
  { q: '5 machines make 5 widgets in 5 minutes. How long do 100 machines take to make 100 widgets?', options: ['100 minutes', '20 minutes', '5 minutes', '1 minute'], answer: 2, why: 'Each machine makes one widget in 5 minutes, so 100 machines make 100 in 5 minutes.' },
  { q: 'Which number is the odd one out? 3, 5, 11, 15, 17', options: ['3', '11', '15', '17'], answer: 2, why: '15 is the only number that is not prime.' },
  { q: 'A lily patch doubles in size every day and covers the lake on day 48. When did it cover half?', options: ['Day 24', 'Day 47', 'Day 40', 'Day 12'], answer: 1, why: 'It doubles daily, so it was half the size one day before the lake was full.' },
  { q: 'Mary’s father has 5 daughters: Nana, Nene, Nini, Nono and ...?', options: ['Nunu', 'Nina', 'Mary', 'Nene'], answer: 2, why: 'The question already says the daughter is Mary’s father’s — so the fifth is Mary.' },
];

const JS_QUESTIONS: Question[] = [
  { q: 'What does typeof null return in JavaScript?', options: ['"null"', '"object"', '"undefined"', '"number"'], answer: 1, why: 'It is a long-standing quirk of the language: typeof null is "object".' },
  { q: 'What is the result of 0.1 + 0.2 === 0.3?', options: ['true', 'false', 'NaN', 'undefined'], answer: 1, why: 'Floating-point rounding makes 0.1 + 0.2 equal 0.30000000000000004.' },
  { q: 'Which array method adds an item to the end?', options: ['unshift()', 'push()', 'shift()', 'concat()'], answer: 1, why: 'push() appends to the end and returns the new length.' },
  { q: 'What does "5" + 3 evaluate to?', options: ['8', '"53"', 'NaN', 'Error'], answer: 1, why: 'The + operator concatenates when either side is a string.' },
  { q: 'What does declaring a variable with const prevent?', options: ['Changing object properties', 'Reassigning the variable', 'Using it before declaration', 'Both 1 and 2'], answer: 1, why: 'const blocks reassignment, but object contents can still be mutated.' },
  { q: 'What does [1, 2, 3].map(n => n * 2) return?', options: ['[1, 2, 3]', '6', '[2, 4, 6]', 'undefined'], answer: 2, why: 'map() returns a new array with each item transformed.' },
];

const JAVA_QUESTIONS: Question[] = [
  { q: 'Which keyword is used to inherit from a class in Java?', options: ['implements', 'extends', 'inherits', 'super'], answer: 1, why: 'A class uses extends to inherit from another class.' },
  { q: 'What is the default value of an int instance variable?', options: ['null', '1', '0', 'Undefined'], answer: 2, why: 'Numeric fields default to 0; object references default to null.' },
  { q: 'Which of these is NOT a primitive type in Java?', options: ['int', 'boolean', 'double', 'String'], answer: 3, why: 'String is a class, not a primitive.' },
  { q: 'Which collection does not allow duplicate elements?', options: ['ArrayList', 'LinkedList', 'HashSet', 'Vector'], answer: 2, why: 'A Set stores unique elements only.' },
  { q: 'What does marking a class final do?', options: ['It cannot be instantiated', 'It cannot be subclassed', 'It cannot have methods', 'It becomes static'], answer: 1, why: 'A final class cannot be extended, like String.' },
  { q: 'Which is the correct entry point of a Java program?', options: ['public void main(String[] a)', 'static void main()', 'public static void main(String[] args)', 'void start(String[] args)'], answer: 2, why: 'The JVM looks for public static void main(String[] args).' },
];

/* ------------------------------------------------------------------ */
/* GAME 1: NUMBER PUZZLE (3x3 sliding tiles)                           */
/* ------------------------------------------------------------------ */

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function neighbors(i: number) {
  const r = Math.floor(i / 3);
  const c = i % 3;
  const out: number[] = [];
  if (r > 0) out.push(i - 3);
  if (r < 2) out.push(i + 3);
  if (c > 0) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  return out;
}

// Shuffle by making random legal moves, so the puzzle is always solvable.
function shuffledBoard() {
  const t = [...GOAL];
  let blank = 8;
  let prev = -1;
  for (let i = 0; i < 80; i++) {
    const options = neighbors(blank).filter((n) => n !== prev);
    const next = options[Math.floor(Math.random() * options.length)];
    [t[blank], t[next]] = [t[next], t[blank]];
    prev = blank;
    blank = next;
  }
  return t;
}

function NumberPuzzle() {
  const [tiles, setTiles] = useState<number[]>(GOAL);
  const [moves, setMoves] = useState(0);

  const reset = useCallback(() => {
    setTiles(shuffledBoard());
    setMoves(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(reset, 0);
    return () => clearTimeout(timer);
  }, [reset]);

  const solved = moves > 0 && tiles.every((v, i) => v === GOAL[i]);

  const move = (i: number) => {
    if (solved) return;
    const blank = tiles.indexOf(0);
    if (!neighbors(blank).includes(i)) return;
    const next = [...tiles];
    [next[blank], next[i]] = [next[i], next[blank]];
    setTiles(next);
    setMoves((m) => m + 1);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="max-w-md text-center text-sm text-stone-500 sm:text-base">
        Slide the tiles into order from 1 to 8, with the empty space in the bottom-right corner.
      </p>
      <div className="grid w-full max-w-[320px] grid-cols-3 gap-2 rounded-3xl bg-[#F3EADA] p-3" role="grid" aria-label="Number puzzle board">
        {tiles.map((value, i) => (
          <button
            key={i}
            type="button"
            disabled={value === 0}
            onClick={() => move(i)}
            aria-label={value === 0 ? 'Empty space' : `Tile ${value}`}
            className={`aspect-square rounded-2xl text-3xl font-black transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953] ${
              value === 0
                ? 'bg-transparent'
                : value === GOAL[i]
                  ? 'bg-[#5D6953] text-white shadow-sm hover:bg-[#4d5744]'
                  : 'bg-white text-stone-800 shadow-sm hover:-translate-y-0.5'
            }`}
          >
            {value || ''}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-stone-600">
        <span>Moves: {moves}</span>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[#C85D44] hover:underline">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          New puzzle
        </button>
      </div>
      {solved && (
        <p role="status" className="rounded-xl bg-[#F6F8F3] px-4 py-2 text-sm font-bold text-[#495341]">
          Solved in {moves} moves. Nicely done!
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GAME 2-4: QUIZ (Brain Storm, JavaScript, Java)                      */
/* ------------------------------------------------------------------ */

function QuizGame({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-4xl font-black text-stone-900">
          {score} <span className="text-xl font-normal text-stone-400">/ {questions.length}</span>
        </p>
        <p className="text-stone-500">
          {score === questions.length ? 'Perfect round!' : score >= questions.length / 2 ? 'Good work. One more round?' : 'Keep going, practice makes it stick.'}
        </p>
        <button type="button" onClick={restart} className="rounded-full bg-[#5D6953] px-5 py-2 text-sm font-bold text-white hover:bg-[#4d5744]">
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-stone-500">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#F3EADA]">
        <div className="h-full rounded-full bg-[#5D6953] transition-all" style={{ width: `${((index + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <h4 className="text-lg font-black text-stone-900 sm:text-xl">{q.q}</h4>
      <div className="mt-4 grid gap-2.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isPicked = i === picked;
          let style = 'border-[#EBE4D6] bg-white text-stone-800 hover:bg-[#FBF7F0]';
          if (picked !== null && isCorrect) style = 'border-[#BFD0B5] bg-[#F6F8F3] text-[#495341]';
          else if (isPicked) style = 'border-[#F4C8B9] bg-[#FDF2EE] text-[#A74732]';
          else if (picked !== null) style = 'border-[#EBE4D6] bg-white text-stone-400';
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition sm:text-base ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div role="status" className="mt-4 rounded-2xl bg-[#FDF8F0] p-4 text-sm text-stone-700 sm:text-base">
          <p className="font-black">{picked === q.answer ? 'Correct.' : 'Not quite.'}</p>
          <p className="mt-1">{q.why}</p>
          <button type="button" onClick={next} className="mt-3 rounded-full bg-[#5D6953] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#4d5744]">
            {index + 1 >= questions.length ? 'See score' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GAME 5: PATTERN MATCH (repeat the growing colour sequence)          */
/* ------------------------------------------------------------------ */

const PADS = [
  { base: 'bg-[#848F76]', lit: 'bg-[#C8D8B8]', label: 'Sage' },
  { base: 'bg-[#C85D44]', lit: 'bg-[#F2A48F]', label: 'Terracotta' },
  { base: 'bg-[#D9B288]', lit: 'bg-[#F5DDB8]', label: 'Sand' },
  { base: 'bg-[#333B2E]', lit: 'bg-[#7D8C70]', label: 'Olive' },
];

function PatternMatch() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'over'>('idle');
  const [lit, setLit] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [best, setBest] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextPad = useRef(0);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const play = (seq: number[]) => {
    setSequence(seq);
    setPhase('showing');
    setPos(0);
    seq.forEach((pad, i) => {
      later(() => setLit(pad), 700 + i * 700);
      later(() => setLit(null), 700 + i * 700 + 450);
    });
    later(() => setPhase('input'), 700 + seq.length * 700);
  };

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const pad = (nextPad.current * 3 + 1) % PADS.length;
    nextPad.current += 1;
    play([pad]);
  };

  const press = (i: number) => {
    if (phase !== 'input') return;
    setLit(i);
    later(() => setLit(null), 200);
    if (sequence[pos] !== i) {
      setBest((b) => Math.max(b, sequence.length - 1));
      setPhase('over');
      return;
    }
    if (pos + 1 === sequence.length) {
      setPhase('showing');
      later(() => play([...sequence, Math.floor(Math.random() * 4)]), 600);
    } else {
      setPos(pos + 1);
    }
  };

  const status =
    phase === 'idle' ? 'Press start, then watch the pattern.' :
    phase === 'showing' ? 'Watch carefully...' :
    phase === 'input' ? 'Your turn. Repeat the pattern.' :
    `Pattern broken at round ${sequence.length}.`;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="max-w-md text-center text-sm text-stone-500 sm:text-base">
        Remember the order the colours light up, then repeat it. Each round adds one more step.
      </p>
      <div className="grid w-full max-w-[300px] grid-cols-2 gap-3">
        {PADS.map((pad, i) => (
          <button
            key={i}
            type="button"
            onClick={() => press(i)}
            aria-label={`${pad.label} pad`}
            className={`aspect-square rounded-3xl shadow-sm transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953] ${lit === i ? pad.lit : pad.base}`}
          />
        ))}
      </div>
      <p role="status" className="text-sm font-bold text-stone-700">{status}</p>
      <div className="flex items-center gap-4 text-sm font-bold text-stone-600">
        <span>Round: {phase === 'idle' ? 0 : sequence.length}</span>
        <span>Best: {best}</span>
        {(phase === 'idle' || phase === 'over') && (
          <button type="button" onClick={start} className="rounded-full bg-[#5D6953] px-4 py-1.5 text-white hover:bg-[#4d5744]">
            {phase === 'idle' ? 'Start' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GAME ZONE (sidebar + inline play panel)                             */
/* ------------------------------------------------------------------ */

const GAME_TABS = [
  { id: 'number', label: 'Number Puzzle', sub: 'Slide tiles into order', emoji: '🔢' },
  { id: 'pattern', label: 'Pattern Match', sub: 'Repeat the sequence', emoji: '🎯' },
  { id: 'brain', label: 'Brain Storm Quiz', sub: 'Logic and riddles', emoji: '🧠' },
  { id: 'js', label: 'JavaScript', sub: '6 quick questions', emoji: '🟨' },
  { id: 'java', label: 'Java', sub: '6 quick questions', emoji: '☕' },
];

function GameZone({ game, onGameChange }: { game: string | null; onGameChange: (id: string | null) => void }) {
  const current = GAME_TABS.find((g) => g.id === game);

  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-[28px] border border-[#ECE4D6] bg-white shadow-sm lg:grid-cols-[280px_1fr]">
      {/* SIDEBAR */}
      <aside className="flex flex-col gap-4 bg-[#333B2E] p-5 text-white" aria-label="Game list">
        <div>
          <h3 className="text-base font-black sm:text-lg">Mindfulness Break</h3>
          <p className="text-sm text-[#B1BFA6]">Pick a quick game to reset your focus.</p>
        </div>

        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {GAME_TABS.map((g) => {
            const active = game === g.id;
            return (
              <li key={g.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => onGameChange(active ? null : g.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E3BF96] ${
                    active ? 'bg-[#E3BF96] text-stone-900' : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${active ? 'bg-white/70' : 'bg-white/10'}`} aria-hidden="true">
                    {g.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-sm font-bold lg:whitespace-normal">{g.label}</span>
                    <span className={`hidden text-xs lg:block ${active ? 'text-stone-700' : 'text-[#B1BFA6]'}`}>{g.sub}</span>
                  </span>
                  {active && <span className="ml-auto hidden h-2 w-2 shrink-0 rounded-full bg-[#C85D44] lg:block" aria-label="Playing" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* PLAY PANEL */}
      <div className="min-h-[320px] p-5 sm:p-6">
        {current ? (
          <>
            <div className="mb-5 flex items-center justify-between border-b border-[#F7F3EB] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{current.emoji}</span>
                <h4 className="text-lg font-black text-stone-900 sm:text-xl">{current.label}</h4>
              </div>
              <button type="button" onClick={() => onGameChange(null)} className="text-sm font-bold text-stone-400 hover:text-stone-700">
                Close
              </button>
            </div>
            {game === 'number' && <NumberPuzzle />}
            {game === 'brain' && <QuizGame key="brain" questions={BRAIN_QUESTIONS} />}
            {game === 'js' && <QuizGame key="js" questions={JS_QUESTIONS} />}
            {game === 'java' && <QuizGame key="java" questions={JAVA_QUESTIONS} />}
            {game === 'pattern' && <PatternMatch />}
          </>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
            <span className="text-4xl" aria-hidden="true">🪷</span>
            <p className="font-black text-stone-900">Take two minutes for yourself</p>
            <p className="max-w-xs text-sm text-stone-500">Choose a game from the list and it will open right here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN DASHBOARD                                                      */
/* ------------------------------------------------------------------ */

export default function MindfulDailyDashboard() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState('02:26 AM');
  const [todayLabel, setTodayLabel] = useState('');
  const [greeting, setGreeting] = useState('Good morning');
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { data: dashboard, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setTodayLabel(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase());
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      void dispatch(fetchMyDashboard());
    }
  }, [dispatch, token]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">
      {/* BACKGROUND ARTWORK */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <svg className="h-full w-full object-cover opacity-90" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76" />
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96" />
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44" />
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288" />
          <path d="M -60 500 C 320 410, 760 630, 1120 430 C 1470 230, 1740 330, 2040 190" stroke="#707C65" strokeWidth="1.5" strokeOpacity="0.35" fill="none" />
          <path d="M 260 -60 C 440 330, 310 800, 720 970 C 1130 1140, 1600 900, 1980 1140" stroke="#C85D44" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
        </svg>
      </div>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">
        <TopNav
          active="home"
          user={{
            name: dashboard?.employee.name || 'Employee',
            initials: (dashboard?.employee.name || 'E')
              .split(/\s+/)
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            empId: dashboard?.employee.emp_code || '',
            role: dashboard?.employee.designation || 'Employee',
            email: '',
          }}
        />

        {loading && (
          <p role="status" className="text-base text-stone-600">Loading your dashboard...</p>
        )}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">
            <span>Unable to load dashboard: {error}</span>
            <button type="button" onClick={() => void dispatch(fetchMyDashboard())} className="font-bold underline">Try again</button>
          </div>
        )}

        {/* DAILY THOUGHTS BANNER */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#5D6953] px-5 py-3.5 text-white shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#707C65] text-lg shadow-inner">🪷</div>
            <div>
              <h2 className="text-base font-bold tracking-wide sm:text-lg">Daily Thoughts &amp; Tranquil Quotes</h2>
              <p className="text-sm text-[#D8DEC7] sm:text-base">A peaceful space to pause, reflect, and cultivate calm perspective throughout your workday.</p>
            </div>
          </div>
          <div className="rounded-full bg-white/15 px-3.5 py-1 text-sm font-bold tracking-wide text-white backdrop-blur-xs">Mindfulness Track</div>
        </section>

        {/* ANNOUNCEMENT */}
        <section className="flex items-start gap-3.5 rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] p-4 text-stone-800 shadow-xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5D8CB] text-xs font-black text-[#C85D44]">!</div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-[#C85D44] uppercase">IMPORTANT ANNOUNCEMENT</span>
            <h3 className="text-sm font-bold text-stone-900 sm:text-base">Company-wide Focus Friday &amp; Wellness Recharge</h3>
            <p className="mt-1 text-sm text-[#6B5A51] sm:text-base">No internal meetings scheduled after 1:00 PM today. Take time for deep work, mental wellness, and self-paced reflections.</p>
          </div>
        </section>

        {/* MOOD + SHIFT TRACKER */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-[28px] border border-[#EBE4D6] bg-white p-6 shadow-sm transition-all hover:shadow-[0_12px_32px_rgba(72,60,45,0.05)] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#F7F3EB] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#C85D44]" />
                <span className="text-xs font-black tracking-wider text-[#6E685F] uppercase">DAILY MOOD &amp; REFLECTION</span>
              </div>
              <button type="button" onClick={() => setSelectedMood(null)} className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-stone-700 transition">
                <Icon name="refresh" className="h-3.5 w-3.5" />
                <span>reset session</span>
              </button>
            </div>

            <div className="my-6 flex flex-col items-center text-center">
              <span className="text-sm font-black tracking-wider text-stone-500 uppercase">HOW IS YOUR DAY GOING?</span>
              <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4">
                {MOODS.map((item, index) => {
                  const isSelected = selectedMood === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      aria-label={item.label}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMood(index)}
                      className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-2xl sm:text-3xl transition-all duration-200 ${
                        isSelected ? 'scale-115 bg-[#FAF6EE] ring-2 ring-[#DDB892] shadow-sm' : 'hover:scale-110 hover:bg-stone-50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {item.emoji}
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 max-w-md text-sm sm:text-base italic text-stone-500 leading-relaxed min-h-[40px] flex items-center justify-center">
                {selectedMood !== null ? MOODS[selectedMood].quote : 'Select your current energy to reveal today’s curated inspirational quote.'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#F7F3EB] pt-3">
              <div>
                <p className="text-sm font-black text-stone-900">— Siddhārtha Gautama</p>
                <p className="text-xs text-stone-400">Inner Harmony</p>
              </div>
              <span className="rounded-full bg-[#F3EADA] px-3.5 py-1 text-xs font-extrabold tracking-wider text-[#707C65] uppercase">MINDFULNESS</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[28px] bg-[#333B2E] p-6 text-white shadow-lg lg:col-span-5">
            <div className="flex items-center justify-between text-sm font-bold text-[#B1BFA6]">
              <span>TODAY · {todayLabel}</span>
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white">
                <span>☀️</span>
                <span>{currentTime} · 21°C IST</span>
              </div>
            </div>

            <div className="my-4">
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {greeting}, {dashboard?.employee.name || 'there'}
              </h2>
              <p className="mt-1 text-sm text-[#D4DECB] sm:text-base">You’re having a smooth and steady day. Keep your momentum going!</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 p-2.5">
                <span className="text-[11px] font-black tracking-wider text-[#B1BFA6] uppercase">CHECK IN</span>
                <p className="text-sm font-black text-white sm:text-base mt-0.5">09:02 AM</p>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  On time
                </span>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <span className="text-[11px] font-black tracking-wider text-[#B1BFA6] uppercase">WORKED</span>
                <p className="text-sm font-black text-white sm:text-base mt-0.5">06h 24m</p>
                <span className="text-[11px] text-[#D4DECB] mt-0.5 block">Target: 8h</span>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <span className="text-[11px] font-black tracking-wider text-[#B1BFA6] uppercase">EXPECTED OUT</span>
                <p className="text-sm font-black text-white sm:text-base mt-0.5">06:00 PM</p>
                <span className="text-[11px] text-[#D4DECB] mt-0.5 block">Today</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[#D4DECB]">
                <span>Daily work target</span>
                <span className="font-extrabold text-[#E8907B]">80%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#C85D44] transition-all duration-500" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl bg-[#5D6953] p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-black tracking-wider uppercase text-[#DCE4D5]">DAYS PRESENT</span>
              <Icon name="calendar" className="h-4 w-4 text-white/70" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">18 <span className="text-lg font-normal text-white/60">/ 22</span></p>
              <p className="mt-0.5 text-sm text-[#C8D4C1]">This month · 82% completed</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#F0E3D2] bg-[#FDF8F0] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#EDD7BE] bg-white px-2.5 py-1 text-xs font-black tracking-wider uppercase text-[#9B6A38]">HOURS WORKED</span>
              <Icon name="clock" className="h-4 w-4 text-[#9B6A38]" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-stone-900">142h 20m</p>
              <p className="mt-0.5 text-sm text-stone-500">Across 18 productive days</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#F8D9CE] bg-[#FEF1EC] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#F4C8B9] bg-white px-2.5 py-1 text-xs font-black tracking-wider uppercase text-[#C85D44]">LEAVE BALANCE</span>
              <Icon name="send" className="h-4 w-4 text-[#C85D44]" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-[#C85D44]">12 <span className="text-lg font-semibold text-[#C85D44]/80">days</span></p>
              <p className="mt-0.5 text-sm text-stone-500">Available to take anytime</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#EBE4D6] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#E2E9DC] bg-[#F6F9F3] px-2.5 py-1 text-xs font-black tracking-wider uppercase text-[#5D6953]">NEXT PAYDAY</span>
              <span className="text-base font-black text-[#5D6953]">$</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-stone-900">30 Nov</p>
              <p className="mt-0.5 text-sm text-stone-500">November payroll disbursement</p>
            </div>
          </div>
        </section>

        {/* MINDFULNESS BREAK + GAME ZONE */}
        <GameZone game={activeGame} onGameChange={setActiveGame} />

        {/* ATTENDANCE CALENDAR */}
        <section className="rounded-[28px] border border-[#ECE4D6] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#F7F3EB] pb-4">
            <div>
              <span className="text-xs font-black tracking-[0.18em] text-[#C85D44] uppercase">ATTENDANCE OVERVIEW</span>
              <h3 className="mt-1 text-lg font-black text-stone-900 sm:text-xl">
                {dashboard?.calendar
                  ? new Date(dashboard.calendar.year, dashboard.calendar.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Monthly attendance'}
              </h3>
            </div>
            <p className="text-sm text-stone-500">Your attendance and scheduled events</p>
          </div>

          {dashboard?.calendar.days.length ? (
            <div className="grid grid-cols-7 gap-2 sm:gap-3" aria-label="Monthly attendance calendar">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                <div key={weekday} className="pb-1 text-center text-xs font-black tracking-wider text-stone-400 uppercase sm:text-sm">
                  {weekday}
                </div>
              ))}
              {Array.from({ length: new Date(dashboard.calendar.year, dashboard.calendar.month - 1, 1).getDay() }).map((_, index) => (
                <div key={`empty-${index}`} aria-hidden="true" />
              ))}
              {dashboard.calendar.days.map((day) => {
                const status = day.attendance?.status;
                const statusStyles: Record<string, string> = {
                  PRESENT: 'border-[#D6E2CF] bg-[#F6F8F3] text-[#495341]',
                  ABSENT: 'border-[#F4C8B9] bg-[#FDF2EE] text-[#A74732]',
                  INSUFFICIENT: 'border-[#EDD7BE] bg-[#FDF8F0] text-[#9B6A38]',
                  HOLIDAY: 'border-[#E2E9DC] bg-[#F6F9F3] text-[#5D6953]',
                  WEEKLY_OFF: 'border-stone-200 bg-stone-50 text-stone-500',
                };
                const events = day.events.map((event) => event.name || event.type.replaceAll('_', ' '));

                return (
                  <div
                    key={day.date}
                    className={`min-h-20 rounded-xl border p-2 sm:min-h-24 sm:p-3 ${
                      status ? statusStyles[status] || 'border-stone-200 bg-white text-stone-700' : 'border-[#F0ECE4] bg-white text-stone-700'
                    }`}
                    title={[status, ...events].filter(Boolean).join(' · ')}
                  >
                    <span className="text-sm font-black sm:text-base">{Number(day.date.slice(-2))}</span>
                    {(status || events.length > 0) && (
                      <div className="mt-2 space-y-1">
                        {status && <span className="block truncate text-[11px] font-bold uppercase sm:text-xs">{status.replaceAll('_', ' ')}</span>}
                        {events.slice(0, 1).map((event) => (
                          <span key={event} className="block truncate rounded-md bg-white/80 px-1.5 py-1 text-[11px] font-semibold sm:text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-[#FDFBF7] px-4 py-8 text-center text-base text-stone-500">
              {loading ? 'Loading attendance calendar...' : 'Attendance calendar is not available.'}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}