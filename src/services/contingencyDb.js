import { initDB } from './db'
import { supabase } from './supabase'

export const contingencyDb = {
    async getActivePlan() {
        const db = await initDB()

        if (navigator.onLine) {
            try {
                const { data, error } = await supabase
                    .from('planos_contingencia')
                    .select('*, sco_estrutura(*)')
                    .eq('status', 'Ativo')
                    .maybeSingle()
                
                if (!error) {
                    if (data) {
                        await db.put('planos_contingencia', data)
                        return data
                    } else {
                        const all = await db.getAll('planos_contingencia')
                        const stuckActive = all.find(p => p.status === 'Ativo')
                        if (stuckActive) {
                            stuckActive.status = 'Encerrado'
                            stuckActive.data_encerramento = new Date().toISOString()
                            await db.put('planos_contingencia', stuckActive)
                        }
                        return null
                    }
                }
            } catch (err) {
                console.warn('[contingencyDb] Fetch failed, falling back to local storage', err)
            }
        }

        const all = await db.getAll('planos_contingencia')
        return all.find(p => p.status === 'Ativo') || null
    },

    async activatePlan(planData) {
        const db = await initDB()
        const tempId = crypto.randomUUID()
        const newPlan = {
            id: tempId,
            ...planData,
            status: 'Ativo',
            data_ativacao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            synced: false
        }

        await db.put('planos_contingencia', newPlan)
        const id = newPlan.id
        
        if (navigator.onLine) {
            try {
                const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

                const { data, error } = await supabase
                    .from('planos_contingencia')
                    .insert([{
                        nivel: planData.nivel || 'Alerta',
                        motivo: planData.motivo,
                        area_afetada: planData.area_afetada || 'Município de Santa Maria de Jetibá',
                        comandante: isValidUUID(planData.comandante) ? planData.comandante : null,
                        status: 'Ativo'
                    }])
                    .select()
                    .single()
                
                if (data && !error) {
                    await db.put('planos_contingencia', { ...newPlan, id: data.id, synced: true })
                    return data
                } else if (error) {
                    console.error("[contingencyDb] Erro Supabase ao ativar plano:", error)
                }
            } catch (err) {
                console.error("[contingencyDb] Exceção ao ativar plano:", err)
            }
        }
        return { ...newPlan, id }
    },

    async closePlan(planId, report) {
        const db = await initDB()
        const plan = await db.get('planos_contingencia', planId)
        if (!plan) return

        const closedPlan = {
            ...plan,
            status: 'Encerrado',
            data_encerramento: new Date().toISOString(),
            relatorio_final: report,
            synced: false
        }

        await db.put('planos_contingencia', closedPlan)

        if (navigator.onLine && plan.id && !String(plan.id).startsWith('temp_')) {
            await supabase
                .from('planos_contingencia')
                .update({ 
                    status: 'Encerrado', 
                    data_encerramento: new Date().toISOString(),
                    relatorio_final: report
                })
                .eq('id', planId)
        }
    },

    async updateSCOStructure(planId, setorId, data) {
        if (!navigator.onLine) return
        await supabase
            .from('sco_estrutura')
            .upsert({
                plano_id: planId,
                setor_id: setorId,
                ...data,
                updated_at: new Date().toISOString()
            })
    },

    async getSCOMembers(planId) {
        if (!navigator.onLine) return []
        const { data } = await supabase
            .from('sco_membros')
            .select('*, usuario:usuarios(*)')
            .eq('plano_id', planId)
        return data || []
    },

    async assignUserToSCO(planId, setorId, funcao, usuarioId) {
        if (!navigator.onLine) return
        const { data, error } = await supabase
            .from('sco_membros')
            .insert([{
                plano_id: planId,
                setor_id: setorId,
                funcao,
                usuario_id: usuarioId
            }])
            .select('*, usuario:usuarios(*)')
            .single()
        
        if (error) throw error
        return data
    },

    async removeUserFromSCO(membroId) {
        if (!navigator.onLine) return
        await supabase
            .from('sco_membros')
            .delete()
            .eq('id', membroId)
    },

    async getAvailableUsers() {
        if (!navigator.onLine) return []
        const { data } = await supabase
            .from('usuarios')
            .select('id, full_name, email, role, photo_url')
            .eq('active', true)
        return data || []
    },

    async getOrgaos(usuarioId = null, isCoordenador = false, tenantId = null) {
        let query = supabase.from('placon_orgaos').select('*').eq('ativo', true).order('ordem')
        if (tenantId) query = query.eq('tenant_id', tenantId)

        if (!isCoordenador && usuarioId) {
            let uQuery = supabase.from('placon_usuario_orgao').select('orgao_id').eq('usuario_id', usuarioId)
            if (tenantId) uQuery = uQuery.eq('tenant_id', tenantId)
            const { data: userOrgaos } = await uQuery
            
            if (userOrgaos && userOrgaos.length > 0) {
                const ids = userOrgaos.map(u => u.orgao_id)
                query = query.in('id', ids)
            }
        }

        const { data, error } = await query
        if (!error && data) return data
        return []
    },

    async getOrgaoCompleto(orgaoId, tenantId = null) {
        try {
            const [
                { data: placonOrgao },
                { data: contatos },
                { data: atribuicoes },
                { data: recursosBase },
                { data: assinaturas }
            ] = await Promise.all([
                supabase.from('placon_orgaos').select('*').eq('id', orgaoId).maybeSingle(),
                supabase.from('placon_contatos').select('*').eq('orgao_id', orgaoId),
                supabase.from('placon_atribuicoes').select('*').eq('orgao_id', orgaoId).order('fase').order('ordem'),
                supabase.from('placon_recursos').select('*').eq('orgao_id', orgaoId),
                supabase.from('placon_assinaturas').select('*').eq('orgao_id', orgaoId).order('ordem')
            ])

            if (placonOrgao) {
                let recursos = []
                if (recursosBase && recursosBase.length > 0) {
                    const mciIds = recursosBase.map(r => r.mci_recurso_id).filter(Boolean)
                    let mciMap = {}
                    if (mciIds.length > 0) {
                        const { data: mciData } = await supabase.from('mci_recursos').select('*').in('id', mciIds)
                        if (mciData) {
                            mciData.forEach(m => { mciMap[m.id] = m })
                        }
                    }
                    recursos = recursosBase.map(r => ({
                        ...r,
                        alocado_no_plano: r.alocado_plano ?? r.alocado_no_plano ?? 0,
                        mci_recursos: r.mci_recurso_id ? mciMap[r.mci_recurso_id] || null : null,
                        disponivel_mci: r.mci_recurso_id && mciMap[r.mci_recurso_id] ? mciMap[r.mci_recurso_id].quantidade_disponivel : null
                    }))
                }

                // Assinaturas possuem separação estrita de telefone e email
                const assinaturasProcessadas = (assinaturas && assinaturas.length > 0 ? assinaturas : contatos || []).map(a => ({
                    id: a.id,
                    nome: a.nome || '',
                    cargo: a.cargo || '',
                    telefone: a.telefone || '',
                    email: a.email || '',
                    identificacao_assinatura_edocs: a.identificacao_assinatura_edocs || a.identificacao_edocs || ''
                }))

                return {
                    ...placonOrgao,
                    descricao_responsabilidade: placonOrgao.descricao || placonOrgao.descricao_responsabilidade,
                    contatos: contatos || [],
                    atribuicoes: (atribuicoes || []).map(a => ({
                        ...a,
                        fase: a.fase ? a.fase.charAt(0).toUpperCase() + a.fase.slice(1) : 'Prevenção'
                    })),
                    recursos: recursos || [],
                    assinaturas: assinaturasProcessadas
                }
            }
        } catch (e) {
            console.error('[contingencyDb] Erro em getOrgaoCompleto:', e)
        }
        return null
    },

    async alocarRecursoPlacon(recursoId, novaQuantidade, usuarioId, tenantId) {
        const { data: recurso } = await supabase.from('placon_recursos').select('*').eq('id', recursoId).maybeSingle()
        if (recurso) {
            if (recurso.mci_recurso_id) {
                const { data: mci } = await supabase.from('mci_recursos').select('quantidade_disponivel').eq('id', recurso.mci_recurso_id).single()
                if (mci && novaQuantidade > mci.quantidade_disponivel) {
                    throw new Error(`MCI indica apenas ${mci.quantidade_disponivel} unidades disponíveis`)
                }
            }

            if (usuarioId && tenantId) {
                await supabase.from('placon_recursos_log').insert([{
                    tenant_id: tenantId,
                    recurso_id: recursoId,
                    usuario_id: usuarioId,
                    alocado_antes: recurso.alocado_plano || 0,
                    alocado_depois: novaQuantidade
                }])
            }

            const { data, error } = await supabase
                .from('placon_recursos')
                .update({ alocado_plano: novaQuantidade })
                .eq('id', recursoId)
                .select()
                .single()

            if (error) throw error
            return data
        }
        return null
    },

    async getPlanoPublico(tenantId) {
        try {
            let orgsQuery = supabase.from('placon_orgaos').select('*').eq('ativo', true).order('ordem')
            if (tenantId) orgsQuery = orgsQuery.eq('tenant_id', tenantId)
            const { data: orgaos } = await orgsQuery

            if (orgaos && orgaos.length > 0) {
                const resultado = []
                for (const orgao of orgaos) {
                    const { data: atribuicoes } = await supabase.from('placon_atribuicoes').select('*').eq('orgao_id', orgao.id).order('fase').order('ordem')
                    const { data: contatos } = await supabase.from('placon_contatos').select('*').eq('orgao_id', orgao.id)
                    resultado.push({
                        ...orgao,
                        descricao_responsabilidade: orgao.descricao,
                        atribuicoes: (atribuicoes || []).map(a => ({ ...a, fase: a.fase ? a.fase.charAt(0).toUpperCase() + a.fase.slice(1) : 'Prevenção' })),
                        contatos: contatos || []
                    })
                }

                let versaoQuery = supabase.from('placon_versoes').select('*').order('created_at', { ascending: false }).limit(1)
                if (tenantId) versaoQuery = versaoQuery.eq('tenant_id', tenantId)
                const { data: versaoData } = await versaoQuery
                const versao = versaoData && versaoData.length > 0 ? versaoData[0] : null

                return { versao, orgaos: resultado }
            }
        } catch (e) {
            console.error('[contingencyDb] Erro em getPlanoPublico:', e)
        }
        return { versao: { numero_versao: '2026.1', descricao: 'Versão Inicial 2026' }, orgaos: [] }
    },

    async getAllAtribuicoes() {
        const { data } = await supabase.from('placon_atribuicoes').select('*, placon_orgaos(*)').order('fase');
        return data || [];
    },

    async createAtribuicao(atribuicaoData) {
        const { data, error } = await supabase
            .from('placon_atribuicoes')
            .insert([{
                tenant_id: atribuicaoData.tenant_id || '00000000-0000-0000-0000-000000000001',
                orgao_id: atribuicaoData.orgao_id,
                fase: (atribuicaoData.fase || 'prevencao').toLowerCase(),
                texto: atribuicaoData.texto,
                base_legal: atribuicaoData.base_legal,
                ordem: atribuicaoData.ordem_exibicao || 0
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getAllAssinaturas() {
        const { data } = await supabase.from('placon_contatos').select('*, placon_orgaos(*)');
        return data || [];
    },

    // =========================================================================
    // MODALIDADE TÁTICA (SCO — SISTEMA DE COMANDO DE OPERAÇÕES)
    // =========================================================================
    _setoresMemory: {},
    _membersMemory: {},
    _recursosMemory: {},
    _atribuicoesPlanoMemory: {},
    _tarefasMemory: {},
    _logsMemory: {},

    async loadScoStructure(planId) {
        if (!planId) return []
        if (navigator.onLine) {
            try {
                const { data } = await supabase.from('sco_membros').select('*').eq('plano_id', planId)
                if (data && data.length > 0) {
                    this._membersMemory[planId] = data
                    return data
                }
            } catch (e) {
                console.warn('[contingencyDb] loadScoStructure fallback:', e)
            }
        }
        return this._membersMemory[planId] || []
    },

    async updateScoMember(planId, sessao, funcao, usuarioId, atribuicao = '') {
        const newMember = {
            id: crypto.randomUUID(),
            plano_id: planId,
            sessao,
            funcao,
            usuario_id: usuarioId,
            atribuicao,
            created_at: new Date().toISOString()
        }
        if (!this._membersMemory[planId]) this._membersMemory[planId] = []
        this._membersMemory[planId] = this._membersMemory[planId].filter(m => !(m.usuario_id === usuarioId && m.sessao === sessao))
        this._membersMemory[planId].push(newMember)

        if (navigator.onLine) {
            try {
                await supabase.from('sco_membros').upsert([newMember])
            } catch (e) {}
        }
        return newMember
    },

    async removeScoMember(membroId) {
        Object.keys(this._membersMemory).forEach(pid => {
            this._membersMemory[pid] = (this._membersMemory[pid] || []).filter(m => m.id !== membroId)
        })
        if (navigator.onLine) {
            try {
                await supabase.from('sco_membros').delete().eq('id', membroId)
            } catch (e) {}
        }
    },

    async loadSetores(planId) {
        if (!planId) return []
        let currentSets = this._setoresMemory[planId] || []

        if (navigator.onLine) {
            try {
                const { data } = await supabase.from('sco_estrutura').select('*').eq('plano_id', planId)
                if (data && data.length > 0) {
                    currentSets = data
                }
            } catch (e) {
                console.warn('[contingencyDb] loadSetores Supabase fallback:', e)
            }
        }

        // Se não houver setores cadastrados, inicializar automaticamente a árvore padrão do SCO!
        if (!currentSets || currentSets.length === 0) {
            const rootId = crypto.randomUUID()
            const defaultSets = [
                { id: rootId, plano_id: planId, parent_id: null, title: 'Comando do Incidente (SCO)', color: 'bg-slate-900' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Segurança', color: 'bg-rose-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Informações Públicas', color: 'bg-blue-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Ligação / Articulação', color: 'bg-purple-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Seção de Operações', color: 'bg-emerald-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Seção de Planejamento', color: 'bg-amber-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Seção de Logística', color: 'bg-cyan-700' },
                { id: crypto.randomUUID(), plano_id: planId, parent_id: rootId, title: 'Seção de Finanças', color: 'bg-indigo-700' }
            ]
            currentSets = defaultSets
            this._setoresMemory[planId] = currentSets

            if (navigator.onLine) {
                try {
                    await supabase.from('sco_estrutura').upsert(defaultSets)
                } catch (e) {}
            }
        } else {
            this._setoresMemory[planId] = currentSets
        }

        return currentSets
    },

    async addSetor(planId, parentId, title, color = 'bg-slate-800') {
        const newSetor = {
            id: crypto.randomUUID(),
            plano_id: planId,
            parent_id: parentId,
            title,
            color
        }
        if (!this._setoresMemory[planId]) this._setoresMemory[planId] = []
        this._setoresMemory[planId].push(newSetor)

        if (navigator.onLine) {
            try {
                await supabase.from('sco_estrutura').insert([newSetor])
            } catch (e) {}
        }
        return newSetor
    },

    async removeSetor(setorId) {
        Object.keys(this._setoresMemory).forEach(pid => {
            this._setoresMemory[pid] = (this._setoresMemory[pid] || []).filter(s => s.id !== setorId && s.parent_id !== setorId)
        })
        if (navigator.onLine) {
            try {
                await supabase.from('sco_estrutura').delete().eq('id', setorId)
            } catch (e) {}
        }
    },

    async loadPlanoAtribuicoes(planId) {
        if (navigator.onLine) {
            try {
                const { data } = await supabase.from('placon_atribuicoes').select('*')
                if (data) return data
            } catch (e) {}
        }
        return this._atribuicoesPlanoMemory[planId] || []
    },

    async addPlanoAtribuicao(data) {
        const newItem = {
            id: crypto.randomUUID(),
            ...data,
            created_at: new Date().toISOString()
        }
        if (!this._atribuicoesPlanoMemory[data.plano_id]) this._atribuicoesPlanoMemory[data.plano_id] = []
        this._atribuicoesPlanoMemory[data.plano_id].push(newItem)
        return newItem
    },

    async removePlanoAtribuicao(id) {
        Object.keys(this._atribuicoesPlanoMemory).forEach(pid => {
            this._atribuicoesPlanoMemory[pid] = (this._atribuicoesPlanoMemory[pid] || []).filter(a => a.id !== id)
        })
    },

    async loadRecursos(planId) {
        if (!this._recursosMemory[planId]) {
            this._recursosMemory[planId] = [
                { id: 'res_1', plano_id: planId, name: 'Viatura Defesa Civil 01', type: 'Veículo', status: 'Disponível' },
                { id: 'res_2', plano_id: planId, name: 'Ambulância UTI Móvel 02', type: 'Veículo', status: 'Disponível' },
                { id: 'res_3', plano_id: planId, name: 'Caminhão-Pipa 10.000L', type: 'Veículo', status: 'Disponível' },
                { id: 'res_4', plano_id: planId, name: 'Gerador de Energia 15kVA', type: 'Equipamento', status: 'Disponível' },
                { id: 'res_5', plano_id: planId, name: 'Motosserra de Resgate', type: 'Equipamento', status: 'Disponível' },
                { id: 'res_6', plano_id: planId, name: 'Estação Rádio VHF/HF REMER', type: 'Comunicação', status: 'Disponível' }
            ]
        }
        return this._recursosMemory[planId]
    },

    async addRecurso(planId, name, type) {
        const newRes = {
            id: 'res_' + crypto.randomUUID().slice(0, 8),
            plano_id: planId,
            name,
            type,
            status: 'Disponível'
        }
        if (!this._recursosMemory[planId]) this._recursosMemory[planId] = []
        this._recursosMemory[planId].push(newRes)
        return newRes
    },

    async loadLogs(planId) {
        if (!this._logsMemory[planId]) {
            this._logsMemory[planId] = [
                { id: 'log_1', data: new Date().toISOString(), texto: 'Plano de Contingência ativado no nível Alerta.' },
                { id: 'log_2', data: new Date().toISOString(), texto: 'Estrutura do Sistema de Comando de Operações (SCO) inicializada.' }
            ]
        }
        return this._logsMemory[planId]
    },

    async loadTarefas(sectorId) {
        return this._tarefasMemory[sectorId] || []
    },

    async addTarefa(sectorId, text) {
        const newTask = { id: crypto.randomUUID(), sector_id: sectorId, text, done: false }
        if (!this._tarefasMemory[sectorId]) this._tarefasMemory[sectorId] = []
        this._tarefasMemory[sectorId].push(newTask)
        return newTask
    },

    async loadMensagens(sectorId) {
        return []
    }
}
