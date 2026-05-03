document.addEventListener("DOMContentLoaded", async () => {
  const loginMenu = document.getElementById("loginMenu");
  const joinMenu = document.getElementById("joinMenu");
  const logoutMenu = document.getElementById("logoutMenu");
  const utilMenu = document.querySelector(".util-menu");

  if (utilMenu) utilMenu.style.visibility = "hidden";

  try {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();

    if (data.loggedIn) {
      // LOGIN, JOIN 숨기고 LOGOUT 표시
      if (loginMenu) loginMenu.style.display = "none";
      if (joinMenu) joinMenu.style.display = "none";
      if (logoutMenu) logoutMenu.style.display = "block";

      // 상단 유저 바
      const userBar = document.createElement("div");
      userBar.style.cssText = `
        position: fixed; top: 0; right: 0;
        background: #001c54; color: white;
        padding: 8px 20px; display: flex;
        align-items: center; gap: 15px;
        z-index: 99999; font-size: 14px;
        border-bottom-left-radius: 10px;
      `;
      userBar.innerHTML = `
        <span>👤 <b>${data.username}</b>님</span>
        ${data.isAdmin ? '<a href="/admin" style="color:#ffd600; text-decoration:none; font-weight:bold;">⚙️ 관리자</a>' : ''}
        <a href="#" onclick="logoutUser()" style="color:#ff6b6b; text-decoration:none; font-weight:bold;">로그아웃</a>
      `;
      document.body.appendChild(userBar);

    } else {
      // 비로그인: LOGIN, JOIN 표시
      if (loginMenu) loginMenu.style.display = "block";
      if (joinMenu) joinMenu.style.display = "block";
      if (logoutMenu) logoutMenu.style.display = "none";
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (utilMenu) utilMenu.style.visibility = "visible";
  }
});

async function logoutUser() {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
  location.href = '/';
}