// TOTAL ENDPOINTS : 4

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

// 1- GET /api/company/:id
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the is is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Company " + id + " successfully retrieved.",
        data: companyExists,
    });
});

// 2- POST /api/company
router.post("", async (req, res) => {
    const {
        name,
        website,
        description,
        address_line1,
        address_line2,
        postal_code,
        state,
        city,
        country,
    } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(name) ||
        notContainsValue(website) ||
        notContainsValue(description) ||
        notContainsValue(address_line1) ||
        notContainsValue(postal_code) ||
        notContainsValue(state) ||
        notContainsValue(city) ||
        notContainsValue(country)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Name, Website, Description, Address Line 1, Postal code, State, City and Country is required.",
            data: [],
        });
        return;
    }

    // Check if website is associated in any saved company
    const companyExists = await prisma.company.findUnique({
        where: {
            website: website,
        },
    });

    // The response if website is exists
    if (companyExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Website is already exists.",
        });
        return;
    }

    // Create new company
    const newCompany = await prisma.company.create({
        data: {
            id: randomUUID(),
            name: name,
            website: website,
            desc: description,
            address_line1: address_line1,
            address_line2: notContainsValue(address_line2) ? "" : address_line2,
            postal_code: postal_code,
            state: state,
            city: city,
            country: country,
        },
    });

    // The response if new company failed to create
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New company cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New company successfully created.",
        data: newCompany,
    });
});

// 3- PATCH /api/company/:id
router.patch("/:id", async (req, res) => {
    const id = req.params.id;

    const {
        name,
        website,
        description,
        address_line1,
        address_line2,
        postal_code,
        state,
        city,
        country,
    } = req.body;

    // Check if the id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            website: website,
        },
    });

    // The response if the is is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Update company based on id
    const updatedCompany = await prisma.company.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            website: website,
            desc: description,
            address_line1: address_line1,
            address_line2: notContainsValue(address_line2) ? "" : address_line2,
            postal_code: postal_code,
            state: state,
            city: city,
            country: country,
        },
    });

    // The response if the company cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Company " + id + " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Company " + id + " successfully updated.",
        data: updatedCompany,
    });
});

// 4- DELETE /api/company/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            website: website,
        },
    });

    // The response if the is is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Delete company based on id
    await prisma.company.delete({
        id: id,
    });

    // The response if the company cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Company " + id + " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Company " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- name
- website
- description
- address_line1
- address_line2
- postal_code
- state
- city
*/
