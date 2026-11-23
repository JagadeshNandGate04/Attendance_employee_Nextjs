'use client';

import { useEffect, useRef, useState } from 'react';

type GameTab = 'puzzle' | 'trivia' | 'javascript';
type RawQuestion = {
  question: string;
  correct: string;
  wrong: string[];
  explanation: string;
};
type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

const TRIVIA_QUESTIONS: RawQuestion[] = [
  { question: 'How many months of the year have 28 days?', correct: 'All 12', wrong: ['Just February', 'None'], explanation: 'Every month has at least 28 days.' },
  { question: 'A clock takes 6 seconds to strike 6. How long to strike 12?', correct: '13.2 seconds', wrong: ['12 seconds', '14 seconds'], explanation: 'Five gaps take 6 seconds, so eleven gaps take 13.2 seconds.' },
  { question: 'What has hands but can never clap?', correct: 'A clock', wrong: ['A punch card', 'A calendar'], explanation: 'A clock has hands, but they only point.' },
  { question: 'Which word is always spelled wrong in the dictionary?', correct: 'Wrong', wrong: ['Attendance', 'Calendar'], explanation: 'The word itself is “wrong”.' },
  { question: 'How many times can you subtract 10 from 100?', correct: 'Once', wrong: ['10 times', '9 times'], explanation: 'After the first subtraction, you are subtracting from 90.' },
  { question: 'All but 9 of 17 sheep run away. How many are left?', correct: '9', wrong: ['8', '17'], explanation: '“All but 9” means 9 stayed.' },
  { question: 'What can you catch but never throw?', correct: 'A cold', wrong: ['A ball', 'A shadow'], explanation: 'You can catch a cold, but you cannot throw one.' },
  { question: 'What goes up but never comes back down?', correct: 'Your age', wrong: ['A balloon', 'Smoke'], explanation: 'Age only goes up.' },
  { question: 'Which weighs more: a kilo of feathers or a kilo of steel?', correct: 'They weigh the same', wrong: ['The steel', 'The feathers'], explanation: 'A kilo is a kilo.' },
  { question: 'A doctor gives you 3 pills, one every 30 minutes. How long do they last?', correct: '1 hour', wrong: ['1.5 hours', '3 hours'], explanation: 'Take the first at 0, the second at 30 minutes, and the third at 60.' },
  { question: 'A bus goes the wrong way down a one-way street past police. Why no ticket?', correct: 'The driver was walking', wrong: ['The police did not see', 'The bus was empty'], explanation: 'Nobody said the driver was driving the bus.' },
  { question: 'If today is Monday, what is the day before the day after tomorrow?', correct: 'Tuesday', wrong: ['Monday', 'Wednesday'], explanation: 'The day after tomorrow is Wednesday; the day before is Tuesday.' },
  { question: 'What gets wetter the more it dries?', correct: 'A towel', wrong: ['A sponge', 'A raincoat'], explanation: 'A towel absorbs water as it dries you.' },
  { question: 'What has keys but cannot open locks?', correct: 'A keyboard', wrong: ['A piano tuner', 'A map'], explanation: 'Keyboards and pianos have keys that open nothing.' },
  { question: 'What can travel around the world while staying in a corner?', correct: 'A stamp', wrong: ['A compass', 'A shadow'], explanation: 'A stamp sits in the corner of an envelope.' },
  { question: 'How many seconds are there in a day?', correct: '86,400', wrong: ['3,600', '864,000'], explanation: '24 hours × 60 minutes × 60 seconds = 86,400.' },
  { question: 'What building has the most stories?', correct: 'A library', wrong: ['A skyscraper', 'A cinema'], explanation: 'A library is full of stories.' },
  { question: 'What is full of holes but still holds water?', correct: 'A sponge', wrong: ['A bucket', 'A net'], explanation: 'A sponge is porous yet soaks up water.' },
  { question: 'If you have me, you want to share me. If you share me, you no longer have me. What am I?', correct: 'A secret', wrong: ['A cake', 'A coin'], explanation: 'Once a secret is shared it is no longer yours alone.' },
  { question: 'What comes once in a minute, twice in a moment, but never in a thousand years?', correct: 'The letter M', wrong: ['A second', 'The letter T'], explanation: 'Count the letter M in each phrase.' },
  { question: 'Two fathers and two sons go fishing and catch 3 fish, one each. How?', correct: 'A grandfather, father and son', wrong: ['One fish escaped', 'They shared one'], explanation: 'That is only three people: three generations.' },
  { question: 'What is always in front of you but cannot be seen?', correct: 'The future', wrong: ['The wind', 'A mirror'], explanation: 'The future lies ahead but is invisible.' },
  { question: 'How many letters are in the alphabet?', correct: '26', wrong: ['24', '28'], explanation: 'A to Z is 26 letters.' },
  { question: 'What word becomes shorter when you add two letters to it?', correct: 'Short', wrong: ['Long', 'Brief'], explanation: 'Short + er = shorter.' },
];

