const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.get('/characters/:characterName/siblings', (req, res) => {
  const { characterName } = req.params;
  console.log(`Received request for character: ${characterName}`);

  // Dummy data for demonstration
  const dummyData = {
    character: characterName,
    siblings: [
      { id: 1, name: 'Sibling A' },
      { id: 2, name: 'Sibling B' },
      { id: 3, name: 'Sibling C' },
    ],
    message: `Data for ${characterName}'s siblings.`,
  };

  res.json(dummyData);
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
