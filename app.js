import express from 'express';
import bodyParser from 'body-parser';
import sett from './sett.js';
import {getWspMessage,adminChatbot} from './services.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

app.get('/welcome', (req, res) => {
    res.send('Welcome to EagleTaxis');
});

app.get('/webhook', (req, res) => {
    try {
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (token === sett.token && challenge !== undefined) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Wrong token');
        }
    } catch (error) {
        res.status(403).send(error);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        const entry = body.entry[0];
        const changes = entry.changes[0];
        const value = changes.value;
        const message = value.messages[0];
        const number = message.from
        const messageId = message.id;
        const contacts = value.contacts[0];
        const name = contacts.profile.name;
        const text = await getWspMessage(message);
        await adminChatbot(text, number, messageId);
        console.log('Número:', number);
        console.log('ID de Mensaje:', messageId);
        console.log('Contactos:', contacts);
        console.log('Nombre:', name);
        console.log('Texto del Mensaje:', text);
        res.send('Sent');
    } catch (error) {
        res.status(500).send('Not sent ' + error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
