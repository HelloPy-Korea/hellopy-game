document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');

  function goPlay(email) {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    if (email) localStorage.setItem('snakeUserEmail', email);
    window.location.href = `/game/play${qs}`;
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (emailInput?.value || '').trim();
    if (!email) {
      alert('이메일을 입력해주세요.');
      emailInput?.focus();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      emailInput?.focus();
      return;
    }
    fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then((r) => {
        if (!r.ok) throw new Error('register failed');
        return r.json();
      })
      .then(() => goPlay(email))
      .catch(() => goPlay(email));
  });
});

