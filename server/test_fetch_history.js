fetch("http://localhost:5000/api/chat/history/user_123")
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
