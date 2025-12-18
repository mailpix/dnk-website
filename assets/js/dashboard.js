// Appwrite Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('user-display');
    const btnLogout = document.getElementById('btn-logout');

    if (!userDisplay) return;

    // Debug: Check if account object exists
    if (typeof account === 'undefined') {
        userDisplay.innerText = "Error: Config Missing";
        userDisplay.style.color = "red";
        return;
    }

    userDisplay.innerText = "Verifying session...";

    // 1. Check Auth State
    account.get().then((user) => {
        // Success - User is logged in
        console.log("User:", user);
        userDisplay.innerText = user.email;
        userDisplay.style.color = "white"; // Reset color
    }, (error) => {
        // Failure - Not logged in
        console.error("Auth Error:", error);
        userDisplay.innerText = "Auth Failed: " + error.message;
        userDisplay.style.color = "red";

        // Delay redirect so user can see the error
        setTimeout(() => {
            // Only redirect if it's truly a 401/Auth error, to avoid loops on Network errors
            if (error.code === 401) {
                window.location.href = 'admin.html';
            }
        }, 2000);
    });

    // 2. Logout Logic
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Disable button to prevent double clicks
            btnLogout.disabled = true;
            btnLogout.innerText = "Logging out...";

            account.deleteSession('current').then(() => {
                window.location.href = 'admin.html';
            }, (error) => {
                console.error("Logout Failed", error);
                alert("Gagal logout: " + error.message);
                btnLogout.disabled = false;
                btnLogout.innerText = "Logout";
            });
        });
    }
});