const JAVASCRIPT_QUESTIONS: RawQuestion[] = [
  { question: 'console.log(typeof null);', correct: '"object"', wrong: ['"null"', '"undefined"', '"number"'], explanation: 'A famous JavaScript quirk: typeof null returns "object".' },
  { question: 'console.log(0.1 + 0.2 === 0.3);', correct: 'false', wrong: ['true', 'NaN', 'TypeError'], explanation: 'Floating-point arithmetic makes the sum 0.30000000000000004.' },
  { question: "console.log('5' - 2, '5' + 2);", correct: '3 52', wrong: ['3 7', '52 3', '7 52'], explanation: 'Minus converts to a number; plus concatenates strings.' },
  { question: 'console.log([] + []);', correct: '"" (empty string)', wrong: ['[]', '0', 'undefined'], explanation: 'Both arrays become empty strings, and "" + "" is "".' },
  { question: 'console.log([1, 2, 3].map(parseInt));', correct: '[1, NaN, NaN]', wrong: ['[1, 2, 3]', '[NaN, NaN, NaN]', '[0, 1, 2]'], explanation: 'map passes the index as a second argument, which parseInt treats as a radix.' },
  { question: 'console.log(typeof NaN);', correct: '"number"', wrong: ['"NaN"', '"undefined"', '"object"'], explanation: 'NaN means “not a number”, yet its type is number.' },
  { question: 'console.log([10, 9, 1].sort());', correct: '[1, 10, 9]', wrong: ['[1, 9, 10]', '[10, 9, 1]', '[9, 10, 1]'], explanation: 'sort() compares as strings by default, so "10" comes before "9".' },
  { question: 'console.log(1 < 2 < 3, 3 > 2 > 1);', correct: 'true false', wrong: ['true true', 'false false', 'false true'], explanation: '3 > 2 is true (1), and 1 > 1 is false.' },
  { question: 'console.log([] == false);', correct: 'true', wrong: ['false', 'undefined', 'TypeError'], explanation: 'Both sides are coerced to the number 0.' },
  { question: 'console.log(null == undefined, null === undefined);', correct: 'true false', wrong: ['true true', 'false false', 'false true'], explanation: 'Loose equality treats them as equal; strict equality also checks types.' },
  { question: 'console.log(typeof (() => {}));', correct: '"function"', wrong: ['"object"', '"undefined"', '"arrow"'], explanation: 'Functions have their own typeof result.' },
  { question: 'console.log(parseInt("08"), parseInt("0x1f"));', correct: '8 31', wrong: ['0 31', '8 0', 'NaN 31'], explanation: 'parseInt reads the 0x prefix as hexadecimal.' },
  { question: 'console.log(typeof undefined, typeof []);', correct: '"undefined" "object"', wrong: ['"undefined" "array"', '"object" "object"', '"null" "array"'], explanation: 'Arrays are objects in JavaScript.' },
  { question: 'console.log(!!"0", !!"");', correct: 'true false', wrong: ['false false', 'true true', 'false true'], explanation: 'A non-empty string is truthy, even "0".' },
  { question: 'console.log([1, 2, 3] + [4]);', correct: '"1,2,34"', wrong: ['[1, 2, 3, 4]', '10', '"1,2,3,4"'], explanation: 'Arrays become strings and are concatenated.' },
  { question: 'let a = 1; console.log(a++ + ++a);', correct: '4', wrong: ['3', '2', '5'], explanation: 'a++ gives 1 (a becomes 2), ++a gives 3; 1 + 3 = 4.' },
  { question: 'console.log("b" + "a" + +"a" + "a");', correct: '"baNaNa"', wrong: ['"baaa"', '"ba0a"', 'NaN'], explanation: '+ "a" is NaN, which is concatenated as a string.' },
  { question: 'console.log(Math.max(), Math.min());', correct: '-Infinity Infinity', wrong: ['0 0', 'Infinity -Infinity', 'NaN NaN'], explanation: 'With no arguments they return their identity values.' },
  { question: 'console.log([..."hi"].length, "hi".split("").length);', correct: '2 2', wrong: ['1 2', '2 1', '1 1'], explanation: 'Both split the string into two characters.' },
  { question: 'var x = 1; { var x = 2; } console.log(x);', correct: '2', wrong: ['1', 'undefined', 'ReferenceError'], explanation: 'var is function-scoped, not block-scoped.' },
  { question: 'console.log(typeof typeof 1);', correct: '"string"', wrong: ['"number"', '"undefined"', '"object"'], explanation: 'typeof 1 is "number", whose typeof is "string".' },
  { question: 'console.log(Number("12px"), parseInt("12px"));', correct: 'NaN 12', wrong: ['12 12', 'NaN NaN', '12 NaN'], explanation: 'Number is strict; parseInt reads leading digits.' },
  { question: 'console.log([3] == 3, [3] === 3);', correct: 'true false', wrong: ['true true', 'false false', 'false true'], explanation: 'Loose equality coerces the array to 3.' },
  { question: 'console.log(0 || "a", 0 ?? "a");', correct: '"a" 0', wrong: ['"a" "a"', '0 0', '0 "a"'], explanation: '?? only falls back for null or undefined.' },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function loadSeen(key: string, size: number): Set<number> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return new Set<number>(stored.filter((value: unknown) => Number.isInteger(value) && (value as number) < size));
  } catch {
    return new Set<number>();
  }
}

