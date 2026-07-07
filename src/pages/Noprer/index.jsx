import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TelaLista from './TelaLista';
import TelaDetalhe from './TelaDetalhe';
import TelaSucesso from './TelaSucesso';
import NoprerForm from './NoprerForm';

const NoprerModule = () => {
    return (
        <Routes>
            <Route path="/" element={<TelaLista />} />
            <Route path="/detalhes/:id" element={<TelaDetalhe />} />
            <Route path="/novo" element={<NoprerForm />} />
            <Route path="/novo/:origem/:origemId" element={<NoprerForm />} />
            <Route path="/sucesso" element={<TelaSucesso />} />
        </Routes>
    );
};

export default NoprerModule;
