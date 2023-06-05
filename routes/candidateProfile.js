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

// 1- GET /api/candidate-profile/:user_id
router.get("/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    // Check candidate profile if it is exists based on id
    const candidateExists = await prisma.candidate_Profile.findFirst({
        where: {
            user_id: user_id,
        },
    });

    // The response that if candidate profile not exists
    if (!candidateExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Candidate profile not found.",
        });
        return;
    }

    // The response if candidate profile is exists
    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Candidate profile with user id " +
            user_id +
            " successfully retrieved.",
        data: candidateExists,
    });
});

// 2- POST /api/candidate-profile
router.post("", async (req, res) => {
    const {
        gender,
        location,
        date_of_birth,
        nationality,
        preferred_salary,
        about,
        user_id,
    } = req.body;

    // Check if the variable is empty
    if (notContainsValue(user_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "User id is required.",
        });
        return;
    }

    // Check if the user_id is exists
    const userExists = await prisma.candidate_Profile.findFirst({
        where: {
            user_id: user_id,
        },
    });

    // The response if the user_id is exists
    if (userExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message:
                "User id is already exists. Cannot create another candidate profile.",
        });
        return;
    }

    // Create new candidate profile
    const newCandidate = await prisma.candidate_Profile.create({
        data: {
            id: randomUUID(),
            gender: gender,
            location: location,
            date_of_birth: date_of_birth,
            nationality: nationality,
            preferred_salary: preferred_salary,
            about: about,
            user_id: user_id,
        },
    });

    // The response if new candidate profile cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New candidate profile cannot be created due to internal error.",
    //     });
    //     return;
    // }

    // The response if new candidate successfully created
    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Ok",
        message: "New candidate profile successfully created.",
        data: newCandidate,
    });
});

// 3- PATCH /api/candidate-profile/:id
router.patch("/:id", async (req, res) => {
    const id = req.params.id;
    const { gender, location, date_of_birth, nationality, preferred_salary } =
        req.body;

    // Check if candidate profile id is exists
    const candidateExists = await prisma.candidate_Profile.findUnique({
        where: {
            id: id,
        },
    });

    // The response if candidate profile id is not exists
    if (!candidateExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Candidate profile id not found.",
        });
        return;
    }

    // Update attributes for candidate profile
    const updatedCandidate = await prisma.candidate_Profile.update({
        where: {
            id: id,
        },
        data: {
            gender: gender,
            location: location,
            date_of_birth: date_of_birth,
            nationality: nationality,
            preferred_salary: preferred_salary,
        },
    });

    // The response if candidate profile cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Candidate profile for " +
    //             id +
    //             " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    // The response if candidate profile successfully updated
    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Candidate profile " + id + " successfully updated.",
        data: updatedCandidate,
    });
});

// 4- DELETE /api/candidate-profile/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if candidate profile id is exists
    const candidateExists = await prisma.candidate_Profile.findUnique({
        where: {
            id: id,
        },
    });

    // The response if candidate profile id is not exists
    if (!candidateExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Candidate profile id not found.",
        });
        return;
    }

    // Delete candidate profile
    await prisma.candidate_Profile.delete({
        where: {
            id: id,
        },
    });

    // The response if candidate profile cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Candidate profile for " +
    //             id +
    //             " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Candidate profile " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- gender
- location
- date_of_birth
- nationality
- preferred_salary
- user_id
*/
