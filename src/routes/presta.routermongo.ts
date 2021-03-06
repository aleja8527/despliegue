import express, { Request, Response } from "express";
import { NextFunction } from "express";
import { ObjectId } from "mongodb";
import { decodeToken } from '../firebase/adminTokens';
import { collections } from "../services/database.service";
import { collection } from "../services/database.2";
import { ContainerTypes, ExpressJoiError } from "express-joi-validation";
import validator from '../utilities/validator';
import prestaSchema from '../schemas-joi/user.no.schema';
import sendEmail from '../utilities/bienvenida';
import templateIds from '../constants/templateid.const'
export const prestaRouter = express.Router();

prestaRouter.use(express.json());

prestaRouter.use((err: any|ExpressJoiError, _req: Request, res: Response, next: NextFunction) => {
    if (err && err.type in ContainerTypes){
        const e: ExpressJoiError = err
        res.status(400).send(`You submitted a bad ${e.type} paramater`)
    }else{
        res.status(500).send('Internal server error')

    }
});

prestaRouter.get("/score", decodeToken, async (_req: Request, res: Response) => {
    try {
        const score = await collection.score.find({}).toArray()
        res.status(200).send(score);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

prestaRouter.get("/mongo",  async (_req: Request, res: Response) => {
    const user_no_register = await collections.user_no_register.find({}).toArray();
    try {
        return res.status(200).send(user_no_register);
    } catch (error) {
       return res.status(500).send(error.message);
    }
});

prestaRouter.post("/mongo",  validator.body(prestaSchema), async (_req: Request, res: Response) => {
    const newUser_no_register = _req.body;
    const simulator = await collections.user_no_register.insertOne(newUser_no_register);
    const {monto_prestar, plazo_meses} = newUser_no_register
    const interes = 0.25;
    let total = monto_prestar * interes * parseFloat(plazo_meses)
    const int = {total:total, intereses:interes}
    try {
        return res.status(200).json(int)    
    } catch (error) {
        res.status(500).send(error.message);   
    }
});

prestaRouter.put("/mongo/:id",  decodeToken, validator.body(prestaSchema), async (_req: Request, res: Response) => {
    const id = _req.params.id;
    try {
        const updatedUser_no_register = _req.body;
        const query = { _id: new ObjectId(id) };
      
        const result = await collections.user_no_register.updateOne(query, { $set: updatedUser_no_register });
        result
            ? res.status(200).send(`Successfully updated user with id ${id}`)
            : res.status(304).send(`User with id: ${id} not updated`);
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

prestaRouter.delete("/mongo/:id",  decodeToken, async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const query = { _id: new ObjectId(id) };
        const result = await collections.user_no_register.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed user with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove user no register with id ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`User with id ${id} does not exist`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
});

export default prestaRouter;