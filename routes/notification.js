// TOTAL ENDPOINTS : 5

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

// 1- GET /api/notification/:user_id
router.get("/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    // Check if user id is exists
    const userExists = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
    });

    // The response if user id is not exists
    if (!userExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "User id not found.",
        });
        return;
    }

    // Get notification list based on user id
    const notificationList = await prisma.notification.findMany({
        where: {
            user_id: user_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of notifications for user " +
            user_id +
            " successfully retrieved.",
        data: notificationList,
    });
});

// 2- POST /api/notification
router.post("/", async (req, res) => {
    const { content, category, is_read, user_id } = req.body;

    // Check if the variables are empty
    if (
        notContainsValue(content) ||
        notContainsValue(category) ||
        notContainsValue(is_read) ||
        notContainsValue(user_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Content, Category, Is read and User id is required.",
            data: [],
        });
        return;
    }

    // Create new notification
    const newNotification = await prisma.notification.create({
        data: {
            id: randomUUID(),
            content: content,
            category: category,
            is_read: is_read,
            user_id: user_id,
        },
    });

    // The response if new notification cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New notification cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "New notification successfully created.",
        data: newNotification,
    });
});

// 3- PATCH /api/notification/:id
router.patch("/:id", async (req, res) => {
    const { user_id } = req.body;
    const id = req.params.id;

    if (notContainsValue(user_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "User id is required.",
            data: [],
        });
        return;
    }

    // Check notification id if it exists
    const notificationExists = await prisma.notification.findFirst({
        where: {
            id: id,
            user_id: user_id,
        },
    });

    // The response if notification not exists
    if (!notificationExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Notification id is not found.",
        });
        return;
    }

    // Update notification status
    const updatedNotification = await prisma.notification.update({
        where: {
            id: id,
        },
        data: {
            is_read: "true",
        },
    });

    // The response if notification status cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Notification " +
    //             id +
    //             " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Notification " + id + " successfully updated.",
        data: updatedNotification,
    });
});

// 4- PATCH /api/notification/user/:user_id
router.patch("/user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    // Check notification id if it exists
    const userExists = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
    });

    // The response if notification not exists
    if (!userExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    // Update notification status
    const updatedNotificationList = await prisma.notification.updateMany({
        where: {
            user_id: user_id,
        },
        data: {
            is_read: "true",
        },
    });

    // The response if notification status cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Notification for " +
    //             user_id +
    //             " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of notifications for " +
            user_id +
            " successfully updated to read.",
        data: updatedNotificationList,
    });
});

// 5- DELETE /api/notification/user/:user_id
router.delete("/user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    // Check notification id if it exists
    const userExists = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
    });

    // The response if notification not exists
    if (!userExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    await prisma.notification.deleteMany({
        where: {
            user_id: user_id,
        },
    });

    // The response if notification cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Notification for " +
    //             user_id +
    //             " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of notifications for user " +
            user_id +
            " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- content
- category
- is_read
- user_id
*/
