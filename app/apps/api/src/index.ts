import express from 'express';
import { router } from './routes/routes';

const port = 3000
const app = express()

app.use(express.json())

app.use("/api/v1", router);

app.listen(port, () => {
    console.log("server listening", port)
})