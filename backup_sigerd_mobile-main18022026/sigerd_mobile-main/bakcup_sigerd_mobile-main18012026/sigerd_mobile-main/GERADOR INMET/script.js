// Global variables
let currentAlerts = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAlerts();
    setupEventListeners();
    updatePreviewText(); // Initial render
});

async function fetchAlerts() {
    const sourceSelect = document.getElementById('alert-source');
    sourceSelect.innerHTML = '<option>Carregando...</option>';

    try {
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';

        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));

        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();
        processAlerts(data);

    } catch (error) {
        console.error('Erro ao buscar alertas:', error);
        sourceSelect.innerHTML = '<option value="">Erro ao carregar (Tente manual)</option>';

        if (!document.getElementById('load-example')) {
            const btn = document.createElement('button');
            btn.id = 'load-example';
            btn.textContent = 'Carregar Exemplo';
            btn.style.marginTop = '5px';
            btn.onclick = (e) => {
                e.preventDefault();
                loadAlertToForm({
                    aviso_tipo: 'Acumulado de Chuva',
                    aviso_severidade: 'Grande Perigo',
                    inicio: '04/12/2025 10:00',
                    fim: '05/12/2025 23:59',
                    riscos: ['Chuva superior a 60 mm/h ou maior que 100 mm/dia.', 'Grande risco de grandes alagamentos e transbordamentos de rios, grandes deslizamentos de encostas, em cidades com tais áreas de risco.'],
                    municipios: ['São Paulo', 'Rio de Janeiro']
                });
            };
            document.querySelector('.control-group').appendChild(btn);
        }
    }
}

function processAlerts(data) {
    currentAlerts = [];
    const targetGeocode = "3204559"; // Santa Maria de Jetibá

    const addAlerts = (list) => {
        if (!list) return;
        list.forEach(alert => {
            // Check if geocodes field exists and contains the target geocode
            if (alert.geocodes && alert.geocodes.includes(targetGeocode)) {
                currentAlerts.push(alert);
            }
        });
    };

    if (data.hoje) addAlerts(data.hoje);
    if (data.amanha) addAlerts(data.amanha);
    if (data.futuro) addAlerts(data.futuro);

    populateDropdown();
}

