document.addEventListener('DOMContentLoaded', function () {
    // Animação de entrada das seções
    const sections = document.querySelectorAll('.form-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Atualização da barra de progresso
    function updateProgress() {
        const form = document.getElementById('fideForm');
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        const filled = Array.from(inputs).filter(input => {
            if (input.type === 'radio') {
                return form.querySelector(`input[name="${input.name}"]:checked`);
            }
            return input.value.trim() !== '';
        });

        const progress = (filled.length / inputs.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
    }

    // Função para calcular o total de afetados
    function calcularTotalAfetados() {
        let total = 0;
        const camposAfetados = ['mortos', 'feridos', 'enfermos', 'desabrigados', 'desalojados', 'desaparecidos', 'outros_afetados'];
        camposAfetados.forEach(function (campo) {
            const valor = parseInt(document.querySelector(`input[name="${campo}"]`).value) || 0;
            total += valor;
        });
        document.querySelector('input[name="total_afetados"]').value = total;
        updateProgress();
    }

    // Função para calcular o total de prejuízos públicos
    function calcularTotalPrejuizosPublicos() {
        let total = 0;
        const camposPrejuizosPublicos = [
            'valor_am_sp_ae', 'valor_agua_potavel', 'valor_esgoto', 'valor_limpeza_urbana',
            'valor_desinfestacao', 'valor_energia', 'valor_telecomunicacoes', 'valor_transportes',
            'valor_combustiveis', 'valor_seguranca_publica', 'valor_ensino'
        ];
        camposPrejuizosPublicos.forEach(function (campo) {
            const valor = parseFloat(document.querySelector(`input[name="${campo}"]`).value) || 0;
            total += valor;
        });
        document.querySelector('input[name="valor_total_prejuizos_publicos"]').value = total.toFixed(2);
        updateProgress();
    }

    // Função para calcular o total de prejuízos privados
    function calcularTotalPrejuizosPrivados() {
        let total = 0;
        const camposPrejuizosPrivados = [
            'valor_agricultura', 'valor_pecuaria', 'valor_industria', 'valor_comercio', 'valor_servicos'
        ];
        camposPrejuizosPrivados.forEach(function (campo) {
            const valor = parseFloat(document.querySelector(`input[name="${campo}"]`).value) || 0;
            total += valor;
        });
        document.querySelector('input[name="valor_total_prejuizos_privados"]').value = total.toFixed(2);
        updateProgress();
    }

    // Adicionar listeners para os campos de danos humanos
    const camposDanosHumanos = document.querySelectorAll('input[name="mortos"], input[name="feridos"], input[name="enfermos"], input[name="desabrigados"], input[name="desalojados"], input[name="desaparecidos"], input[name="outros_afetados"]');
    camposDanosHumanos.forEach(function (campo) {
        campo.addEventListener('input', calcularTotalAfetados);
    });

    // Adicionar listeners para os campos de prejuízos públicos
    const camposPrejuizosPublicos = document.querySelectorAll('input[name^="valor_am_sp_ae"], input[name^="valor_agua_potavel"], input[name^="valor_esgoto"], input[name^="valor_limpeza_urbana"], input[name^="valor_desinfestacao"], input[name^="valor_energia"], input[name^="valor_telecomunicacoes"], input[name^="valor_transportes"], input[name^="valor_combustiveis"], input[name^="valor_seguranca_publica"], input[name^="valor_ensino"]');
    camposPrejuizosPublicos.forEach(function (campo) {
        campo.addEventListener('input', calcularTotalPrejuizosPublicos);
    });

    // Adicionar listeners para os campos de prejuízos privados
    const camposPrejuizosPrivados = document.querySelectorAll('input[name^="valor_agricultura"], input[name^="valor_pecuaria"], input[name^="valor_industria"], input[name^="valor_comercio"], input[name^="valor_servicos"]');
    camposPrejuizosPrivados.forEach(function (campo) {
        campo.addEventListener('input', calcularTotalPrejuizosPrivados);
    });

    // Adicionar listeners para atualização do progresso
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });

    // Chamar as funções ao carregar a página
    calcularTotalAfetados();
    calcularTotalPrejuizosPublicos();
    calcularTotalPrejuizosPrivados();
    updateProgress();

    // Validação e envio do formulário
    document.getElementById('fideForm').addEventListener('submit', function (event) {
        event.preventDefault();

        // Validação básica
        const requiredFields = this.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                const radioGroup = this.querySelectorAll(`input[name="${field.name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                if (!isChecked) {
                    isValid = false;
                    field.style.borderColor = 'var(--danger-color)';
                }
            } else if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--danger-color)';
            } else {
                field.style.borderColor = 'var(--border-color)';
            }
        });

        if (isValid) {
            // Simular envio bem-sucedido
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('✅ Formulário FIDE enviado com sucesso!\n\nEm um sistema real, os dados seriam enviados para o S2ID para processamento e análise.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                window.location.href = 'secao_fide.html'; // Redireciona de volta para a lista
            }, 2000);
        } else {
            alert('⚠️ Por favor, preencha todos os campos obrigatórios marcados com asterisco (*).');
        }
    });
});