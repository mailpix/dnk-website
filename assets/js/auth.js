// Appwrite Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');

    // 1. Check if already logged in (Prevent "Session forbidden" error)
    account.get().then((response) => {
        console.log("Active Session Found:", response.email);
        // Redirect immediately if on login page
        window.location.href = 'dashboard.html';
    }, () => {
        // No session, allow login form
        console.log("No active session, ready to login.");
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Reset UI
            if (errorMsg) errorMsg.innerText = '';
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            if (btnLogin) btnLogin.disabled = true;

            // Attempt Login
            account.createEmailPasswordSession(email, password)
                .then((response) => {
                    console.log("Login Success:", response);
                    handleSuccess();
                }, (error) => {
                    console.error("Login Failed:", error);

                    // Handle "Session Already Active"
                    if (error.type === 'general_session_already_active' || (error.message && error.message.includes('session is active'))) {
                        handleSuccess();
                        return;
                    }

                    // Specific Errors
                    let msg = 'Login Gagal.';
                    if (error.type === 'user_invalid_credentials') {
                        msg = 'Email atau Password salah.';
                    } else if (error.type === 'general_argument_invalid') {
                        msg = 'Format input salah.';
                    } else if (error.message) {
                        msg = 'Error: ' + error.message;
                    }

                    alert(msg); // Force visible feedback
                    showError(msg);
                });
        });
    }

    function handleSuccess() {
        if (errorMsg) {
            errorMsg.style.color = '#ffd700'; // Gold
            errorMsg.innerText = 'Login Berhasil! Mengalihkan...';
        }
        // alert("Login Success! Redirecting..."); // Optional debug
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }

    function showError(msg) {
        if (errorMsg) {
            errorMsg.innerText = msg;
            errorMsg.style.color = '#ff4d4d';
        }
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (btnLogin) btnLogin.disabled = false;
    }
});
