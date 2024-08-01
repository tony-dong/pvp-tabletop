import { copy } from '$lib/util/object.js';
import { writable } from './writable.js';
import { pile, slots, rehydrateSlot, dehydrateSlot } from './cards.js';

export function board(isPlayer = true) {
   const cards = writable([]);
   const deck = pile('deck');
   const hand = pile('hand');
   const prizes = pile('prizes');
   const discard = pile('discard');
   const lz = pile('lz');
   const bench = slots();
   const active = writable(null);
   const stadium = writable(null);
   const table = pile('table');
   const pickup = pile('pickup');

   const vstarUsed = writable(false);
   const gxUsed = writable(false);

   const prizesFlipped = writable(false);
   const handRevealed = writable(false);
   const pokemonHidden = writable(false);

   const isBrowser = typeof window !== 'undefined';

   isBrowser &&
      isPlayer &&
      localStorage.boardState &&
      rehydrateBoard(localStorage.boardState);

   if (isPlayer) {
      for (const obj of [
         cards,
         deck,
         prizesFlipped,
         hand,
         vstarUsed,
         gxUsed,
         prizes,
         discard,
         lz,
         stadium,
         table,
         pickup,
      ]) {
         obj.subscribe(() => {
            if (isBrowser) localStorage.boardState = dehydrateBoard();
         });
      }

      active.subscribe(() => {
         if (isBrowser) localStorage.boardState = dehydrateBoard();
         if (active.get()) {
            subscribeSlot(active.get());
         }
      });
      if (active.get()) {
         subscribeSlot(active.get());
      }

      bench.subscribe(() => {
         if (isBrowser) localStorage.boardState = dehydrateBoard();
         if (bench.get().length) {
            for (const benchSlot of bench.get()) {
               subscribeSlot(benchSlot);
            }
         }
      });
      for (const benchSlot of bench.get()) {
         subscribeSlot(benchSlot);
      }
   }

   function subscribeSlot(slot) {
      for (const obj of ['energy', 'pokemon', 'trainer', 'damage', 'marker']) {
         slot[obj].subscribe(() => {
            if (isBrowser) localStorage.boardState = dehydrateBoard();
         });
      }
   }

   function loadDeck() {
      let j = 1;
      deck.clear();
      for (const card of cards.get()) {
         for (let i = 1; i <= card.count; i++) {
            const c = copy(card, ['count']);
            c._id = j++; // the cards individual "id" for the playtest session
            deck.push(c);
         }
      }
   }

   function reset() {
      deck.clear();
      loadDeck();

      vstarUsed.set(false);
      gxUsed.set(false);
      prizesFlipped.set(false);

      hand.clear();
      prizes.clear();
      discard.clear();
      lz.clear();
      bench.clear();
      active.set(null);
      stadium.set(null);
      table.clear();
      pickup.clear();
   }

   function rehydrateBoard(boardState) {
      let boardStateObj =
         typeof boardState !== 'string' ? boardState : JSON.parse(boardState);

      cards.set(boardStateObj.cards);
      deck.set(boardStateObj.deck);

      vstarUsed.set(boardStateObj.vstarUsed);
      gxUsed.set(boardStateObj.gxUsed);
      prizesFlipped.set(boardStateObj.prizesFlipped);
      hand.set(boardStateObj.hand);
      prizes.set(boardStateObj.prizes);
      discard.set(boardStateObj.discard);
      lz.set(boardStateObj.lz);
      stadium.set(boardStateObj.stadium);
      table.set(boardStateObj.table);
      pickup.set(boardStateObj.pickup);
      active.set(rehydrateSlot(boardStateObj.active));
      bench.set(boardStateObj.bench.map((slot) => rehydrateSlot(slot)));
   }

   function dehydrateBoard() {
      return JSON.stringify({
         cards: cards.get(),
         deck: deck.get(),
         hand: hand.get(),
         prizes: prizes.get(),
         discard: discard.get(),
         lz: lz.get(),
         active: active.get() ? dehydrateSlot(active.get()) : null,
         bench: bench.get().map((slot) => dehydrateSlot(slot)),
         stadium: stadium.get(),
         table: table.get(),
         pickup: pickup.get(),
         vstarUsed: vstarUsed.get(),
         gxUsed: gxUsed.get(),
         prizesFlipped: prizesFlipped.get(),
         handRevealed: handRevealed.get(),
         pokemonHidden: pokemonHidden.get(),
      });
   }

   function exportBoard() {
      const expPile = (p) => p.get().map((card) => card._id);
      const expSlot = (s) => ({
         id: s.id,
         pokemon: expPile(s.pokemon),
         energy: expPile(s.energy),
         trainer: expPile(s.trainer),
         damage: s.damage.get(),
         marker: s.marker.get(),
      });

      return {
         deck: expPile(deck),
         hand: expPile(hand),
         prizes: expPile(prizes),
         discard: expPile(discard),
         lz: expPile(lz),
         active: active.get() ? expSlot(active.get()) : null,
         bench: bench.get().map((slot) => expSlot(slot)),
         stadium: stadium.get()?._id,
         table: expPile(table),
         pickup: expPile(pickup),
         vstarUsed: vstarUsed.get(),
         gxUsed: gxUsed.get(),
         prizesFlipped: prizesFlipped.get(),
         handRevealed: handRevealed.get(),
         pokemonHidden: pokemonHidden.get(),
      };
   }

   return {
      cards,
      deck,
      hand,
      prizes,
      discard,
      lz,
      bench,
      active,
      stadium,
      table,
      pickup,
      vstarUsed,
      gxUsed,
      prizesFlipped,
      handRevealed,
      pokemonHidden,
      exportBoard,
      dehydrateBoard,
      rehydrateBoard,
      reset,
      // utility function used in multiple files
      findSlot: (slotId) => {
         if (active.get()?.id === slotId) return active.get();
         else return bench.get().find((s) => s.id === slotId);
      },
   };
}
