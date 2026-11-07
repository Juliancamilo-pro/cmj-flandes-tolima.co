/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PublicPoll } from '../../types';
import { Vote, CheckCircle, BarChart3, Clock, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export const EncuestasView: React.FC = () => {
  const [polls, setPolls] = useState<PublicPoll[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: string }>({});
  const [votedPolls, setVotedPolls] = useState<{ [pollId: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Anti-bot challenge state per poll
  const [pollCaptcha, setPollCaptcha] = useState<{ [pollId: string]: { n1: number; n2: number; answer: string; error?: string } }>({});

  useEffect(() => {
    api.getPolls().then((data) => {
      setPolls(data);
      // Initialize challenges
      const captchas: any = {};
      data.forEach((p) => {
        captchas[p.id] = {
          n1: Math.floor(Math.random() * 5) + 2,
          n2: Math.floor(Math.random() * 4) + 1,
          answer: '',
        };
      });
      setPollCaptcha(captchas);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refreshPollCaptcha = (pollId: string) => {
    setPollCaptcha((prev) => ({
      ...prev,
      [pollId]: {
        n1: Math.floor(Math.random() * 6) + 2,
        n2: Math.floor(Math.random() * 5) + 1,
        answer: '',
      },
    }));
  };

  const handleVote = async (pollId: string) => {
    const optId = selectedOptions[pollId];
    if (!optId) return;

    const captcha = pollCaptcha[pollId];
    if (captcha) {
      const expected = captcha.n1 + captcha.n2;
      if (parseInt(captcha.answer.trim(), 10) !== expected) {
        setPollCaptcha((prev) => ({
          ...prev,
          [pollId]: {
            ...prev[pollId],
            error: `Verificación anti-bot incorrecta. Calcule: ${captcha.n1} + ${captcha.n2}`,
          },
        }));
        return;
      }
    }

    try {
      const res = await api.votePoll(pollId, optId);
      setPolls(prev => prev.map(p => (p.id === pollId ? res.poll : p)));
      setVotedPolls(prev => ({ ...prev, [pollId]: true }));
    } catch (err: any) {
      alert(err.message || 'Error al registrar voto');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="text-xs uppercase tracking-widest text-red-900 dark:text-red-400 font-bold font-sans">
          Mecanismo de Consulta Ciudadana
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white [text-wrap:balance]">
          Encuestas Públicas y Estadísticas Juveniles
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed font-sans">
          Participa con tu voto en los diagnósticos y consultas sobre inversión juvenil, prioridades territoriales y programas sociales en Flandes.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Cargando consultas públicas...</div>
      ) : polls.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-sm text-stone-500">
          No hay encuestas activas en este momento.
        </div>
      ) : (
        <div className="space-y-8">
          {polls.map(poll => {
            const captcha = pollCaptcha[poll.id] || { n1: 3, n2: 4, answer: '' };
            const hasVoted = votedPolls[poll.id];

            return (
              <div
                key={poll.id}
                className="p-6 sm:p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-6"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    {poll.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cierra: {poll.closesAt}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-white mb-2">
                    {poll.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {poll.description}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3 pt-2">
                  {poll.options.map(opt => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    const isSelected = selectedOptions[poll.id] === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => !hasVoted && setSelectedOptions(prev => ({ ...prev, [poll.id]: opt.id }))}
                        className={`p-4 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-900 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 font-semibold'
                            : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              checked={isSelected}
                              onChange={() => setSelectedOptions(prev => ({ ...prev, [poll.id]: opt.id }))}
                              disabled={hasVoted}
                              className="text-red-900 focus:ring-red-900"
                            />
                            <span className="text-stone-800 dark:text-stone-200">{opt.text}</span>
                          </div>
                          <span className="font-mono font-semibold tabular-nums text-stone-600 dark:text-stone-400 shrink-0">
                            {pct}% ({opt.votes} votos)
                          </span>
                        </div>

                        <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-900 dark:bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Anti-Bot validation error */}
                {captcha.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{captcha.error}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs text-stone-500 tabular-nums">
                    Total de votos válidos: <strong>{poll.totalVotes}</strong>
                  </span>

                  {hasVoted ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>¡Voto ciudadano registrado exitosamente!</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Anti-bot mini challenge */}
                      <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-900 dark:text-red-400 shrink-0" />
                        <span className="font-medium whitespace-nowrap">{captcha.n1} + {captcha.n2} =</span>
                        <input
                          type="number"
                          placeholder="?"
                          value={captcha.answer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPollCaptcha((prev) => ({
                              ...prev,
                              [poll.id]: { ...prev[poll.id], answer: val, error: undefined },
                            }));
                          }}
                          className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => refreshPollCaptcha(poll.id)}
                          className="text-stone-400 hover:text-stone-600 ml-0.5"
                          title="Cambiar números"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleVote(poll.id)}
                        disabled={!selectedOptions[poll.id] || !captcha.answer}
                        className="px-5 py-2 text-xs font-semibold text-white bg-red-900 hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        Votar Ahora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
