// TOTAL ENDPOINTS : 4

const router = require("express").Router();

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Import crypto modules to hash and salt a password, used for signup and login
const { scryptSync, timingSafeEqual, randomBytes } = require("crypto");

// Import UploadCare functions
const {
    deleteFile,
    UploadcareSimpleAuthSchema,
} = require("@uploadcare/rest-client");

// A regex pattern for validating password
const regexpassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// A regex pattern for validating email
const regexemail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// 1- GET /api/user/:id
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "User " + id + " successfully retrieved.",
        data: userExists,
    });
});

// 2- PATCH /api/user/:id/info
router.patch("/:id/info", async (req, res) => {
    const { email, name } = req.body;
    const id = req.params.id;

    // Check if the variables is empty
    if (notContainsValue(email) || notContainsValue(name)) {
        res.status(400).json({
            status: "400 - Bad Request",
            message: "Email and Name is required.",
            data: [],
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid",
            data: [],
        });
        return;
    }

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    const userExistsEmail = await prisma.user.findFirst({
        where: {
            email: email,
            id: {
                not: id,
            },
        },
    });

    if (userExistsEmail) {
        res.status(409).json({
            status: "409 - Conflict",
            message: "Email is already exists.",
        });
        return;
    }

    const updatedUserInfo = await prisma.user.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            email: email,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "User email and name successfully updated.",
        data: updatedUserInfo,
    });
});

// 3- PATCH /api/user/:id/password
router.patch("/:id/password", async (req, res) => {
    const { currentpassword, newpassword, confirmnewpassword } = req.body;
    const id = req.params.id;

    // Check if the variables is empty
    if (
        notContainsValue(currentpassword) ||
        notContainsValue(newpassword) ||
        notContainsValue(confirmnewpassword)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "New Password and Confirm password is required.",
            data: [],
        });
        return;
    }

    // Check if the password meets the requirements
    if (!regexpassword.test(newpassword)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Password is not valid. Password must contains at least one lowercase letter, one uppercase letter and one number. Password must also has a minimum length of 8 characters.",
            data: [],
        });
        return;
    }

    // Check if the confirm password matches to password
    if (confirmnewpassword !== newpassword) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Confirm password does not match!",
            data: [],
        });
        return;
    }

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    // Destructure salt and hashed password from database
    const [salt, key] = userExists.password.split(".");
    // Hash the password from login with the original salt
    const hashedBuffer = scryptSync(currentpassword, salt, 64);

    // Convert the hashed password from database to hex
    const keyBuffer = Buffer.from(key, "hex");

    // Matching the hashed password from login and from database
    // timingSafeEqual function is a function for comparing two values,
    // but it will also prevent the timing attack from the hackers.
    const isMatch = timingSafeEqual(hashedBuffer, keyBuffer);

    // The response the password is not match
    if (!isMatch) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Old password is incorrect.",
        });
        return;
    }

    // Generate a salt, random bytes that will mix with hashed password
    const newsalt = randomBytes(64).toString("hex");
    // Hash the password, and mix it with the salt
    const hashedPassword = scryptSync(newpassword, newsalt, 64).toString("hex");

    // Store new password for this user
    const updatedUserPaswd = await prisma.user.update({
        where: {
            id: id,
        },
        data: {
            password: `${newsalt}.${hashedPassword}`,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "New password successfully applied.",
        data: updatedUserPaswd,
    });
});

// 4- PATCH /api/user/:id/pic
router.patch("/:id/pic", async (req, res) => {
    const { path } = req.body;
    const id = req.params.id;

    if (notContainsValue(path)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Path is required.",
        });
        return;
    }

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    const updatedUserPic = await prisma.user.update({
        where: {
            id: id,
        },
        data: {
            pic: path,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Profile pic for user " + id + " successfully updated.",
        data: updatedUserPic,
    });
});

// 5- DELETE /api/user/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    // Delete message
    await prisma.message.deleteMany({
        where: {
            recipient_id: id,
        },
    });

    await prisma.message.deleteMany({
        where: {
            sender_id: id,
        },
    });

    // Delete notification
    await prisma.notification.deleteMany({
        where: {
            user_id: id,
        },
    });

    const candidateExists = await prisma.candidate_Profile.findUnique({
        where: {
            user_id: id,
        },
    });

    if (candidateExists) {
        await prisma.successful_Candidate.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.shortlisted_Candidate.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.applicant.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.education.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.work_Experience.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.lang_Ability.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.resume.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.skill.deleteMany({
            where: {
                candidate_profile_id: candidateExists.id,
            },
        });

        await prisma.candidate_Profile.delete({
            where: {
                id: candidateExists.id,
            },
        });
    } else {
        await prisma.officer.delete({
            where: {
                user_id: id,
            },
        });
    }

    await prisma.user.delete({
        where: {
            id: id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "User " + id + " successfully deleted.",
    });
});

// 6- DELETE /api/user/:id/pic
router.delete("/:id/pic", async (req, res) => {
    const id = req.params.id;

    const userExists = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    if (!userExists) {
        res.status(404).json({
            status: "404 - Not Found",
            message: "User id is not found.",
        });
        return;
    }

    const url = userExists.pic;
    const idRegex = /\/([0-9a-f-]+)\//;
    const match = url.match(idRegex);

    if (!match || !match[1]) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Uploadcare id not found.",
        });
        return;
    }

    const uploadcareId = match[1];

    const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
        publicKey: process.env.PUBLIC_KEY_UPLOADCARE,
        secretKey: process.env.SECRET_KEY_UPLOADCARE,
    });

    const result = await deleteFile(
        {
            uuid: uploadcareId,
        },
        { authSchema: uploadcareSimpleAuthSchema }
    );

    const userRemovedPic = await prisma.user.update({
        where: {
            id: id,
        },
        data: {
            pic: "",
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Profile pic for user " + id + " successfully deleted.",
        data: userRemovedPic,
    });
});

module.exports = router;

/**
- id
- name
- email
- password
- role
*/
