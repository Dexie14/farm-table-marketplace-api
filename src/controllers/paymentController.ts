import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid"; // For generating transaction IDs
import { ProtectedRequest } from "../utils/types";

const prisma = new PrismaClient();

// Process a payment for an order
async function processPayment(
  req: ProtectedRequest,
  res: Response
): Promise<void> {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user!.id;

    const order = await prisma.order.findUnique({
      where: {
        id: Number(orderId),
        userId: userId,
      },
      include: {
        payment: true,
        items: true,
      },
    });

    if (!order) {
      res
        .status(404)
        .json({ error: "Order not found or does not belong to this user" });
      return;
    }

    if (order.payment && order.payment.status === "COMPLETED") {
      res.status(400).json({ error: "Order has already been paid" });
      return;
    }

    const transactionId = uuidv4();
    const isSuccessful = Math.random() < 0.9;

    const payment = await prisma.payment.upsert({
      where: {
        orderId: Number(orderId),
      },
      update: {
        paymentMethod,
        status: isSuccessful ? "COMPLETED" : "FAILED",
        transactionId,
        paymentDate: isSuccessful ? new Date() : null,
      },
      create: {
        orderId: Number(orderId),
        amount: order.total,
        paymentMethod,
        status: isSuccessful ? "COMPLETED" : "FAILED",
        transactionId,
        paymentDate: isSuccessful ? new Date() : null,
      },
    });

    if (isSuccessful) {
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { status: "PROCESSING" },
      });
    }

    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    res.status(200).json({
      success: isSuccessful,
      payment,
      message: isSuccessful
        ? "Payment processed successfully"
        : "Payment failed. Please try again.",
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
}

// Get payment details for an order
async function getPaymentDetails(req: ProtectedRequest, res: Response): Promise<void> {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const payment = await prisma.payment.findFirst({
      where: {
        orderId: Number(orderId),
        order: {
          userId: userId,
        },
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error("Error retrieving payment details:", error);
    res.status(500).json({ error: "Failed to retrieve payment details" });
  }
}



// For admin/farmer: Get all payments for a farm's products
async function getFarmPayments(
  req: ProtectedRequest,
  res: Response
): Promise<void> {
  try {
    const { farmId } = req.params;
    const userId = req.user!.id;

    const farm = await prisma.farm.findUnique({
      where: {
        id: Number(farmId),
        farmerId: userId,
      },
    });

    if (!farm) {
      res
        .status(403)
        .json({ error: "Not authorized to view this farm's payments" });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          items: {
            some: {
              product: {
                farmId: Number(farmId),
              },
            },
          },
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ payments });
  } catch (error) {
    console.error("Error retrieving farm payments:", error);
    res.status(500).json({ error: "Failed to retrieve farm payments" });
  }
}


export default { processPayment, getPaymentDetails, getFarmPayments };
