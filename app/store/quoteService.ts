import quotesData from '@/data/quote.json';

export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
  moods: number[];
}

const ALL_QUOTES: Quote[] = quotesData as Quote[];

const SEEN_QUOTES_KEY = 'seen_quotes_history';
const CURRENT_SESSION_KEY = 'current_session_quote';

function getSeenQuoteIds(): number[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SEEN_QUOTES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function markQuoteAsSeen(id: number) {
  const seen = getSeenQuoteIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_QUOTES_KEY, JSON.stringify(seen));
  }
}

// 1. Function to pick the quote based on mood
export function getQuoteForMood(rating: number): Quote {
  const filteredQuotes = ALL_QUOTES.filter(q => q.moods.includes(rating));
  const seenIds = getSeenQuoteIds();
  
  let unseenQuotes = filteredQuotes.filter(q => !seenIds.includes(q.id));

  if (unseenQuotes.length === 0) {
    unseenQuotes = filteredQuotes.length ? filteredQuotes : ALL_QUOTES;
  }

  const randomIndex = Math.floor(Math.random() * unseenQuotes.length);
  const selectedQuote = unseenQuotes[randomIndex];

  markQuoteAsSeen(selectedQuote.id);
  return selectedQuote;
}

// 2. Save the locked-in session
export function saveSessionQuote(rating: number, quote: Quote) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({ rating, quote }));
}

// 3. Load the locked-in session (if they refresh the page)
export function loadSessionQuote(): { rating: number, quote: Quote } | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
}

// 4. Clear session (Call this when the user logs out)
export function clearSessionQuote() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_SESSION_KEY);
}