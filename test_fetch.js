const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyC0jjmtME43QgIZZ6qZbXWLEQ5O3ukouLU";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
})
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Response:", text))
  .catch(err => console.error(err));
