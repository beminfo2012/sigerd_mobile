import React from 'react';

export function BILinkFooter({ modulo, contexto = {} }) {
  const params = new URLSearchParams({
    modulo,
    ...contexto,
  });

  return (
    <div className="flex justify-end pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
      <a
        href={`/bi?${params.toString()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold tracking-wide uppercase
                   text-blue-500/70 hover:text-blue-700 dark:text-blue-400/70 dark:hover:text-blue-300 hover:underline
                   transition-colors inline-flex items-center gap-1"
        title={`Abrir análise detalhada de BI para ${modulo}`}
      >
        BI
      </a>
    </div>
  );
}

export default BILinkFooter;
