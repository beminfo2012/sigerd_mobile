// Copie e cole este código no Console do navegador (F12 > Console)
// Ele vai capturar e exibir todos os logs do Dashboard

console.clear();
console.log('🔍 Iniciando captura de logs do Dashboard...\n');

// Capturar todos os logs
const logs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function (...args) {
    logs.push({ type: 'log', message: args.join(' ') });
    originalLog.apply(console, args);
};

console.error = function (...args) {
    logs.push({ type: 'error', message: args.join(' ') });
    originalError.apply(console, args);
};

console.warn = function (...args) {
    logs.push({ type: 'warn', message: args.join(' ') });
    originalWarn.apply(console, args);
};

// Aguardar 3 segundos e exibir relatório
setTimeout(() => {
    console.log('\n📊 RELATÓRIO DE LOGS:\n');
    console.log('='.repeat(50));

    const dashboardLogs = logs.filter(l => l.message.includes('[Dashboard]'));

    if (dashboardLogs.length === 0) {
        console.error('❌ NENHUM log do Dashboard foi capturado!');
        console.log('Isso significa que o componente Dashboard NÃO está sendo montado.');
    } else {
        console.log(`✅ ${dashboardLogs.length} logs do Dashboard capturados:\n`);
        dashboardLogs.forEach((log, i) => {
            const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : '📝';
            console.log(`${icon} ${i + 1}. ${log.message}`);
        });
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📋 TODOS OS LOGS:\n');
    logs.forEach((log, i) => {
        const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : '📝';
        console.log(`${icon} ${i + 1}. ${log.message}`);
    });

    // Verificar estado do root
    const root = document.getElementById('root');
    console.log('\n🔍 Estado do elemento root:');
    console.log('Existe:', !!root);
    console.log('Conteúdo (primeiros 200 chars):', root ? root.innerHTML.substring(0, 200) : 'N/A');
    console.log('Tamanho total:', root ? root.innerHTML.length : 0);

    // Restaurar console original
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    console.log('\n✅ Captura concluída! Copie TUDO acima e envie para o suporte.');
}, 3000);

console.log('⏳ Aguardando 3 segundos para capturar logs...\n');
