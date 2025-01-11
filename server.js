const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const volkovData = JSON.parse(fs.readFileSync('Volkov.json', 'utf8'));

const app = express();
const PORT = 3000;
const TOKEN = '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'

app.use(cors({origin: 'https://chibe.lol',}));
app.use(bodyParser.json());

// Настройка ограничения частоты запросов
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60, 
    message: 'Слишком много запросов с этого IP, попробуйте позже.'
});

app.use('/chat', limiter);
app.get('/api/chat', (req, res) => {
  res.json({ message: 'CORS enabled!' });
});
fetch('https://cors-anywhere.herokuapp.com/https://bulei.onrender.com/api/chat', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error:', error));

app.post('/chat', async (req, res) => {
    const userMessages = req.body.messages;

    const prompt = `
    You are a character with the following traits:
    Name: ${volkovData.name}
    Personality: ${volkovData.Personality}
    Values: ${volkovData.Values}
    Culture: ${volkovData.Culture}
    Unexpected Scenarios:
    - Hostility: ${volkovData.unexpectedScenarios.hostility}
    - Unknown: ${volkovData.unexpectedScenarios.unknown}
    
    Respond to the user's messages in character without mentioning your name or prefixing your responses.

    User messages:
    ${userMessages.map(msg => msg.replace(/<.*?>/g, '')).join('\n')} 
    `;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const botReply = response.data.choices[0].message.content.trim(); 
        const cleanedReply = botReply.replace(/^Бот:\s*/, ''); 
        res.json({ reply: cleanedReply });
    } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        res.status(500).json({ error: 'Ошибка при отправке запроса' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});