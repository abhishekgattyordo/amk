import React, { useState, useEffect } from 'react';
import { History, ArrowLeft, Loader2, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { AuditLog } from '../../types';
import { UserAvatar } from './UserAvatar';

// Helper component for expanded row (parses concatenated fields)
const AuditLogDetails = ({ log, darkMode }: { log: AuditLog; darkMode: boolean }) => {
  const fields = log.fieldName?.split(', ') || [];
  const oldValues = log.oldValue?.split('; ') || [];
  const newValues = log.newValue?.split('; ') || [];

  if (fields.length === 0) return null;

  return (
    <div
      className={`p-3 rounded-lg border ${
        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-slate-400 border-b border-slate-300 dark:border-slate-600">
            <th className="py-1 text-left border-r border-slate-300 dark:border-slate-600 px-2">Field</th>
            <th className="py-1 text-left border-r border-slate-300 dark:border-slate-600 px-2">Old Value</th>
            <th className="py-1 text-left px-2">New Value</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr
              key={index}
              className="border-b border-slate-200 dark:border-slate-700 last:border-0"
            >
              <td className="py-1 font-medium border-r border-slate-300 dark:border-slate-600 px-2">
                {field.replace(`${field.split(':')[0]}:`, '').trim()}
              </td>
              <td className="py-1 text-rose-500 border-r border-slate-300 dark:border-slate-600 px-2">
                {oldValues[index] || '-'}
              </td>
              <td className="py-1 text-emerald-500 font-medium px-2">
                {newValues[index] || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ChangeHistoryPageProps {
  entity: string;
  entityId: string;
  entityName?: string;
  onBack: () => void;
  darkMode: boolean;
}

export const ChangeHistoryPage: React.FC<ChangeHistoryPageProps> = ({
  entity,
  entityId,
  entityName,
  onBack,
  darkMode,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/audit-logs?entity=${entity}&entityId=${entityId}`
        );
        const data = await response.json();
        if (data.success) {
          setLogs(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [entity, entityId]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (log.user?.toLowerCase() || '').includes(term) ||
      (log.action?.toLowerCase() || '').includes(term) ||
      (log.fieldName?.toLowerCase() || '').includes(term) ||
      (log.oldValue?.toLowerCase() || '').includes(term) ||
      (log.newValue?.toLowerCase() || '').includes(term) ||
      (log.details?.toLowerCase() || '').includes(term)
    );
  });

  const clearSearch = () => setSearchTerm('');

  const displayName =
    entityName && entityName.trim() !== '' && entityName !== 'undefined - undefined'
      ? entityName
      : `ID: ${entityId.slice(0, 8)}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
            className={`text-2xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Change History: {entity.replace(/([A-Z])/g, ' $1').trim()} — {displayName}
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-8 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode
            ? 'bg-slate-900/85 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-4" />
            <p className="text-sm text-slate-400">Loading audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold">
              {searchTerm ? 'No matching records found' : 'No Change History Found'}
            </p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="mt-2 text-xs text-emerald-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-600">
              <thead>
                <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 border border-slate-300 dark:border-slate-600">
                    Updated By
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 border border-slate-300 dark:border-slate-600">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 border border-slate-300 dark:border-slate-600">
                    Action / Field
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 border border-slate-300 dark:border-slate-600">
                    Old Value
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 border border-slate-300 dark:border-slate-600">
                    New Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 border border-slate-300 dark:border-slate-600">
                      <div className="flex items-center space-x-2">
                        <UserAvatar name={log.user || 'Unknown'} size="xs" />
                        <span className="text-xs font-bold">{log.user || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap border border-slate-300 dark:border-slate-600">
                      <div className="text-xs">
                        {new Date(log.timestamp).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 dark:border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1 ${
                              log.action === 'Create'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span
                            className="text-xs font-mono text-slate-400 max-w-[150px] truncate"
                            title={log.fieldName || ''}
                          >
                            {log.fieldName || '-'}
                          </span>
                        </div>
                        {log.fieldName?.includes(', ') && (
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          >
                            {expandedRows[log.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      {expandedRows[log.id] && (
                        <div className="mt-2">
                          <AuditLogDetails log={log} darkMode={darkMode} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-slate-300 dark:border-slate-600">
                      <div
                        className="text-xs text-rose-500 font-medium truncate max-w-[150px]"
                        title={log.oldValue || ''}
                      >
                        {log.oldValue || (log.action === 'Create' ? '-' : 'N/A')}
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-slate-300 dark:border-slate-600">
                      <div
                        className="text-xs text-emerald-500 font-bold truncate max-w-[150px]"
                        title={log.newValue || ''}
                      >
                        {log.newValue || (log.action === 'Create' ? 'Created' : 'N/A')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
