const express = require("express");
const app = express();

app.get("/user/:id", (req, res) => {
  // Vulnerable code: No input validation
  const userId = req.params.id;
  res.send("User: " + userId);
});

app.listen(3000);
