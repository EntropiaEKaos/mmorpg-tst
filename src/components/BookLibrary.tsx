import { useState } from 'react';
import type { Player } from '../game/types';
import { getAllBooks, getReadBooks, markBookRead, type Book } from '../game/content';

interface Props {
  player: Player;
  onClose: () => void;
}

export default function BookLibrary({ player, onClose }: Props) {
  const books = getAllBooks();
  const read = getReadBooks(player.name);
  const [active, setActive] = useState<Book | null>(null);
  const [page, setPage] = useState(0);

  const openBook = (book: Book) => {
    setActive(book);
    setPage(0);
    markBookRead(player.name, book.id);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(50,35,15,0.98) 0%, rgba(25,18,8,0.98) 100%)', borderColor: '#9b59ff', boxShadow: '0 0 50px rgba(155,89,255,0.3)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #9b59ff 0%, #4a2090 100%)' }}>
            📚 LIBRARY
          </h2>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>
        </div>

        {!active ? (
          <div className="overflow-y-auto flex-1">
            {books.length === 0 ? (
              <div className="text-center text-purple-200/40 py-12">
                <div className="text-5xl mb-3">📖</div>
                <div>The library shelves are empty. An admin can create books to fill them!</div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {books.map((book) => {
                  const isRead = read.includes(book.id);
                  return (
                    <button key={book.id} onClick={() => openBook(book)}
                            className="p-3 rounded-lg border-2 text-center transition-all hover:scale-105"
                            style={{ background: `linear-gradient(180deg, ${book.color}30 0%, rgba(20,10,5,0.9) 100%)`, borderColor: book.color }}>
                      <div className="text-4xl mb-1">{book.icon}</div>
                      <div className="text-xs font-bold text-amber-100 truncate">{book.title}</div>
                      <div className="text-[9px] text-purple-200/60">by {book.author}</div>
                      <div className="text-[9px] text-purple-200/40 mt-1">{book.pages.length} pages</div>
                      {isRead && <div className="text-[9px] text-green-400 mt-0.5">✓ Read</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <button onClick={() => setActive(null)} className="text-purple-300 hover:text-purple-100 text-xs mb-3 self-start">← Back to library</button>
            <div className="rounded-lg border-2 p-6 flex-1 overflow-y-auto"
                 style={{ background: 'linear-gradient(180deg, rgba(80,60,30,0.4) 0%, rgba(40,30,15,0.4) 100%)', borderColor: active.color }}>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{active.icon}</div>
                <h3 className="text-2xl font-bold" style={{ color: active.color, fontFamily: 'serif' }}>{active.title}</h3>
                <div className="text-xs text-purple-200/60 italic">by {active.author}</div>
              </div>
              <div className="text-amber-100/90 leading-relaxed text-sm whitespace-pre-wrap" style={{ fontFamily: 'serif' }}>
                {active.pages[page]}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-4 py-1.5 rounded bg-purple-900/50 text-purple-200 text-xs disabled:opacity-30 border border-purple-700/50">
                ◀ Previous
              </button>
              <span className="text-purple-200/60 text-xs">Page {page + 1} of {active.pages.length}</span>
              <button onClick={() => setPage((p) => Math.min(active.pages.length - 1, p + 1))} disabled={page >= active.pages.length - 1}
                      className="px-4 py-1.5 rounded bg-purple-900/50 text-purple-200 text-xs disabled:opacity-30 border border-purple-700/50">
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
