import React, { useMemo, useState } from 'react';
import { Clock3, Info } from 'lucide-react';
import { TrackedBusiness } from '../../types';
import { BucketStat, RANGE_LABELS, RangeKey, computeSummary } from '../../services/outreachStats';

const MIN_SAMPLE = 5; // por debajo de esto las tasas son ruido

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)} %`);

const Kpi: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
    {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
  </div>
);

const BucketTable: React.FC<{ title: string; rows: BucketStat[] }> = ({ title, rows }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
    <h4 className="text-xs font-bold text-slate-100">{title}</h4>
    {rows.length === 0 ? (
      <p className="text-[11px] text-slate-500">Aún no hay mensajes en este periodo.</p>
    ) : (
      <ul className="space-y-2.5">
        {rows.map((r) => {
          const rate = r.contacted > 0 ? r.responded / r.contacted : 0;
          return (
            <li key={r.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-slate-200 font-medium truncate">{r.label}</span>
                <span className="text-slate-400 shrink-0">
                  {r.responded}/{r.contacted} · <strong className="text-slate-200">{pct(rate)}</strong>
                  {r.contacted < MIN_SAMPLE && <span className="text-slate-600"> (pocos datos)</span>}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round(rate * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

/** Resumen de prospección calculado solo con el historial guardado en este navegador. */
export const WeeklySummary: React.FC<{ tracked: TrackedBusiness[] }> = ({ tracked }) => {
  const [range, setRange] = useState<RangeKey>('7d');
  const data = useMemo(() => computeSummary(tracked, range, new Date()), [tracked, range]);
  const bestRubro = data.byRubro.find((r) => r.contacted >= MIN_SAMPLE && r.responded > 0 && r.key !== 'general');
  const top = bestRubro
    ? [...data.byRubro].filter((r) => r.contacted >= MIN_SAMPLE).sort((a, b) => b.responded / b.contacted - a.responded / a.contacted)[0]
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Resumen de prospección</h3>
          <p className="text-[11px] text-slate-500">Qué contactaste, quién respondió y qué mensajes funcionan mejor.</p>
        </div>
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs" role="tablist" aria-label="Periodo">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={range === key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-md cursor-pointer ${range === key ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Mensajes enviados" value={data.messages} hint="Primer contacto y seguimientos" />
        <Kpi label="Negocios contactados" value={data.contacted} />
        <Kpi
          label="Respondieron"
          value={data.responded}
          hint={data.rate === null ? 'Aún sin datos' : `${pct(data.rate)} de los contactados`}
        />
        <Kpi label="Demos y cierres" value={`${data.demos} · ${data.closes}`} hint="Reunión · Cliente" />
      </div>

      {data.contacted < MIN_SAMPLE && (
        <p className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Con menos de {MIN_SAMPLE} negocios contactados las comparaciones no son confiables: tómalas como una pista, no como una conclusión.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BucketTable title="Respuesta por rubro" rows={data.byRubro} />
        <BucketTable title="Respuesta por tono del mensaje" rows={data.byTone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-100">¿Qué mensaje provocó la respuesta?</h4>
          {data.byStep.length === 0 ? (
            <p className="text-[11px] text-slate-500">Todavía no has marcado respuestas en este periodo («El negocio respondió»).</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {data.byStep.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <span className="text-slate-200">{s.label}</span>
                  <span className="text-slate-400">{s.responses} {s.responses === 1 ? 'respuesta' : 'respuestas'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-emerald-400" />
            Lo que dicen tus datos
          </h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            {data.bestWindow ? (
              <li>
                Las respuestas llegan sobre todo a mensajes enviados en la franja <strong>{data.bestWindow.label}</strong> ({data.bestWindow.count} de {data.responsesTotal}).
              </li>
            ) : (
              <li className="text-slate-500">La mejor franja horaria aparecerá cuando tengas al menos {MIN_SAMPLE} respuestas registradas.</li>
            )}
            {top ? (
              <li>
                El rubro con mejor respuesta es <strong>{top.label}</strong> ({pct(top.responded / top.contacted)} de {top.contacted} contactados).
              </li>
            ) : (
              <li className="text-slate-500">El mejor rubro aparecerá cuando alguno tenga al menos {MIN_SAMPLE} negocios contactados.</li>
            )}
            {data.blocked > 0 && <li>{data.blocked} {data.blocked === 1 ? 'negocio pidió' : 'negocios pidieron'} no ser contactados en este periodo.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
