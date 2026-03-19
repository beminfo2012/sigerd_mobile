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

        if (navigator.onLine && plan.id && !String(plan.id).startsWith('temp_')) {
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
        const tempId = `setor_${Date.now()}_${Math.random()}`
        const setor = { id: tempId, plano_id: planoId, parent_id: parentId, title, color_class: colorClass, created_at: new Date().toISOString(), synced: false }
        await db.put('sco_setores', setor)
        
        if (navigator.onLine && !String(planoId).startsWith('temp_') && (!parentId || !String(parentId).startsWith('temp_'))) {
            const { data, error } = await supabase.from('sco_setores').insert([{ plano_id: planoId, parent_id: parentId, title, color_class: colorClass }]).select().single()
            if (data && !error) {
                await db.delete('sco_setores', tempId)
                await db.put('sco_setores', { ...data, synced: true })
                return data
            }
        }
        await this.addLog(planoId, `Novo setor criado: ${title}`)
        return setor
    },

    async removeSetor(setorId) {
        const db = await initDB()
        const sectors = await db.getAllFromIndex('sco_setores', 'parent_id', setorId)
        for (const child of sectors) { await this.removeSetor(child.id) }
        await db.delete('sco_setores', setorId)
        if (navigator.onLine && !String(setorId).startsWith('setor_')) {
            await supabase.from('sco_setores').delete().eq('id', setorId)
        }
    },

    async loadSetores(planoId) {
        const db = await initDB()
        if (navigator.onLine && !String(planoId).startsWith('temp_')) {
            const { data } = await supabase.from('sco_setores').select('*').eq('plano_id', planoId)
            if (data) {
                for (const item of data) { await db.put('sco_setores', { ...item, synced: true }) }
                return data
            }
        }
        return await db.getAllFromIndex('sco_setores', 'plano_id', planoId)
    },

    async addRecurso(planoId, name, type) {
        const db = await initDB()
        const tempId = `res_${Date.now()}`
        const res = { id: tempId, plano_id: planoId, setor_id: null, name, type, status: 'Disponível', synced: false }
        await db.put('sco_recursos', res)
        if (navigator.onLine && !String(planoId).startsWith('temp_')) {
            const { data, error } = await supabase.from('sco_recursos').insert([{ plano_id: planoId, name, type, status: 'Disponível' }]).select().single()
            if (data && !error) {
                await db.delete('sco_recursos', tempId); await db.put('sco_recursos', { ...data, synced: true }); return data
            }
        }
        return res
    },

    async loadRecursos(planoId) {
        const db = await initDB()
        if (navigator.onLine && !String(planoId).startsWith('temp_')) {
            const { data } = await supabase.from('sco_recursos').select('*').eq('plano_id', planoId)
            if (data) {
                for (const item of data) { await db.put('sco_recursos', { ...item, synced: true }) }
                return data
            }
        }
        return await db.getAllFromIndex('sco_recursos', 'plano_id', planoId)
    },

    async allocateRecurso(recursoId, setorId, tarefaId = null) {
        const db = await initDB()
        const res = await db.get('sco_recursos', recursoId)
        if (res) {
            res.setor_id = setorId; res.tarefa_id = tarefaId; res.status = (setorId || tarefaId) ? 'Em campo' : 'Disponível'
            await db.put('sco_recursos', res)
            if (navigator.onLine && !String(recursoId).startsWith('res_')) {
                await supabase.from('sco_recursos').update({ setor_id: setorId, tarefa_id: tarefaId, status: res.status }).eq('id', recursoId)
            }
        }
    },

    async addTarefa(setorId, text) {
        const db = await initDB()
        const tempId = `task_${Date.now()}`
        const t = { id: tempId, setor_id: setorId, text, done: false }
        await db.put('sco_tarefas', t)
        if (navigator.onLine && !String(setorId).startsWith('setor_')) {
            const { data, error } = await supabase.from('sco_tarefas').insert([{ setor_id: setorId, text }]).select().single()
            if (data && !error) {
                await db.delete('sco_tarefas', tempId); await db.put('sco_tarefas', { ...data, synced: true }); return data
            }
        }
        return t
    },

    async toggleTarefa(taskId) {
        const db = await initDB()
        const t = await db.get('sco_tarefas', taskId)
        if (t) {
            t.done = !t.done; await db.put('sco_tarefas', t)
            if (navigator.onLine && !String(taskId).startsWith('task_')) {
                await supabase.from('sco_tarefas').update({ done: t.done }).eq('id', taskId)
            }
        }
    },

    async loadTarefas(setorId) {
        const db = await initDB()
        if (navigator.onLine && !String(setorId).startsWith('setor_')) {
            const { data } = await supabase.from('sco_tarefas').select('*').eq('setor_id', setorId)
            if (data) {
                for (const item of data) { await db.put('sco_tarefas', { ...item, synced: true }) }
                return data
            }
        }
        return await db.getAllFromIndex('sco_tarefas', 'setor_id', setorId)
    },

    async addMensagem(setorId, senderId, text) {
        const db = await initDB()
        const tempId = `msg_${Date.now()}`
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const m = { id: tempId, setor_id: setorId, sender_id: senderId, text, time }
        await db.put('sco_mensagens', m)
        if (navigator.onLine && !String(setorId).startsWith('setor_')) {
            const { data } = await supabase.from('sco_mensagens').insert([{ setor_id: setorId, sender_id: senderId, text, time }]).select().single()
            if (data) {
                await db.delete('sco_mensagens', tempId); await db.put('sco_mensagens', { ...data, synced: true }); return data
            }
        }
        return m
    },

    async loadMensagens(setorId) {
        const db = await initDB()
        if (navigator.onLine && !String(setorId).startsWith('setor_')) {
            const { data } = await supabase.from('sco_mensagens').select('*').eq('setor_id', setorId)
            if (data) {
                for (const item of data) { await db.put('sco_mensagens', { ...item, synced: true }) }
                return data
            }
        }
        return await db.getAllFromIndex('sco_mensagens', 'setor_id', setorId)
    },

    async addLog(planoId, text) {
        const db = await initDB()
        const tempId = `log_${Date.now()}`
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const l = { id: tempId, plano_id: planoId, time, text }
        await db.put('sco_logs', l)
        if (navigator.onLine && !String(planoId).startsWith('temp_')) {
            const { data } = await supabase.from('sco_logs').insert([{ plano_id: planoId, time, text }]).select().single()
            if (data) {
                await db.delete('sco_logs', tempId); await db.put('sco_logs', { ...data, synced: true }); return data
            }
        }
        return l
    },

    async loadLogs(planoId) {
        const db = await initDB()
        if (navigator.onLine && !String(planoId).startsWith('temp_')) {
            const { data } = await supabase.from('sco_logs').select('*').eq('plano_id', planoId)
            if (data) {
                for (const item of data) { await db.put('sco_logs', { ...item, synced: true }) }
                return data.sort((a, b) => b.created_at?.localeCompare(a.created_at))
            }
        }
        const logs = await db.getAllFromIndex('sco_logs', 'plano_id', planoId)
        return logs.sort((a, b) => b.id.localeCompare(a.id))
    }
}
