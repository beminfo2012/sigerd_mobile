import { initDB } from './db'
import { supabase } from './supabase'

export const contingencyDb = {
    async getActivePlan() {
        const db = await initDB()
        const all = await db.getAll('planos_contingencia')
        const activeLocal = all.find(p => p.status === 'Ativo')
        
        if (activeLocal) return activeLocal

        if (navigator.onLine) {
            const { data, error } = await supabase
                .from('planos_contingencia')
                .select('*, sco_estrutura(*)')
                .eq('status', 'Ativo')
                .maybeSingle()
            
            if (data && !error) {
                await db.put('planos_contingencia', data)
                return data
            }
        }
        return null
    },

    async activatePlan(planData) {
        const db = await initDB()
        const newPlan = {
            ...planData,
            status: 'Ativo',
            data_ativacao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            synced: false
        }

        const id = await db.put('planos_contingencia', newPlan)
        
        if (navigator.onLine) {
            const { data, error } = await supabase
                .from('planos_contingencia')
                .insert([{
                    nivel: planData.nivel,
                    motivo: planData.motivo,
                    area_afetada: planData.area_afetada,
                    comandante: planData.comandante,
                    status: 'Ativo'
                }])
                .select()
                .single()
            
            if (data && !error) {
                await db.put('planos_contingencia', { ...newPlan, id: data.id, synced: true })
                return data
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

        if (navigator.onLine && typeof plan.id === 'number') {
            await supabase
                .from('planos_contingencia')
                .update({ 
                    status: 'Encerrado', 
                    data_encerramento: new Date().toISOString(),
                    relatorio_final: report
                })
                .eq('id', plan.id)
        }
    },

    async loadScoStructure(planoId) {
        const db = await initDB()
        const all = await db.getAllFromIndex('sco_estrutura', 'plano_id', planoId)
        
        if (navigator.onLine) {
            try {
                const { data } = await supabase
                    .from('sco_estrutura')
                    .select('*, profiles(*)')
                    .eq('plano_id', planoId)
                
                if (data) {
                    for (const item of data) {
                        await db.put('sco_estrutura', { ...item, synced: true })
                    }
                    return data
                }
            } catch (e) {
                console.warn('Fallback to local SCO structure')
            }
        }
        return all
    },

    async updateScoMember(planoId, sessao, funcao, usuarioId, atribuicao = '') {
        const db = await initDB()
        const allMembers = await db.getAllFromIndex('sco_estrutura', 'plano_id', planoId)
        const existing = (funcao === 'Chefia')
            ? allMembers.find(m => m.sessao === sessao && m.funcao === 'Chefia')
            : null

        const memberId = existing ? existing.id : `temp_${Date.now()}_${Math.random()}`
        
        const memberData = {
            id: memberId,
            plano_id: planoId,
            sessao,
            funcao,
            usuario_id: usuarioId,
            atribuicao,
            status: 'Ativo',
            synced: false,
            created_at: existing ? existing.created_at : new Date().toISOString()
        }

        await db.put('sco_estrutura', memberData)

        if (navigator.onLine) {
            try {
                let result
                if (funcao === 'Chefia') {
                    result = await supabase
                        .from('sco_estrutura')
                        .upsert({
                            plano_id: planoId,
                            sessao,
                            funcao,
                            usuario_id: usuarioId,
                            atribuicao,
                            status: 'Ativo'
                        }, { onConflict: 'plano_id,sessao,funcao' })
                        .select()
                        .single()
                } else {
                    result = await supabase
                        .from('sco_estrutura')
                        .insert([{
                            plano_id: planoId,
                            sessao,
                            funcao,
                            usuario_id: usuarioId,
                            atribuicao,
                            status: 'Ativo'
                        }])
                        .select()
                        .single()
                }

                if (!result.error && result.data) {
                    if (existing) await db.delete('sco_estrutura', memberId)
                    await db.put('sco_estrutura', { ...result.data, synced: true })
                    return result.data
                }
            } catch (err) {
                console.error("Error syncing SCO member:", err)
            }
        }
        return memberData
    },

    async removeScoMember(memberId) {
        const db = await initDB()
        await db.delete('sco_estrutura', memberId)
        
        if (navigator.onLine && !String(memberId).startsWith('temp_')) {
            await supabase.from('sco_estrutura').delete().eq('id', memberId)
        }
    },

    async loadPlanoAtribuicoes(planoId) {
        const db = await initDB()
        const all = await db.getAllFromIndex('plano_atribuicoes', 'plano_id', planoId)
        
        if (navigator.onLine) {
            const { data } = await supabase
                .from('plano_atribuicoes')
                .select('*')
                .eq('plano_id', planoId)
            
            if (data) {
                for (const item of data) {
                    await db.put('plano_atribuicoes', { ...item, synced: true })
                }
                return data
            }
        }
        return all
    },

    async addPlanoAtribuicao(atribData) {
        const db = await initDB()
        const newAtrib = {
            ...atribData,
            id: `temp_atrib_${Date.now()}_${Math.random()}`,
            synced: false,
            created_at: new Date().toISOString()
        }

        await db.put('plano_atribuicoes', newAtrib)

        if (navigator.onLine) {
            const { data, error } = await supabase
                .from('plano_atribuicoes')
                .insert([{
                    plano_id: atribData.plano_id,
                    ambito: atribData.ambito,
                    secretaria: atribData.secretaria,
                    descricao: atribData.descricao
                }])
                .select()
                .single()
            
            if (data && !error) {
                await db.delete('plano_atribuicoes', newAtrib.id)
                await db.put('plano_atribuicoes', { ...data, synced: true })
                return data
            }
        }
        return newAtrib
    },

    async removePlanoAtribuicao(atribId) {
        const db = await initDB()
        await db.delete('plano_atribuicoes', atribId)
        
        if (navigator.onLine && !String(atribId).startsWith('temp_')) {
            await supabase.from('plano_atribuicoes').delete().eq('id', atribId)
        }
    },

    // ADVANCED SCO (DYNAMIC ORGANOGRAM)
    async addSetor(planoId, parentId, title, colorClass = '') {
        const db = await initDB()
        const setor = {
            id: `setor_${Date.now()}_${Math.random()}`,
            plano_id: planoId,
            parent_id: parentId,
            title,
            color_class: colorClass,
            created_at: new Date().toISOString(),
            synced: false
        }
        await db.put('sco_setores', setor)
        // Auto Log
        await this.addLog(planoId, `Novo setor criado: ${title}`)
        return setor
    },

    async removeSetor(setorId) {
        const db = await initDB()
        // Find children to delete recursively
        const sectors = await db.getAllFromIndex('sco_setores', 'parent_id', setorId)
        for (const child of sectors) {
            await this.removeSetor(child.id)
        }
        await db.delete('sco_setores', setorId)
    },

    async loadSetores(planoId) {
        const db = await initDB()
        return await db.getAllFromIndex('sco_setores', 'plano_id', planoId)
    },

    async addRecurso(planoId, name, type) {
        const db = await initDB()
        const res = {
            id: `res_${Date.now()}`,
            plano_id: planoId,
            setor_id: null,
            name,
            type,
            status: 'Disponível',
            synced: false
        }
        await db.put('sco_recursos', res)
        return res
    },

    async loadRecursos(planoId) {
        const db = await initDB()
        return await db.getAllFromIndex('sco_recursos', 'plano_id', planoId)
    },

    async allocateRecurso(recursoId, setorId, tarefaId = null) {
        const db = await initDB()
        const res = await db.get('sco_recursos', recursoId)
        if (res) {
            res.setor_id = setorId
            res.tarefa_id = tarefaId
            res.status = (setorId || tarefaId) ? 'Em campo' : 'Disponível'
            await db.put('sco_recursos', res)
        }
    },

    async addTarefa(setorId, text) {
        const db = await initDB()
        const t = { id: `task_${Date.now()}`, setor_id: setorId, text, done: false }
        await db.put('sco_tarefas', t)
        return t
    },

    async toggleTarefa(taskId) {
        const db = await initDB()
        const t = await db.get('sco_tarefas', taskId)
        if (t) {
            t.done = !t.done
            await db.put('sco_tarefas', t)
        }
    },

    async loadTarefas(setorId) {
        const db = await initDB()
        return await db.getAllFromIndex('sco_tarefas', 'setor_id', setorId)
    },

    async addMensagem(setorId, senderId, text) {
        const db = await initDB()
        const m = {
            id: `msg_${Date.now()}`,
            setor_id: setorId,
            sender_id: senderId,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        await db.put('sco_mensagens', m)
        return m
    },

    async loadMensagens(setorId) {
        const db = await initDB()
        return await db.getAllFromIndex('sco_mensagens', 'setor_id', setorId)
    },

    async addLog(planoId, text) {
        const db = await initDB()
        const l = {
            id: `log_${Date.now()}`,
            plano_id: planoId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text
        }
        await db.put('sco_logs', l)
        return l
    },

    async loadLogs(planoId) {
        const db = await initDB()
        const logs = await db.getAllFromIndex('sco_logs', 'plano_id', planoId)
        return logs.sort((a, b) => b.id.localeCompare(a.id))
    }
}
