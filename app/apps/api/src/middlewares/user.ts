import jwt from "jsonwebtoken";
import { jwtSecret } from "../constants";
import { NextFunction, Request, Response } from "express";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("asdaddddddddddddddddddddddd");
    
    const header = req.headers["authorization"];
    const token = header?.split(" ")[1];
    console.log(req.route.path)
        console.log(token)
    
    if (!token) {
        res.status(403).json({message: "Unauthorized"})
        return
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as { role: string, userId: string }
        req.userId = decoded.userId
        next()
    } catch(e) {
        res.status(401).json({message: "Unauthorized"})
        return
    }
}