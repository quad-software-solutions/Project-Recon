import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Award, Trophy, Shield, Medal, Star, Zap, Settings, BookOpen,
  Sparkles, Flame, Cpu, Users, CheckCircle2, Loader2, AlertCircle,
  Download, ExternalLink, QrCode, ScrollText, X, Search,
  UserCheck, Shield as ShieldIcon, Check, Plus, RotateCcw,
} from 'lucide-react';
import { adminGetTournamentTeams, adminGetRegistrations, type BackendTournamentTeam, type BackendEventRegistration } from '../../api/eventsApi';
import { getTournamentById, getTournamentStandings, type StandingEntry } from '../../api/competitionApi';
import { type Tournament, type Certificate } from '@/shared/types';
import { fetchCertificateTemplatesApi, issueStudentCertificateApi, fetchStudentCertificatesApi } from '@/domains/learning/academics/api/academicApi';

const VEX_AWARDS = [
  { key: 'participation', label: 'Participation', desc: 'Awarded to all competing teams', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
  { key: 'excellence', label: 'Excellence Award', desc: 'Top overall team across all criteria', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'champions', label: 'Tournament Champions', desc: '1st/2nd/3rd place alliance', icon: Shield, color: 'text-brand-red', bg: 'bg-brand-red/10' },
  { key: 'automaton', label: 'Automaton Award', desc: 'Best autonomous programming routine', icon: Cpu, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'design', label: 'Design Award', desc: 'Most effective robot design & strategy', icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'robot_skills', label: 'Robot Skills Champion', desc: 'Highest driver & programming skills score', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'judges', label: "Judges Award", desc: 'Special recognition from judging panel', icon: Medal, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'sportsmanship', label: 'Sportsmanship Award', desc: 'Best embodies gracious professionalism', icon: Star, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'think', label: 'Think Award', desc: 'Best engineering notebook & process', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'innovate', label: 'Innovate Award', desc: 'Most innovative engineering solution', icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'energy', label: 'Energy Award', desc: 'High-energy team spirit & enthusiasm', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
];

type TeamCertStatus = 'none' | 'pending' | 'issued';

interface TeamAwardState {
  teamId: string;
  teamName: string;
  awards: Record<string, TeamCertStatus>;
}

interface TournamentCertificateManagerProps {
  tournamentId: string;
  tournament: Tournament;
  standings: StandingEntry[];
  userRole: string | null;
}

export default function TournamentCertificateManager({ tournamentId, tournament, standings, userRole }: TournamentCertificateManagerProps) {
  const [teams, setTeams] = useState<BackendTournamentTeam[]>([]);
  const [registrations, setRegistrations] = useState<BackendEventRegistration[]>([]);
  const [certTemplates, setCertTemplates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAward, setSelectedAward] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamAwards, setTeamAwards] = useState<TeamAwardState[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [issueLog, setIssueLog] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [issueAllParticipation, setIssueAllParticipation] = useState(false);

  const isStaff = userRole === 'Admin' || userRole === 'Manager' || userRole === 'Secretary';

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (isStaff) {
      Promise.all([
        adminGetTournamentTeams(tournamentId).catch(() => []),
        adminGetRegistrations({ event: tournamentId }).catch(() => []),
        fetchCertificateTemplatesApi().catch(() => []),
      ]).then(([t, r, ct]) => {
        setTeams(t);
        setRegistrations(r);
        setCertTemplates(ct);
        const initialAwards: TeamAwardState[] = t.map(team => ({
          teamId: team.id,
          teamName: team.team_name,
          awards: {},
        }));
        setTeamAwards(initialAwards);
      }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
    } else {
      setTeams([]);
      setRegistrations([]);
      setCertTemplates([]);
      const initialAwards: TeamAwardState[] = standings.map(s => ({
        teamId: s.teamName,
        teamName: s.teamName,
        awards: {},
      }));
      setTeamAwards(initialAwards);
      setLoading(false);
    }
  }, [tournamentId, isStaff, standings]);

  const findStudentForTeam = (team: BackendTournamentTeam | null): { studentId: string | null; email: string; name: string } => {
    if (!team) return { studentId: null, email: '', name: '' };
    if (!isStaff) return { studentId: null, email: '', name: team.team_name };
    const regByTeamId = registrations.find(r => r.id === team.registration);
    if (regByTeamId?.student) {
      return { studentId: regByTeamId.student, email: regByTeamId.student_email || '', name: regByTeamId.public_full_name || team.team_name };
    }
    const regByEmail = registrations.find(r =>
      r.student_email?.toLowerCase() === team.contact_email?.toLowerCase()
    );
    if (regByEmail?.student) {
      return { studentId: regByEmail.student, email: regByEmail.student_email || '', name: regByEmail.public_full_name || team.team_name };
    }
    return { studentId: null, email: team.contact_email || '', name: team.team_name };
  };

  const topRankedTeams = useMemo(() => {
    return standings.slice(0, 3).map(s => s.teamName);
  }, [standings]);

  const toggleAward = (teamId: string, awardKey: string) => {
    setTeamAwards(prev => prev.map(ta => {
      if (ta.teamId !== teamId) return ta;
      const newAwards = { ...ta.awards };
      if (newAwards[awardKey] === 'issued') return ta;
      if (newAwards[awardKey]) {
        delete newAwards[awardKey];
      } else {
        newAwards[awardKey] = 'pending';
      }
      return { ...ta, awards: newAwards };
    }));
  };

  const awardParticipationToAll = () => {
    setTeamAwards(prev => prev.map(ta => ({
      ...ta,
      awards: { ...ta.awards, participation: 'pending' as TeamCertStatus },
    })));
    setIssueAllParticipation(true);
  };

  const getAwardCount = (awardKey: string): number => {
    return teamAwards.filter(ta => ta.awards[awardKey]).length;
  };

  const previewTeam = teamAwards.find(ta => ta.teamId === selectedTeam);
  const previewAward = selectedAward ? VEX_AWARDS.find(a => a.key === selectedAward) : null;

  const previewTeamData = teams.find(t => t.id === selectedTeam) || teams.find(t => t.team_name === selectedTeam) || null;
  const previewStudent = findStudentForTeam(previewTeamData);

  const issueCertificates = async () => {
    if (!isStaff) return;
    setIssuing(true);
    setIssueLog([]);
    const logs: string[] = [];
    let successCount = 0;
    let failCount = 0;

    const participationTemplate = certTemplates.find(t =>
      t.title.toLowerCase().includes('participation') ||
      t.title.toLowerCase().includes('tournament')
    );

    for (const ta of teamAwards) {
      const awardKeys = Object.keys(ta.awards).filter(k => ta.awards[k] === 'pending');
      if (awardKeys.length === 0) continue;

      const team = teams.find(t => t.id === ta.teamId);
      if (!team) continue;

      const student = findStudentForTeam(team);
      const template = participationTemplate;

      for (const awardKey of awardKeys) {
        if (!student.studentId) {
          logs.push(`⚠ ${ta.teamName} (${awardKey}): No student ID found (email: ${student.email || 'none'})`);
          failCount++;
          continue;
        }
        if (!template) {
          logs.push(`⚠ ${ta.teamName} (${awardKey}): No certificate template found`);
          failCount++;
          continue;
        }
        try {
          await issueStudentCertificateApi({ student: student.studentId, certificate: template.id });
          logs.push(`✓ ${ta.teamName} (${awardKey}) → ${student.name}`);
          successCount++;
          setTeamAwards(prev => prev.map(p => {
            if (p.teamId !== ta.teamId) return p;
            const newAwards = { ...p.awards, [awardKey]: 'issued' as TeamCertStatus };
            return { ...p, awards: newAwards };
          }));
        } catch (e: any) {
          logs.push(`✗ ${ta.teamName} (${awardKey}): ${e?.message || 'Failed'}`);
          failCount++;
        }
      }
    }
    setIssueLog(logs);
    setIssuing(false);
  };

  const awardColors: Record<string, { bg: string; border: string; text: string }> = {
    none: { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-400' },
    pending: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-600' },
    issued: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600' },
  };

  if (loading) return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-red mx-auto mb-3" />
      <p className="text-sm text-slate-500 font-medium">Loading teams & certificates...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm font-bold text-red-700">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-lg">VEX Tournament Certificates</h3>
              <p className="text-xs text-white/60">{teams.length} teams · {VEX_AWARDS.length} award categories</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/70">
              {teamAwards.filter(ta => Object.keys(ta.awards).length > 0).length}/{teams.length} teams assigned
            </span>
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/70">
              {teamAwards.reduce((sum, ta) => sum + Object.keys(ta.awards).length, 0)} total awards
            </span>
            {tournament.youtubeLiveUrl && (
              <a href={tournament.youtubeLiveUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                Live Stream
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Award Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Award Categories</h4>
          <button onClick={awardParticipationToAll}
            className="flex items-center gap-1.5 text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-3 py-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors">
            <Plus className="w-3 h-3" /> Participation to All
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {VEX_AWARDS.map(award => {
            const count = getAwardCount(award.key);
            const isSelected = selectedAward === award.key;
            return (
              <button key={award.key} onClick={() => setSelectedAward(isSelected ? null : award.key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg ${award.bg} flex items-center justify-center mb-1.5`}>
                  <award.icon className={`w-3.5 h-3.5 ${award.color}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-900 leading-tight">{award.label}</p>
                <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">{award.desc}</p>
                {count > 0 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-red/5 text-brand-red rounded text-[8px] font-bold">
                    {count} team{count > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Award Assignment Matrix */}
      {selectedAward && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const a = VEX_AWARDS.find(aw => aw.key === selectedAward);
                return a ? <><div className={`w-6 h-6 rounded-lg ${a.bg} flex items-center justify-center`}><a.icon className={`w-3 h-3 ${a.color}`} /></div><span className="text-sm font-bold text-slate-900">{a.label}</span></> : null;
              })()}
            </div>
            <div className="flex items-center gap-2">
              {selectedAward === 'participation' && (
                <button onClick={awardParticipationToAll}
                  className="text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-2.5 py-1 rounded-lg hover:bg-brand-blue/10">
                  Select All
                </button>
              )}
              {selectedAward === 'champions' && (
                <button onClick={() => {
                  teamAwards.forEach(ta => {
                    if (topRankedTeams.includes(ta.teamName)) {
                      toggleAward(ta.teamId, 'champions');
                    }
                  });
                }}
                  className="text-[10px] font-bold text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-lg hover:bg-brand-red/10">
                  Auto-assign Top 3
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {teamAwards.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No teams found for this tournament</p>
              </div>
            )}
            {teamAwards.map(ta => {
              const status = ta.awards[selectedAward] || 'none';
              const s = awardColors[status];
              const team = teams.find(t => t.id === ta.teamId);
              const student = team ? findStudentForTeam(team) : null;
              const isTop3 = topRankedTeams.includes(ta.teamName);
              return (
                <div key={ta.teamId}
                  className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                    status !== 'none' ? s.bg : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {status === 'none' ? (
                      <button onClick={() => toggleAward(ta.teamId, selectedAward)}
                        className="w-5 h-5 rounded border-2 border-slate-300 hover:border-brand-red transition-colors flex items-center justify-center">
                      </button>
                    ) : (
                      <button onClick={() => toggleAward(ta.teamId, selectedAward)}
                        className={`w-5 h-5 rounded flex items-center justify-center ${s.border} ${status === 'issued' ? 'bg-emerald-500 border-emerald-500' : 'bg-amber-400 border-amber-400'}`}>
                        <Check className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{ta.teamName}</span>
                        {isTop3 && <Trophy className="w-3 h-3 text-amber-500 shrink-0" />}
                      </div>
                      {student && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {student.name}{student.studentId ? ` · ${student.email}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!student?.studentId && (
                      <span className="text-[8px] text-amber-500 font-medium bg-amber-50 px-1.5 py-0.5 rounded" title="No student account linked">No student</span>
                    )}
                    {status === 'issued' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {status === 'pending' && <span className="text-[9px] font-bold text-amber-600">Pending</span>}
                    <button onClick={() => { setSelectedTeam(ta.teamId); setShowPreview(true); }}
                      className="text-[10px] font-medium text-slate-400 hover:text-brand-red px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Issue Actions */}
      {isStaff && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{teamAwards.filter(ta => Object.keys(ta.awards).some(k => ta.awards[k] === 'pending')).length}</strong> pending certificates
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!certTemplates.length && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium">
                  Create a certificate template first
                </span>
              )}
              <button onClick={issueCertificates}
                disabled={issuing || !teamAwards.some(ta => Object.keys(ta.awards).some(k => ta.awards[k] === 'pending'))}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-xs font-extrabold hover:bg-brand-red-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldIcon className="w-4 h-4" />}
                {issuing ? 'Issuing...' : `Issue Pending (${teamAwards.filter(ta => Object.keys(ta.awards).some(k => ta.awards[k] === 'pending')).length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Log */}
      {issueLog.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Issue Log</h4>
            <button onClick={() => setIssueLog([])} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {issueLog.map((log, i) => (
              <div key={i} className={`text-[11px] font-medium ${log.startsWith('✓') ? 'text-emerald-600' : log.startsWith('⚠') ? 'text-amber-600' : 'text-red-600'}`}>
                {log}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Certificates Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">All Teams & Award Status</h4>
        {teamAwards.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No teams loaded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-3 font-bold text-slate-500">Team</th>
                  <th className="text-left py-2 pr-3 font-bold text-slate-500">Student</th>
                  {VEX_AWARDS.filter(a => a.key !== 'participation').slice(0, 5).map(a => (
                    <th key={a.key} className="text-center py-2 px-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">{a.label}</th>
                  ))}
                  <th className="text-center py-2 pl-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamAwards.map(ta => {
                  const team = teams.find(t => t.id === ta.teamId);
                  const student = team ? findStudentForTeam(team) : null;
                  const mainAwards = VEX_AWARDS.filter(a => a.key !== 'participation').slice(0, 5);
                  const restAwards = VEX_AWARDS.filter(a => a.key !== 'participation').slice(5);
                  const restCount = restAwards.filter(a => ta.awards[a.key]).length;
                  return (
                    <tr key={ta.teamId} className="hover:bg-slate-50">
                      <td className="py-2 pr-3">
                        <span className="font-bold text-slate-900">{ta.teamName}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-slate-400 text-[10px]">{student?.name || '—'}</span>
                      </td>
                      {mainAwards.map(a => {
                        const status = ta.awards[a.key];
                        return (
                          <td key={a.key} className="text-center py-2 px-1">
                            {status === 'issued' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                            ) : status === 'pending' ? (
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                            ) : (
                              <span className="text-slate-200">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 pl-1">
                        {restCount > 0 ? (
                          <span className="text-[10px] font-bold text-brand-blue">+{restCount}</span>
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && previewTeam && previewAward && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPreview(false)}
        >
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Certificate Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {/* Certificate Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#002f87] rounded-2xl p-8 text-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
                }} />
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-1 h-1 bg-amber-400 rounded-full" />
                    <p className="font-mono text-[9px] text-amber-300 uppercase tracking-[0.3em] font-bold">Certificate of Achievement</p>
                    <div className="w-1 h-1 bg-amber-400 rounded-full" />
                  </div>
                  <h2 className="font-black text-2xl text-white mb-1 tracking-tight">ETHIO ROBOTICS</h2>
                  <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
                  <p className="text-slate-400 text-[11px] mb-2">This award is presented to</p>
                  <p className="font-black text-xl text-white mb-1">{previewTeam.teamName}</p>
                  <p className="text-slate-400 text-[10px] mb-4">
                    {previewStudent?.name || previewTeam.teamName}
                    {previewStudent?.name && previewStudent?.name !== previewTeam.teamName ? ` · ${previewTeam.teamName}` : ''}
                  </p>
                  <p className="text-slate-400 text-[11px] mb-2">For outstanding achievement in</p>
                  <p className="font-black text-lg text-[#57dffe]">{previewAward.label}</p>
                  <p className="text-slate-500 text-[9px] mt-4">{tournament.title} · {new Date().toLocaleDateString()}</p>
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <ShieldIcon className="w-3.5 h-3.5 text-slate-500" />
                    <p className="font-mono text-[9px] text-slate-500">CERT-{tournamentId.slice(0, 4)}-{new Date().getFullYear()}-{(standings.findIndex(s => s.teamName === previewTeam.teamName) + 1).toString().padStart(4, '0')}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      <QrCode className="w-3 h-3" />QR
                    </button>
                    <button className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      <ExternalLink className="w-3 h-3" />Share
                    </button>
                    <button className="flex items-center gap-1.5 text-[9px] font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <Download className="w-3 h-3" />PDF
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                <span>Status: {previewTeam.awards[selectedAward] === 'issued' ? '✓ Issued' : previewTeam.awards[selectedAward] === 'pending' ? '○ Pending' : '○ Not assigned'}</span>
                {previewStudent?.studentId ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Student linked
                  </span>
                ) : (
                  <span className="text-amber-500 font-medium">No student account</span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
