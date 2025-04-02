import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import AppError from "./errors/AppError";
import authRoutes from "./routes/auth"
import { errorHandler } from "./middlewares/errorHandler";
<<<<<<< HEAD
import protectedRoutes from "./routes/protectedRoutes"
import { authMiddleware } from "./middlewares/authMiddleware";
=======
import farmRoutes from './routes/farmRoutes';
>>>>>>> 6b139432a493b14753b2a7533348d5ca4d2f6e26
dotenv.config();
const app: Express = express();

const port = process.env.APP_PORT || 4000;


app.use(express.json());
app.use('/api/farms', farmRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});



app.use("/auth", authRoutes)
app.use("/app", authMiddleware, protectedRoutes)


app.use((req: Request, res: Response, next: NextFunction): any => {
  throw new AppError(`Route ${req.path} not found`, 404)
})

app.use(errorHandler)


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});