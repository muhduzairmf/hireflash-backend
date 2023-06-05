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

// 1- GET /api/officer/company/:company_id
router.get("/company/:company_id", async (req, res) => {
    const company_id = req.params.company_id;

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company id is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Get list of officer based on company id
    const officerList = await prisma.officer.findMany({
        where: {
            company_id: company_id,
        },
        include: {
            user: true,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of officers from company " +
            company_id +
            " successfully retrieved.",
        data: officerList,
    });
});

// 2- GET /api/officer/resign/:company_id
router.get("/resign/:company_id", async (req, res) => {
    const company_id = req.params.company_id;

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company id is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Get the officer list based on company id
    const officerList = await prisma.officer.findMany({
        where: {
            company_id: company_id,
            is_resigned: true,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of officers from company " +
            company_id +
            " that want to resign successfully retrieved.",
        data: officerList,
    });
});

// 3- GET /api/officer/:user_id
router.get("/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    // Check if the company id is exists
    const officerExists = await prisma.officer.findUnique({
        where: {
            user_id: user_id,
        },
    });

    // The response if the company id is not exists
    if (!officerExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Officer id not found.",
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Officer successfully retrieved.",
        data: officerExists,
    });
});

// 4- POST /api/officer
router.post("/", async (req, res) => {
    const { position, user_id, company_id } = req.body;

    // Check if the variables are empty
    if (
        notContainsValue(position) ||
        notContainsValue(user_id) ||
        notContainsValue(company_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Position, User id and Company id is required.",
        });
        return;
    }

    // Check if the user id is exists
    const userExists = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
    });

    // The response if the user id is not exists
    if (!userExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "User id not found.",
        });
        return;
    }

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company id is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Check if user id included in company id
    const officerExists = await prisma.officer.findFirst({
        where: {
            user_id: user_id,
            company_id: company_id,
        },
    });

    // The response if user id already included in company id
    if (officerExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message:
                "User id " +
                user_id +
                " already included in " +
                company_id +
                ".",
        });
        return;
    }

    // Create new officer
    const newOfficer = await prisma.officer.create({
        data: {
            id: randomUUID(),
            position: position,
            is_resigned: false,
            user_id: user_id,
            company_id: company_id,
        },
    });

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New officer successfully created.",
        data: newOfficer,
    });
});

// 5- PATCH /api/officer/:id
router.patch("/:id", async (req, res) => {
    const { position, is_resigned, user_id, company_id } = req.body;
    const id = req.params.id;

    // Check if officer id is exists
    const officerExists = await prisma.officer.findUnique({
        where: {
            id: id,
        },
    });

    // The response if officer id is not exists
    if (!officerExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Officer " + id + " is not found.",
        });
        return;
    }

    // Update officer
    const updatedOfficer = await prisma.officer.update({
        where: {
            id: id,
        },
        data: {
            position: position,
            is_resigned: is_resigned,
            user_id: user_id,
            company_id: company_id,
        },
    });

    // The response if officer cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Officer " + id + " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Officer " + id + " successfully updated.",
        data: updatedOfficer,
    });
});

// 6- DELETE /api/officer/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if officer id is exists
    const officerExists = await prisma.officer.findUnique({
        where: {
            id: id,
        },
    });

    // The response if officer id is not exists
    if (!officerExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Officer " + id + " is not found.",
        });
        return;
    }

    // Delete officer
    await prisma.officer.delete({
        where: {
            id: id,
        },
    });

    // The response if officer cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Officer " + id + " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Officer " + id + " successfully deleted.",
        data: [],
    });
});

module.exports = router;

/**
- id
- position
- is_resigned
- user_id
- company_id
*/
