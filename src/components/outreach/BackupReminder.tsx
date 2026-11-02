import React, { useState } from 'react';
import { DatabaseBackup, X } from 'lucide-react';
import { AppData, backupStatus, buildBackup, downloadBackup, snoozeBackupReminder } from '../../services/backup';

/** Aviso semanal para descargar una copia: los datos viven solo en este navegador. */
export const BackupReminder: React.FC<{ data: AppData; onOpenSettings: () => void }> = ({ data, onOpenSettings }) => {
  const [, force] = useState(0);
  const hasData = data.leads.length > 0 || data.tracked.length > 0;
  const status = backupStatus(hasData);
  if (!status.due) return null;

  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
      <DatabaseBackup className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1 space-y-2">
        <p>
          <strong>
            {status.never ? 'Aún no has descargado ninguna copia de seguridad.' : `Hace ${status.days} días que no descargas una copia de seguridad.`}
          </strong>{' '}
          Tus leads, historial y ajustes viven solo en este navegador y se perderían si borras los datos del navegador o cambias de equipo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              downloadBackup(buildBackup(data));
              force((n) => n + 1);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer"
          >
            Descargar copia ahora
          </button>
          <button
            type="button"
            onClick={() => {
              snoozeBackupReminder(2);
              force((n) => n + 1);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-amber-500/30 text-amber-100 font-semibold cursor-pointer"
          >
            Recordármelo en 2 días
          </button>
          <button type="button" onClick={onOpenSettings} className="px-3 py-1.5 rounded-lg text-amber-200 hover:text-white font-semibold cursor-pointer underline-offset-2 hover:underline">
            Ir a Ajustes
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          snoozeBackupReminder(2);
          force((n) => n + 1);
        }}
        aria-label="Cerrar aviso"
        className="p-1 -mr-1 -mt-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-500/20 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
