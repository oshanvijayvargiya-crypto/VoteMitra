fetch("http://localhost:5000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Hello", userId: "user_dcfxhwhyu", history: [] })
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
