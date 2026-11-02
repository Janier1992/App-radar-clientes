import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Share2, ShieldCheck, Upload, AlertTriangle } from 'lucide-react';
import {
  AppData,
  BackupFile,
  BackupSummary,
  RestoreMode,
  buildBackup,
  canShareBackup,
  downloadBackup,
  getLastBackupAt,
  isStoragePersisted,
  parseBackup,
  shareBackup,
} from '../../services/backup';

interface Props {
  data: AppData;
  onRestore: (backup: BackupFile, mode: RestoreMode) => void;
}

const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null);

/** Copia de seguridad, restauración y traslado de datos entre dispositivos. */
export const BackupCard: React.FC<Props> = ({ data, onRestore }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackupAt());
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [pending, setPending] = useState<{ backup: BackupFile; summary: BackupSummary; name: string } | null>(null);
  const [mode, setMode] = useState<RestoreMode>('merge');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    isStoragePersisted().then(setPersisted);
  }, []);

  const days = daysSince(lastBackup);
  const stale = days === null || days >= 7;
  const total = data.leads.length + data.tracked.length;

  const handleExport = () => {
    downloadBackup(buildBackup(data));
    setLastBackup(getLastBackupAt());
    setMessage({ tone: 'ok', text: 'Copia descargada. Guárdala en un lugar privado: contiene tus datos de prospección.' });
  };

  const handleShare = async () => {
    try {
      const result = await shareBackup(buildBackup(data));
      if (result === 'shared') {
        setLastBackup(getLastBackupAt());
        setMessage({ tone: 'ok', text: 'Copia enviada. En el otro dispositivo, usa «Restaurar copia» con ese archivo.' });
      }
    } catch (err) {
      console.warn('No se pudo compartir la copia:', err);
      setMessage({ tone: 'error', text: 'No se pudo abrir la hoja de compartir. Usa «Descargar copia» y envíala tú.' });
    }
  };

  const handleFile = async (file: File | undefined) => {
    setMessage(null);
    setPending(null);
    setConfirmReplace(false);
    if (!file) return;
    const parsed = parseBackup(await file.text(), file.size);
    if (!parsed.ok) {
      setMessage({ tone: 'error', text: parsed.error });
    } else {
      setPending({ backup: parsed.backup, summary: parsed.summary, name: file.name });
      setMode('merge');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRestore = () => {
    if (!pending) return;
    if (mode === 'replace' && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onRestore(pending.backup, mode);
    setMessage({
      tone: 'ok',
      text:
        mode === 'merge'
          ? 'Copia combinada con tus datos actuales. Si un registro estaba en los dos lugares, se conservó el más reciente.'
          : 'Copia restaurada: ahora la app tiene exactamente los datos del archivo.',
    });
    setPending(null);
    setConfirmReplace(false);
  };

  const btn = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-colors';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <Download className="w-4 h-4 text-emerald-400" />
        Copia de Seguridad y Datos Locales
      </h3>

      <div className={`rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 ${stale && total > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
        {stale && total > 0 ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" /> : <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />}
        <div>
          <p className="font-semibold">
            {days === null ? 'Aún no has descargado ninguna copia.' : days === 0 ? 'Última copia: hoy.' : `Última copia: hace ${days} ${days === 1 ? 'día' : 'días'}.`}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            Hoy guardas {data.leads.length} leads, {data.tracked.length} negocios en el historial y {data.searches.length} búsquedas. Todo vive solo en este navegador.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleExport} className={`${btn} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200`}>
          <Download className="w-3.5 h-3.5 text-emerald-400" /> Descargar copia
        </button>
        {canShareBackup() && (
          <button type="button" onClick={handleShare} className={`${btn} bg-sky-600/15 hover:bg-sky-600/25 border-sky-500/30 text-sky-200`}>
            <Share2 className="w-3.5 h-3.5" /> Enviar a otro dispositivo
          </button>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200`}>
          <Upload className="w-3.5 h-3.5 text-emerald-400" /> Restaurar copia
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} aria-label="Elegir archivo de copia de seguridad" />
      </div>

      {pending && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 text-xs">
          <p className="font-semibold text-slate-100 break-all">
            {pending.name}
            {pending.summary.exportedAt ? ` · del ${new Date(pending.summary.exportedAt).toLocaleDateString('es-CO')}` : ''}
          </p>
          <p className="text-slate-300">
            Trae {pending.summary.leads} leads, {pending.summary.businesses} negocios en el historial, {pending.summary.searches} búsquedas
            {pending.summary.blocked ? `, ${pending.summary.blocked} en «no contactar»` : ''}
            {pending.summary.hasSettings ? ' y tus ajustes' : ''}.
            {pending.summary.skipped > 0 && <span className="text-amber-300"> Se ignoraron {pending.summary.skipped} registros dañados.</span>}
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="restore-mode" checked={mode === 'merge'} onChange={() => { setMode('merge'); setConfirmReplace(false); }} className="mt-0.5" />
              <span>
                <strong className="text-slate-100">Combinar con lo que ya tengo</strong> (recomendado)
                <span className="block text-slate-400">Suma lo nuevo y, si un negocio está en los dos, conserva el más reciente. No borra nada.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="restore-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} className="mt-0.5" />
              <span>
                <strong className="text-slate-100">Reemplazar todo</strong>
                <span className="block text-slate-400">Deja la app exactamente como la copia. Lo que tienes ahora y no está en el archivo se pierde.</span>
              </span>
            </label>
          </div>
          {confirmReplace && (
            <p className="text-rose-300 font-semibold">¿Seguro? Se perderán los datos actuales que no estén en la copia. Pulsa de nuevo para confirmar.</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleRestore} className={`${btn} ${mode === 'replace' ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'}`}>
              {mode === 'replace' ? (confirmReplace ? 'Sí, reemplazar' : 'Reemplazar') : 'Restaurar'}
            </button>
            <button type="button" onClick={() => { setPending(null); setConfirmReplace(false); }} className={`${btn} bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300`}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className={`text-xs flex items-start gap-1.5 ${message.tone === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
          {message.tone === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          {message.text}
        </p>
      )}

      <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4">
        <li>La copia incluye leads, historial, búsquedas, lista de «no contactar», perfil y plantillas. <strong className="text-slate-400">No incluye la clave de Google</strong> que escribas en Ajustes.</li>
        <li>Para pasar tus datos de celular a computador (o al revés): descarga o envía la copia y usa «Restaurar copia» en el otro dispositivo.</li>
        <li>
          Almacenamiento protegido del navegador:{' '}
          {persisted === null ? 'no disponible' : persisted ? 'activo (el navegador no debería borrar tus datos por falta de espacio)' : 'no concedido (instalar la app ayuda a obtenerlo)'}.
        </li>
      </ul>
    </div>
  );
};
