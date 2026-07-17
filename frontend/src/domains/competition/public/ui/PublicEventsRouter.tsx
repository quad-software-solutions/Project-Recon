import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile } from '@/shared/types';

type PublicEventsView =
  | { id: 'home' }
  | { id: 'list'; initialQuery?: string }
  | { id: 'event'; eventId: string }
  | { id: 'tournament'; eventId: string }
  | { id: 'match'; matchId: string; tournamentId?: string | null };

const PublicEventsHomePage = React.lazy(() => import('./PublicEventsHomePage'));
const PublicEventsListPage = React.lazy(() => import('./PublicEventsListPage'));
const PublicEventDetailsPage = React.lazy(() => import('./PublicEventDetailsPage'));
const PublicTournamentPage = React.lazy(() => import('./PublicTournamentPage'));
const PublicMatchPage = React.lazy(() => import('./PublicMatchPage'));

interface PublicEventsRouterProps {
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
}

export default function PublicEventsRouter({ currentUser, onNavigateLogin }: PublicEventsRouterProps) {
  const [view, setView] = useState<PublicEventsView>({ id: 'home' });

  const key = useMemo(() => {
    if (view.id === 'event') return `event:${view.eventId}`;
    if (view.id === 'tournament') return `tournament:${view.eventId}`;
    if (view.id === 'match') return `match:${view.matchId}:${view.tournamentId ?? ''}`;
    if (view.id === 'list') return `list:${view.initialQuery ?? ''}`;
    return 'home';
  }, [view]);

  const goHome = () => setView({ id: 'home' });
  const goList = (initialQuery?: string) => setView({ id: 'list', initialQuery });
  const goEvent = (eventId: string) => setView({ id: 'event', eventId });
  const goTournament = (eventId: string) => setView({ id: 'tournament', eventId });
  const goMatch = (matchId: string, tournamentId?: string | null) => setView({ id: 'match', matchId, tournamentId: tournamentId ?? null });

  return (
    <React.Suspense fallback={null}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="min-w-0"
        >
          {view.id === 'home' && (
            <PublicEventsHomePage
              currentUser={currentUser}
              onNavigateLogin={onNavigateLogin}
              onExplore={() => goList()}
              onSearch={(q) => goList(q)}
              onOpenEvent={(id) => goEvent(id)}
              onOpenTournament={(eventId) => goTournament(eventId)}
              onOpenMatch={(matchId, tournamentId) => goMatch(matchId, tournamentId)}
            />
          )}

          {view.id === 'list' && (
            <PublicEventsListPage
              currentUser={currentUser}
              onNavigateLogin={onNavigateLogin}
              initialQuery={view.initialQuery}
              onBack={goHome}
              onOpenEvent={goEvent}
              onOpenTournament={goTournament}
            />
          )}

          {view.id === 'event' && (
            <PublicEventDetailsPage
              currentUser={currentUser}
              onNavigateLogin={onNavigateLogin}
              eventId={view.eventId}
              onBack={() => goList()}
              onOpenTournament={goTournament}
              onOpenMatch={goMatch}
              onOpenEvent={goEvent}
            />
          )}

          {view.id === 'tournament' && (
            <PublicTournamentPage
              currentUser={currentUser}
              onNavigateLogin={onNavigateLogin}
              eventId={view.eventId}
              onBack={() => goList()}
              onOpenMatch={goMatch}
              onOpenEvent={goEvent}
            />
          )}

          {view.id === 'match' && (
            <PublicMatchPage
              matchId={view.matchId}
              tournamentId={view.tournamentId}
              onBack={() => goHome()}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </React.Suspense>
  );
}

