// TOTAL ENDPOINTS: 2

const router = require("express").Router();

// Import crypto modules to generate UUID
const { randomUUID } = require("crypto");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// 1- GET /api//message/sender/:sender_id/recipient/:recipient_id
router.get("/sender/:sender_id/recipient/:recipient_id", async (req, res) => {
    const recipient_id = req.params.recipient_id;
    const sender_id = req.params.sender_id;

    // Check if recipient id is exists
    const recipientExists = await prisma.user.findUnique({
        where: {
            id: recipient_id,
        },
    });

    // The response of the recipient id is not exists
    if (!recipientExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Recipient id not found.",
        });
        return;
    }

    // Check if sender id is exists
    const senderExists = await prisma.user.findUnique({
        where: {
            id: sender_id,
        },
    });

    // The response of the recipient id is not exists
    if (!senderExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Sender id not found.",
        });
        return;
    }

    const messagesToRecipient = await prisma.message.findMany({
        where: {
            recipient_id: recipient_id,
            sender_id: sender_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of messages from user " +
            recipient_id +
            " successfully retrieved.",
        data: messagesToRecipient,
    });
});

// 3- GET /api/message/:recipient_id/unread
router.get("/:recipient_id/unread", async (req, res) => {
    const recipient_id = req.params.recipient_id;

    // Check if recipient id is exists
    const recipientExists = await prisma.user.findUnique({
        where: {
            id: recipient_id,
        },
    });

    // The response of the recipient id is not exists
    if (!recipientExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Recipient id not found.",
        });
        return;
    }

    const unreadMessagesToRecipient = await prisma.message.findMany({
        where: {
            recipient_id: recipient_id,
            is_read: false,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of unread messages from user " +
            recipient_id +
            " successfully retrieved.",
        data: unreadMessagesToRecipient,
    });
});

// 4- POST /api/message
router.post("", async (req, res) => {
    const { content, is_read, created_date, recipient_id, sender_id } =
        req.body;

    const newMessage = await prisma.message.create({
        data: {
            id: randomUUID(),
            content: content,
            is_read: is_read,
            created_date: created_date,
            recipient_id: recipient_id,
            sender_id: sender_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "Message successfully created.",
        data: newMessage,
    });
});

module.exports = router;

/**
- id
- content
- is_read
- created_date
- recipient_id
- sender_id
*/
