document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Se o usuário já estiver logado, redireciona para o dashboard
    if (sessionStorage.getItem('sigerd_user')) {
        window.location.href = '../index.html'; // Corrigido: volta um nível para encontrar o index.html
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simulação de autenticação
        // Em um ambiente real, isso seria uma chamada de API para o backend
        const users = {
            "operador": { pass: "123", name: "Operador", role: "operator" },
            "coordenador": { pass: "admin", name: "Coordenador", role: "admin" },
            "bruno.pagel": { pass: "admin", name: "Bruno Pagel", role: "admin" },
            "willian.ciurlleti": { pass: "admin", name: "Willian Ciurlleti", role: "admin" }
        };

        if (users[username] && users[username].pass === password) {
            // Autenticação bem-sucedida
            errorMessage.textContent = '';

            // Armazena informações do usuário na sessionStorage
            const userData = {
                username: username,
                name: users[username].name,
                role: users[username].role
            };
            sessionStorage.setItem('sigerd_user', JSON.stringify(userData));

            // Redireciona para a página principal
            window.location.href = '../index.html'; // Corrigido: volta um nível para encontrar o index.html
        } else {
            // Falha na autenticação
            errorMessage.textContent = 'Usuário ou senha inválidos.';
        }
    });
});