//import the required modules
import {Request, Response, NextFunction, RequestHandler} from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { error } from 'console';

//instantiate PrismaClient to interact with the database
const prisma = new PrismaClient();

//get all farms
export const getAllFarms:RequestHandler = async(req, res, next) => {
    try {
        const farms = await prisma.farm.findMany(); //uses prisma to fetch all the records from the farm table
        res.status(200).json(farms);
    } catch (error) {
        console.error("Error fetching farms: ", error);
        //return res.status(500).json({error: "Failed to fetch farms"});
        next(error);
    }
};

//get farm by id
export const getFarmById:RequestHandler = async(req, res, next) => {
    try{
        const {id} = req.params;
        const farm = await prisma.farm.findUnique({
            where: {id: Number(id)}, // Convert to number if your ID is numeric
        });

        if (!farm) { 
            res.status(404).json({error: 'Farm not found'});
        }

        res.status(200).json(farm);
    }catch (error) {
        console.error("Error fetching farm: ", error);
        //return res.status(500).json({error: 'Failed to fetch farm'});
        next(error);
    }
};

//create a new farm -- only farmers can
export const createFarm: RequestHandler = async(req, res, next)=> {
    try{
        const {name, description, location} = req.body;
        //extract user info from the authentication middleware
        const farmerId = (req as any).user.id;
        
        //check if the user is a farmer
        const user = await prisma.user.findUnique({
            where: {id: farmerId},
        });

        if (!user || user.role !== 'FARMER'){
            res.status(403).json({error: "Only farmers can create farms"});
        }

        //create the farm record
        const farm = await prisma.farm.create({
            data: {
                name,
                description,
                location,
                farmerId: Number(farmerId), // Convert to number if your foreign key is numeric
            },
        });

        res.status(201).json(farm);
    }catch (error) {
        console.error("Error creating farm: ", error);
        //return res.status(500).json({error: "Failed to create farm!"});
        next(error);
    }
}

//deleting a farm --farmer only
export const deleteFarm: RequestHandler = async(req, res, next) => {
    try{
        const {id} = req.params; //get farm id
        const farmerId = (req as any).user.id;

        //check if the user is a farmer
        const user = await prisma.user.findUnique({
            where: {id: farmerId},
        });

        if (!user || user.role !== 'FARMER'){
            res.status(403).json({error: "Only farmers can delete farm"});
        }
        
        //check if the farm exists
        const farm = await prisma.farm.findUnique({
            where: {id: Number(id)}, // Convert to number if your ID is numeric
        });

        if (!farm) {
            res.status(404).json({error: "Farm not Found!"});
        }

        // Check if the farm belongs to this farmer
        if (farm.farmerId !== farmerId) {
            res.status(403).json({error: "You can only delete your own farms"});
        }

        await prisma.farm.delete({
            where: {id: Number(id)}, // Convert to number if your ID is numeric
        });

        res.status(200).json({message: "Farm deleted successfully!"});
    }catch (error){
        console.error("Error deleting farm: ", error);
        //return res.status(500).json({error: "Failed to delete farm!"});
        next(error);
    }
}

export default {
    getAllFarms, getFarmById, createFarm, deleteFarm
}