function saveSeen(key: string, seen: Set<number>) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...seen]));
  } catch {}
}

function makeRound(
  bank: RawQuestion[],
  size: number,
  seen: Set<number>,
): Question[] {
  let available = bank.map((_, index) => index).filter((index) => !seen.has(index));
  if (available.length < size) {
    seen.clear();
    available = bank.map((_, index) => index);
  }

  const selected = shuffle(available).slice(0, size);
  selected.forEach((index) => seen.add(index));

  return selected.map((index) => {
    const item = bank[index];
    const options = shuffle([item.correct, ...item.wrong]);
    return {
      question: item.question,
      options,
      answer: options.indexOf(item.correct),
      explanation: item.explanation,
    };
  });
}

function neighbours(blank: number): number[] {
  const row = Math.floor(blank / 3);
  const column = blank % 3;
  const result: number[] = [];
  if (row > 0) result.push(blank - 3);
  if (row < 2) result.push(blank + 3);
  if (column > 0) result.push(blank - 1);
  if (column < 2) result.push(blank + 1);
  return result;
}

function shuffledPuzzle(): number[] {
  const tiles = [...SOLVED];
  let blank = 8;
  let previous = -1;
  for (let move = 0; move < 90; move += 1) {
    const options = neighbours(blank).filter((position) => position !== previous);
    const next = options[Math.floor(Math.random() * options.length)];
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
    previous = blank;
    blank = next;
  }
  if (tiles.every((tile, index) => tile === SOLVED[index])) {
    const adjacent = neighbours(8)[0];
    [tiles[8], tiles[adjacent]] = [tiles[adjacent], tiles[8]];
  }
  return tiles;
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function SlidePuzzle() {
  const [tiles, setTiles] = useState<number[] | null>(null);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const solved = tiles?.every((tile, index) => tile === SOLVED[index]) ?? false;
  const started = moves > 0;

  const reset = () => {
    setTiles(shuffledPuzzle());
    setMoves(0);
    setSeconds(0);
    setRunning(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(reset, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!running || solved) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, solved]);

  const moveTile = (position: number) => {
    if (!tiles || solved) return;
    const blank = tiles.indexOf(0);
    if (!neighbours(blank).includes(position)) return;
    const next = [...tiles];
    [next[blank], next[position]] = [next[position], next[blank]];
    setTiles(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const isSolved = next.every((tile, index) => tile === SOLVED[index]);
    setRunning(!isSolved);
    if (isSolved) {
      setBest((current) => current === null || nextMoves < current ? nextMoves : current);
    }
  };

  return (
    <div className="grid h-full items-center gap-5 sm:grid-cols-[minmax(190px,240px)_1fr] sm:gap-8">
      <div className="relative mx-auto w-full max-w-[240px]">
        <div
          className="grid aspect-square grid-cols-3 gap-2.5 rounded-2xl border border-white/10 bg-[#232920]/60 p-2.5 shadow-inner backdrop-blur-xs"
          aria-label="Sliding punch card puzzle"
        >
          {(tiles ?? Array.from({ length: 9 }, (_, index) => index + 1)).map((tile, index) => (
            tile === 0 ? (
              <span key="blank" aria-hidden="true" className="rounded-xl border border-dashed border-white/15 bg-white/5" />
            ) : (
              <button
                key={tile}
                type="button"
                onClick={() => moveTile(index)}
                disabled={!tiles}
                aria-label={`Move tile ${tile}`}
                className={`rounded-xl text-lg font-black tabular-nums transition duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3BF96] sm:text-xl shadow-xs ${
                  tiles && tile === SOLVED[index]
                    ? 'bg-[#E3BF96] text-[#2F362A] shadow-[0_0_16px_rgba(227,191,150,0.35)]'
                    : 'bg-[#FCFAF7] text-stone-800 hover:bg-white'
                }`}
              >
                {tiles ? tile : ''}
              </button>
            )
          ))}
        </div>

        {solved && started && (
          <div className="dashboard-game-pop absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#2F362A]/95 p-4 text-center text-white backdrop-blur-sm border border-[#E3BF96]/30">
            <span className="text-3xl" aria-hidden="true">🎉</span>
            <p className="mt-1 text-base font-black text-[#E3BF96]">Punches in order!</p>
            <p className="mt-1 text-xs font-semibold text-stone-300">{moves} moves · {formatTime(seconds)}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 rounded-full bg-[#E3BF96] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#2F362A] transition hover:bg-white active:scale-95 shadow-sm"
            >
              Play again
            </button>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="text-base font-black text-white">Slide the punch card</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-300">
            Move the tiles into order, 1 to 8, with the empty space at the end.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-xs">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Moves</dt>
            <dd className="mt-0.5 text-2xl font-black text-white tabular-nums">{moves}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-xs">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Time</dt>
            <dd className="mt-0.5 text-2xl font-black text-white tabular-nums">{formatTime(seconds)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/25 active:scale-95 shadow-xs"
          >
            Shuffle
          </button>
          <span className="text-xs font-semibold text-stone-300">
            {best !== null ? `Best: ${best} moves` : 'Solve to set a best'}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuizGame({ bank, isCode, storageKey }: { bank: RawQuestion[]; isCode?: boolean; storageKey: string }) {
  const seen = useRef(new Set<number>());
  const [round, setRound] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const finished = round.length > 0 && index >= round.length;
  const current = round[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      seen.current = loadSeen(storageKey, bank.length);
      setRound(makeRound(bank, Math.min(isCode ? 6 : 5, bank.length), seen.current));
      saveSeen(storageKey, seen.current);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bank, isCode, storageKey]);

  const choose = (option: number) => {
    if (picked !== null || !current) return;
    setPicked(option);
    if (option === current.answer) {
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }
  };

  const restart = () => {
    setRound(makeRound(bank, Math.min(isCode ? 6 : 5, bank.length), seen.current));
    saveSeen(storageKey, seen.current);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
  };

  if (!current && !finished) {
    return <div className="flex h-full items-center justify-center text-xs font-semibold text-stone-300" role="status">Getting your questions ready…</div>;
  }

  if (finished) {
    const ratio = score / round.length;
    return (
      <div className="dashboard-game-pop flex h-full flex-col items-center justify-center text-center">
        <span className="text-4xl" aria-hidden="true">{isCode ? '💻' : ratio >= 0.8 ? '🏆' : ratio >= 0.4 ? '👏' : '🌱'}</span>
        <p className="mt-2 text-xl font-black text-white">{score} of {round.length} correct</p>
        <p className="mt-1 text-xs text-stone-300">
          {ratio >= 0.8 ? 'Excellent work!' : ratio >= 0.4 ? 'Nice effort. Try a fresh round!' : 'Give it another try!'}
        </p>
        <button
          type="button"
          onClick={restart}
          className="mt-4 rounded-xl bg-[#E3BF96] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#2F362A] transition hover:bg-white active:scale-95 shadow-xs"
        >
          New questions
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-stone-300">
        <span>{isCode ? 'What does this print?' : 'Question'} {index + 1}/{round.length}</span>
        <span className="tabular-nums">Score {score}{streak >= 2 ? ` · ${streak} in a row 🔥` : ''}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <div
          className="h-full bg-[#E3BF96] transition-all duration-300 rounded-full"
          style={{ width: `${(index / round.length) * 100}%` }}
        />
      </div>

      <p className={`mt-3.5 min-h-10 text-sm font-bold leading-snug text-white sm:text-base ${isCode ? 'whitespace-pre-wrap rounded-xl border border-white/10 bg-[#232920]/80 p-3.5 font-mono text-[#E3BF96] text-xs' : ''}`}>
        {current.question}
      </p>

      <div className={`mt-3.5 grid gap-2.5 ${isCode ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`} role="group" aria-label="Answer choices">
        {current.options.map((option, optionIndex) => {
          const correct = optionIndex === current.answer;
          const selected = optionIndex === picked;
          const color = picked === null
            ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
            : correct
              ? 'border-[#707C65] bg-[#707C65] text-white shadow-xs'
              : selected
                ? 'border-[#C85D44] bg-[#C85D44] text-white shadow-xs'
                : 'border-transparent bg-white/5 text-white/40';

          return (
            <button
              key={`${index}-${option}`}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(optionIndex)}
              className={`min-h-10 rounded-xl border px-3.5 py-2 text-left text-xs font-bold transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3BF96] ${isCode ? 'font-mono' : ''} ${color}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex min-h-12 items-center justify-between gap-3 pt-3" aria-live="polite">
        {picked === null ? (
          <span className="text-xs text-stone-300">{isCode ? 'Choose the exact console output.' : 'Read carefully — not everything is as it seems.'}</span>
        ) : (
          <>
            <p className="flex-1 text-xs leading-snug text-stone-200">
              <strong className={picked === current.answer ? 'text-[#E3BF96]' : 'text-[#F3D7CB]'}>
                {picked === current.answer ? 'Correct! ' : 'Not quite. '}
              </strong>
              {current.explanation}
            </p>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setIndex((value) => value + 1);
              }}
              className="shrink-0 rounded-xl bg-[#E3BF96] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#2F362A] transition hover:bg-white active:scale-95 shadow-xs"
            >
              {index === round.length - 1 ? 'See score' : 'Next'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const GAME_TABS: { id: GameTab; title: string; emoji: string; hint: string }[] = [
  { id: 'puzzle', title: 'Puzzle', emoji: '🧩', hint: 'Slide tiles in order' },
  { id: 'trivia', title: 'Quick quiz', emoji: '💡', hint: 'Fresh riddles every round' },
  { id: 'javascript', title: 'Code quiz', emoji: '⌨️', hint: 'Guess the output' },
];

export default function DashboardGames() {
  const [activeGame, setActiveGame] = useState<GameTab>('puzzle');
  const activeTab = GAME_TABS.find((tab) => tab.id === activeGame);

  return (
    <section className="dashboard-games-enter relative isolate overflow-hidden rounded-[32px] border border-[#ECE3D3] bg-[#FCFAF7] p-5 text-stone-800 shadow-sm sm:p-7 lg:p-8 font-sans">
      {/* Subtle organic background ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-[#E3BF96]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-56 w-56 rounded-full bg-[#848F76]/15 blur-3xl" aria-hidden="true" />

      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
          A LITTLE BREAK
        </span>
        <h2 className="mt-0.5 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
          Games &amp; brain breaks
        </h2>
        <p className="mt-1 max-w-xl text-xs font-medium text-stone-500 sm:text-sm">
          A quick puzzle, a tricky question or a code challenge to refresh your focus.
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5">
        {GAME_TABS.map((tab) => {
          const isActive = activeGame === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveGame(tab.id)}
              className={`group flex items-center gap-2 rounded-2xl border py-2 pl-2 pr-4 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5D6953] ${
                isActive
                  ? 'border-[#5D6953] bg-[#5D6953] text-white shadow-xs'
                  : 'border-[#ECE3D3] bg-white text-stone-700 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-110 ${
                  isActive ? 'bg-white/20' : 'bg-[#F6F8F3] text-stone-700'
                }`}
                aria-hidden="true"
              >
                {tab.emoji}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-black">{tab.title}</span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-[#DCE4D5]' : 'text-stone-400'}`}>
                  {tab.hint}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Game Display Arena (Deep Forest Olive Theme) */}
      <div className="mt-4 min-h-[420px] rounded-3xl border border-[#485341] bg-gradient-to-br from-[#5D6953] via-[#4D5844] to-[#3B4534] text-white shadow-md p-5 sm:mt-5 sm:min-h-[340px] sm:p-7">
        <div key={activeGame} className="dashboard-game-panel h-full">
          <div className="mb-4 flex items-center justify-between border-b border-white/15 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#E3BF96]">
              {activeTab?.emoji} {activeTab?.title}
            </h3>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-[#DCE4D5]">
              Just for fun
            </span>
          </div>

          <div className="min-h-[350px] sm:min-h-[250px]">
            {activeGame === 'puzzle' && <SlidePuzzle />}
            {activeGame === 'trivia' && <QuizGame bank={TRIVIA_QUESTIONS} storageKey="games_seen_trivia" />}
            {activeGame === 'javascript' && <QuizGame bank={JAVASCRIPT_QUESTIONS} isCode storageKey="games_seen_javascript" />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dashboard-games-enter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashboard-game-panel {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashboard-game-pop {
          from { opacity: 0; transform: scale(.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .dashboard-games-enter { animation: dashboard-games-enter .45s ease-out both; }
        .dashboard-game-panel { animation: dashboard-game-panel .25s ease-out both; }
        .dashboard-game-pop { animation: dashboard-game-pop .25s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-games-enter, .dashboard-game-panel, .dashboard-game-pop { animation: none; }
        }
      `}</style>
    </section>
  );
}