import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ProtectedRequest } from "../utils/types";

const prisma = new PrismaClient();

const createOrder = async (
  req: ProtectedRequest,
  res: Response
): Promise<void> => {
  try {
    const { items } = req.body; // Expected to be an array of objects with { productId: number, quantity: number }
    const userId = req.user!.id;

    let total = 0;
    const orderItems: { productId: number; quantity: number; price: number }[] =
      [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          productName: true,
          price: true,
          quantity: true,
        },
      });

      if (!product) {
        res.status(404).json({
          error: `Product with ID ${item.productId} not found.`,
        });
        return;
      }

      if (product.quantity < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for product ${item.productId} - ${product.productName}`,
        });
        return;
      }

      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price.toNumber(),
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: "PENDING",
          items: {
            create: orderItems,
          },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return newOrder;
    });

    const enhancedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      enhancedOrder,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const getUserOrders = async (
  req: ProtectedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                farm: {
                  select: {
                    id: true,
                    farmName: true,
                  },
                },
              },
            },
          },
        },
      },
      skip: offset,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.order.count({ where: { userId } });

    res.status(200).json({
      orders,
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

const getOrderById = async (
  req: ProtectedRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                farm: {
                  select: {
                    id: true,
                    farmName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.status(200).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (
  req: ProtectedRequest,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const orderWithFarmDetails = await prisma.order.findFirst({
      where: {
        id: Number(orderId),
        items: {
          some: {
            product: {
              farm: {
                farmerId: userId,
              },
            },
          },
        },
      },
    });

    if (!orderWithFarmDetails) {
      res.status(403).json({ error: "Not authorized to update this order" });
      return;
    }

    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid order status" });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
    });

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
};
