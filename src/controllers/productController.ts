import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProtectedRequest } from '../utils/types';

const prisma = new PrismaClient();
 const createProduct = async (req: ProtectedRequest, res: Response): Promise<void> => {
    try {
        const { productName, description, price, quantity, farmId } = req.body;
        const ownerId = req.user?.id;

        // Verify farm ownership
        const farm = await prisma.farm.findUnique({
            where: {
                id: Number(farmId),
                farmerId: ownerId,
            },
        });

        if (!farm) {
            res.status(403).json({ error: 'Not authorized to add products to this farm' });
            return;
        }

        const product = await prisma.product.create({
            data: {
                productName,
                description,
                price: parseFloat(price),
                quantity: Number(quantity),
                farm: { connect: { id: Number(farmId) } },
            },
        });

        res.status(201).json({
            message: 'Product created successfully',
            product,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

 const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, minPrice, maxPrice, farmId, page = 1, limit = 10 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const whereCondition: any = {
            ...(search && {
                OR: [
                    { productName: { contains: search as string } },
                    { description: { contains: search as string } },
                ],
            }),
            ...(minPrice && { price: { gte: parseFloat(minPrice as string) } }),
            ...(maxPrice && { price: { lte: parseFloat(maxPrice as string) } }),
            ...(farmId && { farmId: Number(farmId) }),
        };

        const products = await prisma.product.findMany({
            where: whereCondition,
            include: {
                farm: {
                    select: {
                        id: true,
                        farmName: true,
                    },
                },
            },
            skip: offset,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.product.count({ where: whereCondition });

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: { products },
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

 const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: Number(productId) },
            include: {
                farm: {
                    select: {
                        id: true,
                        farmName: true,
                        farmer: {
                            select: {
                                id: true,
                                firstName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.status(200).json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

 const updateProduct = async (req: ProtectedRequest, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const { productName, description, price, quantity } = req.body;
        const ownerId = req.user!.id;

        // Verify product ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id: Number(productId) },
            include: { farm: true },
        });

        if (!existingProduct || existingProduct.farm.farmerId !== ownerId) {
            res.status(403).json({ error: 'Not authorized to update this product' });
            return;
        }

        const updatedProduct = await prisma.product.update({
            where: { id: Number(productId) },
            data: {
                productName,
                description,
                price: price ? parseFloat(price) : undefined,
                quantity: quantity ? Number(quantity) : undefined,
            },
        });

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

 const deleteProduct = async (req: ProtectedRequest, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const ownerId = req.user?.id;

        // Verify product ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id: Number(productId) },
            include: { farm: true },
        });

        if (!existingProduct) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (existingProduct.farm.farmerId !== ownerId) {
            res.status(403).json({ error: 'Not authorized to delete this product' });
            return;
        }

        await prisma.product.delete({
            where: { id: Number(productId) },
        });

        res.status(200).json({
            message: 'Product deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    getProductById, updateProduct, deleteProduct, createProduct, getAllProducts
}