function populateDropdown() {
    const sourceSelect = document.getElementById('alert-source');

    if (currentAlerts.length === 0) {
        sourceSelect.innerHTML = '<option value="">Nenhum alerta para Santa Maria de Jetibá</option>';
        return;
    }

    sourceSelect.innerHTML = '<option value="">Selecione um alerta (Santa Maria de Jetibá)...</option>';

    currentAlerts.forEach((alert, index) => {
        const option = document.createElement('option');
        option.value = index;
        const type = alert.aviso_tipo;
        const severity = alert.aviso_severidade;

        // Format start date for display
        let dateDisplay = '';
        if (alert.data_inicio) {
            const dateParts = alert.data_inicio.split('T')[0].split('-');
            dateDisplay = `${dateParts[2]}/${dateParts[1]}`;
        }

        option.textContent = `[${severity}] ${type} - ${dateDisplay}`;
        sourceSelect.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('alert-source').addEventListener('change', (e) => {
        const index = e.target.value;
        if (index !== "") {
            loadAlertToForm(currentAlerts[index]);
        }
    });

    const inputs = ['alert-type', 'severity', 'start-date', 'end-date', 'risks', 'instructions'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updatePreviewText);
    });

    document.getElementById('alert-image').addEventListener('change', handleImageUpload);
    document.getElementById('severity').addEventListener('change', updateSeverityColor);

    document.querySelectorAll('.format-buttons button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.format-buttons button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const format = e.target.dataset.format;
            const container = document.getElementById('capture-container');
            container.className = '';
            container.classList.add(`format-${format}`);
        });
    });

    document.getElementById('download-btn').addEventListener('click', downloadImage);
    document.getElementById('refresh-alerts').addEventListener('click', fetchAlerts);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            // Create a new section for the uploaded image
            const headerSection = document.getElementById('image-preview-area');
            const existingImg = headerSection.querySelector('.uploaded-map');
            if (existingImg) {
                existingImg.remove();
            }

            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Mapa do Alerta';
            img.className = 'uploaded-map';
            img.style.cssText = 'width:100%;max-height:200px;object-fit:contain;margin-top:20px;border-radius:8px;';
            headerSection.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function loadAlertToForm(alertData) {
    if (!alertData) return;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) return dateStr;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} ${hours}h${minutes}min`;
        } catch (e) {
            return dateStr;
        }
    };

    document.getElementById('alert-type').value = alertData.descricao || alertData.aviso_tipo || '';
    document.getElementById('severity').value = alertData.severidade || alertData.aviso_severidade || 'Perigo Potencial';
    document.getElementById('start-date').value = formatDate(alertData.inicio);
    document.getElementById('end-date').value = formatDate(alertData.fim);
    document.getElementById('risks').value = alertData.riscos ? alertData.riscos.join('\n') : alertData.descricao || '';
    document.getElementById('instructions').value = alertData.instrucoes ? alertData.instrucoes.join('\n') : '';

    updatePreviewText();
    updateSeverityColor();
}

function updatePreviewText() {
    document.getElementById('display-type').textContent = document.getElementById('alert-type').value || '...';
    document.getElementById('display-severity').textContent = document.getElementById('severity').value || '...';
    document.getElementById('display-start').textContent = document.getElementById('start-date').value || '...';
    document.getElementById('display-end').textContent = document.getElementById('end-date').value || '...';
    document.getElementById('display-risks').textContent = document.getElementById('risks').value || '...';

    // Update severity badge
    const severity = document.getElementById('severity').value;
    const badgeText = document.getElementById('display-severity-badge');
    if (badgeText) {
        badgeText.textContent = severity.toUpperCase() || 'GRANDE PERIGO';
    }

    const instructionsText = document.getElementById('instructions').value;
    const instructionsList = document.getElementById('display-instructions');
    instructionsList.innerHTML = '';

    if (instructionsText) {
        const lines = instructionsText.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (line) {
                const cleanLine = line.replace(/^[-•*]\s*/, '');
                const li = document.createElement('li');
                li.textContent = cleanLine;
                instructionsList.appendChild(li);
            }
        });
    }

    updateSeverityColor();
}

function updateSeverityColor() {
    const severity = document.getElementById('severity').value;
    const display = document.getElementById('display-severity');
    const badge = document.getElementById('severity-badge');
    const topBar = document.querySelector('.red-top-bar');
    const footer = document.querySelector('.footer-branding');

    // Remove all severity classes
    if (badge) {
        badge.classList.remove('amarelo', 'laranja', 'vermelho');
    }

    let color = '#333';
    let bgColor = '#c62828'; // default red

    if (severity.includes('Potencial')) {
        color = '#f1c40f';
        bgColor = '#f1c40f';
        if (badge) badge.classList.add('amarelo');
    } else if (severity.includes('Grande')) {
        color = '#c62828';
        bgColor = '#c62828';
        if (badge) badge.classList.add('vermelho');
    } else if (severity.includes('Perigo')) {
        color = '#e67e22';
        bgColor = '#e67e22';
        if (badge) badge.classList.add('laranja');
    }

    if (display) display.style.color = color;
    if (topBar) topBar.style.background = bgColor;
    if (footer) footer.style.background = bgColor;
}

function downloadImage() {
    const container = document.getElementById('capture-container');
    const btn = document.getElementById('download-btn');

    const originalText = btn.textContent;
    btn.textContent = 'Gerando...';
    btn.disabled = true;

    setTimeout(() => {
        html2canvas(container, {
            allowTaint: true,
            useCORS: false,
            scale: 2,
            backgroundColor: '#f5f5f5',
            logging: false
        }).then(canvas => {
            try {
                const dataURL = canvas.toDataURL('image/jpeg', 0.95);

                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Alerta Defesa Civil - Download</title>
                            <style>
                                body {
                                    margin: 0;
                                    padding: 20px;
                                    background: #f0f0f0;
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                }
                                .instructions {
                                    background: #fff;
                                    padding: 15px;
                                    border-radius: 8px;
                                    margin-bottom: 20px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                }
                                img {
                                    max-width: 100%;
                                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                }
                                .download-btn {
                                    display: inline-block;
                                    margin: 20px 0;
                                    padding: 12px 24px;
                                    background: #c62828;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 4px;
                                    font-weight: bold;
                                }
                                .download-btn:hover {
                                    background: #a01010;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="instructions">
                                <h2>✓ Imagem gerada com sucesso!</h2>
                                <p><strong>Passo 1:</strong> Clique no botão abaixo para baixar a imagem.</p>
                                <a href="${dataURL}" download="alerta-defesa-civil-${Date.now()}.jpg" class="download-btn">⬇ Baixar Imagem (JPEG)</a>
                                
                                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
                                
                                <p><strong>Passo 2:</strong> Compartilhe nas redes (Anexe a imagem baixada)</p>
                                <div style="display: flex; gap: 10px; justify-content: center;">
                                    <a href="https://wa.me/?text=Confira%20o%20alerta%20da%20Defesa%20Civil." target="_blank" class="download-btn" style="background: #25D366;">📱 WhatsApp</a>
                                    <a href="https://www.instagram.com/" target="_blank" class="download-btn" style="background: #C13584;">📸 Instagram</a>
                                </div>
                            </div>
                            <img src="${dataURL}" alt="Alerta Defesa Civil">
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    alert('Por favor, permita pop-ups para este site e tente novamente.');
                }

                btn.textContent = originalText;
                btn.disabled = false;
                console.log('✓ Imagem aberta em nova janela!');
            } catch (err) {
                console.error('Erro ao processar imagem:', err);
                alert('Erro: ' + err.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }).catch(error => {
            console.error('Erro html2canvas:', error);
            alert('Erro ao gerar imagem: ' + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        });
    }, 150);
}
