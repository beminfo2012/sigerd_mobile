import React, { useState, useEffect } from 'react';

export const CurrencyInput = ({ value, onChange, disabled, className, placeholder }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value === 0 || value === '0') {
            setDisplayValue('');
        } else if (value) {
            setDisplayValue(formatCurrency(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
        const numberValue = parseInt(rawValue) / 100; // Convert to decimal

        if (isNaN(numberValue)) {
            onChange(0);
            setDisplayValue('');
        } else {
            onChange(numberValue);
            // We rely on useEffect to update displayValue to keep sync or update immediately for responsiveness
            // But formatting while typing R$ 10,00 needs care.
            // Simple approach: Input is "text", we parse digits.
        }
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            className={className}
            placeholder={placeholder || "R$ 0,00"}
            value={displayValue}
            onChange={handleChange}
            onFocus={(e) => {
                if (value === 0) setDisplayValue('');
            }}
            onBlur={() => {
                if (value) setDisplayValue(formatCurrency(value));
            }}
        />
    );
};

export const NumberInput = ({ value, onChange, disabled, className, placeholder }) => {
    const handleChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            onChange(0);
        } else {
            onChange(parseInt(val) || 0);
        }
    };

    return (
        <input
            type="number"
            inputMode="numeric"
            disabled={disabled}
            className={className}
            placeholder={placeholder}
            value={value === 0 ? '' : value}
            onChange={handleChange}
        />
    );
};

export const DecimalInput = ({ value, onChange, disabled, className, placeholder }) => {
    const [displayValue, setDisplayValue] = useState('');

    const formatDecimal = (val) => {
        if (val === undefined || val === null || val === '') return '0,00';
        const parsed = parseFloat(val);
        if (isNaN(parsed)) return '0,00';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(parsed);
    };

    useEffect(() => {
        if (value === 0 || value === '0' || value === '') {
            setDisplayValue('0,00');
        } else if (value !== undefined && value !== null) {
            setDisplayValue(formatDecimal(value));
        } else {
            setDisplayValue('0,00');
        }
    }, [value]);

    const handleChange = (e) => {
        let rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Remove leading zeros
        rawValue = rawValue.replace(/^0+/, '');

        if (rawValue === '') {
            onChange(0);
            setDisplayValue('0,00');
            return;
        }

        // Pad with zeros to ensure at least 3 digits for proper conversion
        if (rawValue.length < 3) {
            rawValue = rawValue.padStart(3, '0');
        }

        const numberValue = parseInt(rawValue, 10) / 100; // Convert to decimal

        if (isNaN(numberValue)) {
            onChange(0);
            setDisplayValue('0,00');
        } else {
            onChange(numberValue);
            setDisplayValue(formatDecimal(numberValue));
        }
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            className={className}
            placeholder={placeholder || "0,00"}
            value={displayValue}
            onChange={handleChange}
            onBlur={() => {
                setDisplayValue(formatDecimal(value));
            }}
        />
    );
};
