// ===== 페이지 전환 애니메이션 =====
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-12px); }
  }
  body {
    animation: fadeIn 0.35s ease forwards;
  }
  body.fade-out {
    animation: fadeOut 0.25s ease forwards;
  }
`;
document.head.appendChild(style);

// 모든 내부 링크 클릭 시 fadeOut 후 이동
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href) return;
  // 외부 링크, 앵커, javascript: 제외
  if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('tel') || link.target === '_blank') return;

  e.preventDefault();
  document.body.classList.add('fade-out');
  setTimeout(() => { location.href = href; }, 250);
});

// history.back() 대응
window.addEventListener('popstate', () => {
  document.body.classList.add('fade-out');
  setTimeout(() => { history.back(); }, 250);
});

// ===== 로그인 상태 확인 =====
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
        logoutMenu.insertAdjacentHTML('beforebegin', `
          <li id="usernameMenu">
            <a href="/profile" style="color:#001c54; font-weight:bold; cursor:pointer;">👤 ${data.username}</a>
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
  document.body.classList.add('fade-out');
  setTimeout(() => { location.href = '/'; }, 250);
}