const url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC0jjmtME43QgIZZ6qZbXWLEQ5O3ukouLU";

fetch(url)
  .then(res => res.json())
  .then(data => {
    const models = data.models.map(m => m.name);
    console.log("Available models:", models);
  })
  .catch(err => console.error(err));
