fetch("http://localhost:5000/api/chat/history/user_dcfxhwhyu")
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
