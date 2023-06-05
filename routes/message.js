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

// 1- GET /api/message/:recipient_id
router.get("/:recipient_id", async (req, res) => {
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

    const messagesToRecipient = await prisma.message.findMany({
        where: {
            recipient_id: recipient_id,
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

// 2- GET /api/message/:recipient_id/unread
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

module.exports = router;

/**
- id
- content
- is_read
- created_date
- recipient_id
- sender_id
*/
