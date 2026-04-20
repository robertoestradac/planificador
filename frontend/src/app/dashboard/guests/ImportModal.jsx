'use client';
import { useState } from 'react';
import { X, Upload, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { parseCsv, mapCsvRow } from './utils';

const SAMPLE_CSV =
  'nombre,email,telefono,pases,grupo,restricciones,notas\r\n' +
  'Juan Pérez,juan@email.com,+502 1234 5678,2,Familia novia,Sin gluten,\r\n' +
  'María López,maria@email.com,+502 9876 5432,1,Amigos,,\r\n';

export default function ImportModal({ open, onClose, invitationId, onImported }) {
  const [parsed, setParsed]     = useState(null);      // { headers, rows, mapped }
  const [skipDup, setSkipDup]   = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  if (!open) return null;

  const handleFile = async (file) => {
    if (!file) return;
    setError(null); setResult(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const mapped = rows.map(mapCsvRow).filter(r => r.name && r.name.length >= 2);
      if (!mapped.length) {
        setError('No se encontraron filas válidas. El CSV debe tener al menos una columna "nombre".');
        return;
      }
      setParsed({ headers, rows, mapped });
    } catch (err) {
      setError('No se pudo leer el archivo CSV');
    }
  };

  const downloadSample = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'plantilla-invitados.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async () => {
    if (!parsed) return;
    setImporting(true); setError(null);
    try {
      const { data } = await api.post('/guests/bulk', {
        invitation_id: invitationId,
        guests: parsed.mapped,
        skip_duplicates: skipDup,
      });
      setResult(data.data);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const close = () => {
    setParsed(null); setResult(null); setError(null);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" /> Importar invitados desde CSV
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!parsed && !result && (
            <>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Sube un archivo <strong>.csv</strong> con los invitados. Columnas aceptadas:</p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded border">
                  nombre, email, telefono, pases, grupo, restricciones, notas
                </p>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={downloadSample}>
                <Download className="w-4 h-4 mr-2" /> Descargar plantilla de ejemplo
              </Button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => handleFile(e.target.files?.[0])}
                  className="hidden"
                  id="csv-input"
                />
                <label htmlFor="csv-input" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Click para seleccionar un archivo CSV</p>
                </label>
              </div>
            </>
          )}

          {parsed && !result && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Se detectaron <strong>{parsed.mapped.length}</strong> invitados válidos
                  {parsed.rows.length !== parsed.mapped.length &&
                    <span className="text-orange-600"> ({parsed.rows.length - parsed.mapped.length} filas inválidas descartadas)</span>}
                </p>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setParsed(null)}
                >Cambiar archivo</button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Nombre</th>
                      <th className="px-2 py-2 text-left">Email</th>
                      <th className="px-2 py-2 text-left">Teléfono</th>
                      <th className="px-2 py-2 text-left">Pases</th>
                      <th className="px-2 py-2 text-left">Grupo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsed.mapped.slice(0, 8).map((g, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">{g.name}</td>
                        <td className="px-2 py-1.5 text-gray-500">{g.email || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{g.phone || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{g.party_size ?? 1}</td>
                        <td className="px-2 py-1.5 text-gray-500">{g.group_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.mapped.length > 8 && (
                  <p className="text-xs text-gray-500 p-2 bg-gray-50 border-t">
                    ... y {parsed.mapped.length - 8} más
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={skipDup}
                  onChange={e => setSkipDup(e.target.checked)} />
                Omitir duplicados (mismo email o teléfono en esta invitación)
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={close}>Cancelar</Button>
                <Button onClick={doImport} disabled={importing}>
                  {importing ? 'Importando...' : `Importar ${parsed.mapped.length} invitados`}
                </Button>
              </div>
            </>
          )}

          {result && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">¡Importación completada!</h3>
              <div className="text-sm space-y-1">
                <p><strong className="text-green-600">{result.created}</strong> invitados agregados</p>
                {result.skipped > 0 && (
                  <p className="text-orange-600">
                    <strong>{result.skipped}</strong> omitidos por duplicados
                  </p>
                )}
              </div>
              <Button onClick={close}>Cerrar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
