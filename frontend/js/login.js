document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    errorMsg.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('usuario', usuario);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.innerText = data.message || 'Usuario o contraseña incorrectos';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.innerText = 'Error de conexión con el servidor';
        errorMsg.style.display = 'block';
    }
});