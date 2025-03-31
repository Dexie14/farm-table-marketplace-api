import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
const app: Express = express();

const port = process.env.APP_PORT || 4000;


app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});