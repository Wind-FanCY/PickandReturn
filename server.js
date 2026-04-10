import express from 'express';
import cookieParser from 'cookie-parser';
import sessionControllor from './session-controllor.js';
import itemController from './item-controller.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('./dist'));
app.use(express.json());

app.get('/api/v1/session', sessionControllor.getSession);
app.post('/api/v1/session', sessionControllor.login);
app.delete('/api/v1/session', sessionControllor.logout);

app.get('/api/v1/items', itemController.getItemsList);
app.post('/api/v1/items', itemController.addItem);
app.post('/api/v1/items/:id', itemController.sendNotice);
app.patch('/api/v1/items/:id', itemController.updateItem);
app.delete('/api/v1/items/:id', itemController.deleteItem);

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
});