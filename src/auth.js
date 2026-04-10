// 페이지 로드 시 바로 숨기기
document.addEventListener('DOMContentLoaded', () => {
  const loginMenu = document.getElementById("loginMenu");
  const joinMenu = document.getElementById("joinMenu");
  if (loginMenu) loginMenu.style.visibility = 'hidden';
  if (joinMenu) joinMenu.style.visibility = 'hidden';
});

window.onload = async function() {
  const res = await fetch('/api/me');
  const data = await res.json();

  const loginMenu = document.getElementById("loginMenu");
  const joinMenu = document.getElementById("joinMenu");
  const logoutMenu = document.getElementById("logoutMenu");

  if (data.loggedIn) {
    if (loginMenu) loginMenu.style.display = "none";
    if (joinMenu) joinMenu.style.display = "none";
    if (logoutMenu) logoutMenu.style.display = "block";

    const userBox = document.createElement("div");
    userBox.style.position = "fixed";
    userBox.style.top = "20px";
    userBox.style.right = "20px";
    userBox.style.background = "white";
    userBox.style.padding = "10px 15px";
    userBox.style.borderRadius = "10px";
    userBox.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    userBox.style.zIndex = "99999";
    userBox.innerHTML = `${data.username}님 환영해요! 🎉`;
    document.body.appendChild(userBox);
  } else {
    if (loginMenu) loginMenu.style.visibility = 'visible';
    if (joinMenu) joinMenu.style.visibility = 'visible';
    if (logoutMenu) logoutMenu.style.display = "none";
  }
};

async function logout() {
  await fetch('/logout', { method: 'POST' });
  location.reload();
}