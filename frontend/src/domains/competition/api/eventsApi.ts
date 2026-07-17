import { http } from '@/shared/api/http';
import { fetchAllPages, type PaginatedResponse } from '@/shared/api/pagination';

/* ─── Backend-Matching Types ─── */

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type EventType = 'GENERAL' | 'TOURNAMENT' | 'WORKSHOP';
export type RegistrationMode = 'NONE' | 'PUBLIC' | 'STUDENT' | 'SUBPROGRAM_STUDENT';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'CANCELLED';
export type WorkshopLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SideType = 'SIDE_A' | 'SIDE_B';

export interface BackendEvent {
  id: string;
  branch?: string | null;
  branch_name?: string;
  title: string;
  description: string;
  banner?: string | null;
  location: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  visibility: Visibility;
  status: EventStatus;
  registration_enabled: boolean;
  registration_mode?: RegistrationMode | null;
  registration_deadline?: string | null;
  payment_required: boolean;
  registration_fee?: string | null;
  capacity?: number | null;
  enrolled_count: number;
  youtube_live_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tournament?: BackendTournament;
  workshop?: BackendWorkshop;
}

export interface BackendTournament {
  id: string;
  event: string;
  event_title?: string;
  category: string;
  category_name?: string;
  max_teams?: number | null;
  prize_pool?: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendTournamentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendTournamentTeam {
  id: string;
  tournament: string;
  tournament_title?: string;
  registration?: string | null;
  team_name: string;
  organization?: string | null;
  coach_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface BackendMatch {
  id: string;
  tournament: string;
  tournament_title?: string;
  round: string;
  scheduled_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  winning_side?: string | null;
  winning_side_label?: string | null;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  sides: BackendMatchSide[];
}

export interface BackendMatchSide {
  id: string;
  match: string;
  side: SideType;
  score: number;
  created_at: string;
  updated_at: string;
  participants: BackendMatchParticipant[];
}

export interface BackendMatchParticipant {
  id: string;
  match_side: string;
  tournament_team: string;
  team_name?: string;
  tournament_team_name?: string;
  created_at: string;
}

export interface BackendWorkshop {
  id: string;
  event: string;
  event_title?: string;
  instructor: string;
  instructor_name?: string;
  duration_minutes: number;
  level: WorkshopLevel;
  price?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendEventRegistration {
  id: string;
  event: string;
  event_title?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  event_type?: EventType;
  student?: string | null;
  student_email?: string;
  public_full_name?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  public_organization?: string | null;
  registration_status: RegistrationStatus;
  payment_status: string;
  registered_at: string;
  approved_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendStanding {
  rank?: number;
  team_id: string;
  team_name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  matchesPlayed?: number;
  totalScore?: number;
}

export interface BackendEventPayment {
  id: string;
  registration: string;
  registration_id?: string;
  event_title?: string;
  student_name?: string;
  student_email?: string;
  amount: string;
  payment_method: string;
  transaction_reference?: string | null;
  bank_name?: string;
  attachment?: string;
  payment_date?: string | null;
  status: PaymentStatus;
  verified_by?: string | null;
  verified_by_name?: string;
  verified_by_email?: string;
  verified_at?: string | null;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

/* ─── API ─── */

const BASE = '/events';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function fetchAllPublicEvents(params?: Record<string, string>): Promise<BackendEvent[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<BackendEvent>>(`${BASE}/events/`, {
      params: { ...params, page: String(page), page_size: '100' },
    }),
  );
}

/* ═══ PUBLIC ═══ */

export async function getPublicEvents(params?: Record<string, string>): Promise<BackendEvent[]> {
  return fetchAllPublicEvents(params);
}

export function getPublicEventDetail(id: string) {
  return http.get<BackendEvent>(`${BASE}/events/${id}/`);
}

export async function getLiveEvents(): Promise<BackendEvent[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<BackendEvent>>(`${BASE}/events/live/`, {
      params: { page: String(page), page_size: '100' },
    }),
  );
}

export async function getUpcomingEvents(): Promise<BackendEvent[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<BackendEvent>>(`${BASE}/events/upcoming/`, {
      params: { page: String(page), page_size: '100' },
    }),
  );
}

export async function getPastEvents(): Promise<BackendEvent[]> {
  return fetchAllPages(page =>
    http.get<PaginatedResponse<BackendEvent>>(`${BASE}/events/past/`, {
      params: { page: String(page), page_size: '100' },
    }),
  );
}

export function getPublicTournaments(params?: Record<string, string>) {
  return http.get<BackendTournament[]>(`${BASE}/events/tournaments/`, { params });
}

export function getPublicTournamentDetail(id: string) {
  return http.get<BackendTournament>(`${BASE}/events/tournaments/${id}/`);
}

export function getPublicTournamentStandings(id: string, params?: Record<string, string>) {
  return http.get<BackendStanding[]>(`${BASE}/events/tournaments/${id}/standings/`, { params });
}

export function getPublicTournamentWinner(id: string) {
  return http.get<BackendStanding>(`${BASE}/events/tournaments/${id}/winner/`);
}

export function getPublicTournamentMatches(id: string) {
  return http.get<BackendMatch[]>(`${BASE}/events/tournaments/${id}/matches/`);
}

export function getPublicWorkshops(params?: Record<string, string>) {
  return http.get<BackendWorkshop[]>(`${BASE}/events/workshops/`, { params });
}

export function getPublicWorkshopDetail(id: string) {
  return http.get<BackendWorkshop>(`${BASE}/events/workshops/${id}/`);
}

/* ═══ REGISTRATION ═══ */

export function registerForEvent(eventId: string, data: unknown) {
  return http.post<BackendEventRegistration>(`${BASE}/events/${eventId}/register/`, data);
}

export function getMyRegistrations() {
  return http.get<BackendEventRegistration[]>(`${BASE}/my-registrations/`);
}

export function cancelMyRegistration(id: string) {
  return http.post<BackendEventRegistration>(`${BASE}/my-registrations/${id}/cancel/`, {});
}

/* ═══ ADMIN - EVENTS ═══ */

export function adminGetEvents(params?: Record<string, string>) {
  return http.get<BackendEvent[]>(`${BASE}/admin/events/`, { params });
}

export function adminCreateEvent(data: Partial<BackendEvent> | FormData) {
  return http.post<BackendEvent>(`${BASE}/admin/events/`, data);
}

export function adminGetEvent(id: string) {
  return http.get<BackendEvent>(`${BASE}/admin/events/${id}/`);
}

export function adminUpdateEvent(id: string, data: Partial<BackendEvent> | FormData) {
  return http.put<BackendEvent>(`${BASE}/admin/events/${id}/`, data);
}

export function adminPatchEvent(id: string, data: Partial<BackendEvent>) {
  return http.patch<BackendEvent>(`${BASE}/admin/events/${id}/`, data);
}

export function adminDeleteEvent(id: string) {
  return http.delete(`${BASE}/admin/events/${id}/`);
}

export function adminPublishEvent(id: string) {
  return http.post<BackendEvent>(`${BASE}/admin/events/${id}/publish/`, {});
}

export function adminUnpublishEvent(id: string) {
  return http.post<BackendEvent>(`${BASE}/admin/events/${id}/unpublish/`, {});
}

export function adminActivateEvent(id: string) {
  return http.post<BackendEvent>(`${BASE}/admin/events/${id}/activate/`, {});
}

export function adminDeactivateEvent(id: string) {
  return http.post<BackendEvent>(`${BASE}/admin/events/${id}/deactivate/`, {});
}

/* ═══ ADMIN - TOURNAMENTS ═══ */

export function adminGetTournaments(params?: Record<string, string>) {
  return http.get<BackendTournament[]>(`${BASE}/admin/tournaments/`, { params });
}

export function adminCreateTournament(data: Partial<BackendTournament>) {
  return http.post<BackendTournament>(`${BASE}/admin/tournaments/`, data);
}

export function adminGetTournament(id: string) {
  return http.get<BackendTournament>(`${BASE}/admin/tournaments/${id}/`);
}

export function adminUpdateTournament(id: string, data: Partial<BackendTournament>) {
  return http.put<BackendTournament>(`${BASE}/admin/tournaments/${id}/`, data);
}

export function adminPatchTournament(id: string, data: Partial<BackendTournament>) {
  return http.patch<BackendTournament>(`${BASE}/admin/tournaments/${id}/`, data);
}

export function adminDeleteTournament(id: string) {
  return http.delete(`${BASE}/admin/tournaments/${id}/`);
}

export function adminCloseTournament(id: string) {
  return http.post<BackendTournament>(`${BASE}/admin/tournaments/${id}/close/`, {});
}

export function adminReopenTournament(id: string) {
  return http.post<BackendTournament>(`${BASE}/admin/tournaments/${id}/reopen/`, {});
}

export function adminGetTournamentStandings(id: string, params?: Record<string, string>) {
  return http.get<BackendStanding[]>(`${BASE}/admin/tournaments/${id}/standings/`, { params });
}

export function adminGetTournamentWinner(id: string) {
  return http.get<BackendStanding>(`${BASE}/admin/tournaments/${id}/winner/`);
}

export function adminGetTournamentTeams(id: string) {
  return http.get<BackendTournamentTeam[]>(`${BASE}/admin/tournaments/${id}/teams/`);
}

export function adminGetTournamentMatches(id: string) {
  return http.get<BackendMatch[]>(`${BASE}/admin/tournaments/${id}/matches/`);
}

/* ═══ ADMIN - CATEGORIES ═══ */

export function adminGetTournamentCategories(params?: Record<string, string>) {
  return http.get<BackendTournamentCategory[]>(`${BASE}/admin/tournament-categories/`, { params });
}

export function adminCreateTournamentCategory(data: Partial<BackendTournamentCategory>) {
  return http.post<BackendTournamentCategory>(`${BASE}/admin/tournament-categories/`, data);
}

export function adminGetTournamentCategory(id: string) {
  return http.get<BackendTournamentCategory>(`${BASE}/admin/tournament-categories/${id}/`);
}

export function adminUpdateTournamentCategory(id: string, data: Partial<BackendTournamentCategory>) {
  return http.put<BackendTournamentCategory>(`${BASE}/admin/tournament-categories/${id}/`, data);
}

export function adminDeleteTournamentCategory(id: string) {
  return http.delete(`${BASE}/admin/tournament-categories/${id}/`);
}

/* ═══ ADMIN - TEAMS ═══ */

export function adminGetTeams(params?: Record<string, string>) {
  return http.get<BackendTournamentTeam[]>(`${BASE}/admin/tournament-teams/`, { params });
}

export function adminCreateTeam(data: Partial<BackendTournamentTeam>) {
  return http.post<BackendTournamentTeam>(`${BASE}/admin/tournament-teams/`, data);
}

export function adminGetTeam(id: string) {
  return http.get<BackendTournamentTeam>(`${BASE}/admin/tournament-teams/${id}/`);
}

export function adminUpdateTeam(id: string, data: Partial<BackendTournamentTeam>) {
  return http.put<BackendTournamentTeam>(`${BASE}/admin/tournament-teams/${id}/`, data);
}

export function adminDeleteTeam(id: string) {
  return http.delete(`${BASE}/admin/tournament-teams/${id}/`);
}

/* ═══ ADMIN - MATCHES ═══ */

export function adminGetMatches(params?: Record<string, string>) {
  return http.get<BackendMatch[]>(`${BASE}/admin/matches/`, { params });
}

export function adminCreateMatch(data: Partial<BackendMatch>) {
  return http.post<BackendMatch>(`${BASE}/admin/matches/`, data);
}

export function adminGetMatch(id: string) {
  return http.get<BackendMatch>(`${BASE}/admin/matches/${id}/`);
}

export function adminUpdateMatch(id: string, data: Partial<BackendMatch>) {
  return http.put<BackendMatch>(`${BASE}/admin/matches/${id}/`, data);
}

export function adminPatchMatch(id: string, data: Partial<BackendMatch>) {
  return http.patch<BackendMatch>(`${BASE}/admin/matches/${id}/`, data);
}

export function adminDeleteMatch(id: string) {
  return http.delete(`${BASE}/admin/matches/${id}/`);
}

export function adminAssignTeamToMatch(matchId: string, data: { side: SideType; tournament_team: string }) {
  return http.post<BackendMatch>(`${BASE}/admin/matches/${matchId}/assign-team/`, data);
}

export function adminRemoveTeamFromMatch(matchId: string, data: { side: SideType; tournament_team: string }) {
  return http.post<BackendMatch>(`${BASE}/admin/matches/${matchId}/remove-team/`, data);
}

export function adminRecordMatchScores(matchId: string, data: { side_a_score: number; side_b_score: number }) {
  return http.post<BackendMatch>(`${BASE}/admin/matches/${matchId}/record-scores/`, data);
}

export function adminCompleteMatch(matchId: string) {
  return http.post<BackendMatch>(`${BASE}/admin/matches/${matchId}/complete/`, {});
}

/* ═══ ADMIN - WORKSHOPS ═══ */

export function adminGetWorkshops(params?: Record<string, string>) {
  return http.get<BackendWorkshop[]>(`${BASE}/admin/workshops/`, { params });
}

export function adminCreateWorkshop(data: Partial<BackendWorkshop>) {
  return http.post<BackendWorkshop>(`${BASE}/admin/workshops/`, data);
}

export function adminGetWorkshop(id: string) {
  return http.get<BackendWorkshop>(`${BASE}/admin/workshops/${id}/`);
}

export function adminUpdateWorkshop(id: string, data: Partial<BackendWorkshop>) {
  return http.put<BackendWorkshop>(`${BASE}/admin/workshops/${id}/`, data);
}

export function adminDeleteWorkshop(id: string) {
  return http.delete(`${BASE}/admin/workshops/${id}/`);
}

/* ═══ ADMIN - REGISTRATIONS ═══ */

export function adminGetRegistrations(params?: Record<string, string>) {
  return http.get<BackendEventRegistration[]>(`${BASE}/admin/registrations/`, { params });
}

export function adminGetRegistration(id: string) {
  return http.get<BackendEventRegistration>(`${BASE}/admin/registrations/${id}/`);
}

export function adminApproveRegistration(id: string) {
  return http.post<BackendEventRegistration>(`${BASE}/admin/registrations/${id}/approve/`, {});
}

export function adminRejectRegistration(id: string) {
  return http.post<BackendEventRegistration>(`${BASE}/admin/registrations/${id}/reject/`, {});
}

export function adminCancelRegistration(id: string) {
  return http.post<BackendEventRegistration>(`${BASE}/admin/registrations/${id}/cancel/`, {});
}

export function adminConvertRegistrationToTeam(id: string, teamName?: string) {
  return http.post<BackendTournamentTeam>(`${BASE}/admin/registrations/${id}/convert-to-team/`, { team_name: teamName || '' });
}

/* ═══ ADMIN - PAYMENTS ═══ */

export function adminRecordCashPayment(registrationId: string, data: { amount: string; payment_date?: string }) {
  return http.post(`${BASE}/admin/registrations/${registrationId}/pay/cash/`, data);
}

export function adminVerifyPayment(registrationId: string, data?: { verification_notes?: string }) {
  return http.post(`${BASE}/admin/registrations/${registrationId}/verify-payment/`, data || {});
}

export function adminRejectPayment(registrationId: string, data: { verification_notes: string }) {
  return http.post(`${BASE}/admin/registrations/${registrationId}/reject-payment/`, data);
}

export function adminListPayments(params?: { event?: string; status?: string }) {
  return http.get<BackendEventPayment[]>(`${BASE}/admin/payments/`, { params });
}
