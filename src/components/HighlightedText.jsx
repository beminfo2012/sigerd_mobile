import React from 'react';
import { getSearchTokens } from '../services/globalSearchService';

/**
 * Componente para destacar trechos de texto pesquisados (suporta códigos e variações de zeros à esquerda)
 */
export const HighlightedText = ({ text = '', query = '' }) => {
    if (!text || typeof text !== 'string') return <span>{text || ''}</span>;
    if (!query || !query.trim()) return <span>{text}</span>;

    const tokens = getSearchTokens(query);
    if (tokens.length === 0) return <span>{text}</span>;

    // Ordenar os tokens pelo comprimento decrescente (tokens maiores como "005/2026" primeiro que "5")
    const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
    const escapedTokens = sortedTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    try {
        const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, index) => {
                    const isMatch = sortedTokens.some(token => part.toLowerCase() === token.toLowerCase());
                    return isMatch ? (
                        <mark 
                            key={index} 
                            className="bg-amber-200 text-amber-950 font-extrabold px-1 py-0.5 rounded border-b-2 border-amber-400 inline-block my-0.5 shadow-xs"
                        >
                            {part}
                        </mark>
                    ) : (
                        <React.Fragment key={index}>{part}</React.Fragment>
                    );
                })}
            </span>
        );
    } catch (e) {
        return <span>{text}</span>;
    }
};

export default HighlightedText;
