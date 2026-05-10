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
      if (loginMenu) loginMenu.style.display = "none";
      if (joinMenu) joinMenu.style.display = "none";
      if (logoutMenu) {
        logoutMenu.style.display = "block";
        // 로그아웃 옆에 이름 추가
        logoutMenu.insertAdjacentHTML('beforebegin', `
          <li id="usernameMenu" style="pointer-events:none;">
            <a style="color:#001c54; font-weight:bold;">👤 ${data.username}</a>
          </li>
        `);
      }
      if (data.isAdmin) {
        logoutMenu.insertAdjacentHTML('afterend', `
          <li><a href="/admin" style="color:#001c54; font-weight:bold;">⚙️ 관리자</a></li>
        `);
      }

    } else {
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