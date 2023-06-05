// TOTAL ENDPOINTS : 4

const router = require("express").Router();

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Import crypto modules to hash and salt a password, used for signup and login
const { scryptSync, timingSafeEqual } = require("crypto");

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

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "User email and name successfully updated.",
        data: [],
    });
});

// 3- PATCH /api/user/:id/password
router.patch("/:id/password", async (req, res) => {
    const { currentpassword, newpassword, confirmnewpassword } = req.body;

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

    // Check if the user exists based on email

    // Destructure salt and hashed password from database
    // const [salt, key] = checkUser.password.split(":");
    // Hash the password from this with the original salt
    // const hashedBuffer = scryptSync(currentpassword, salt, 64);

    // Convert the hashed password from database to hex
    // const keyBuffer = Buffer.from(key, "hex");

    // Matching the hashed password from this and from database
    // timingSafeEqual function is a function for comparing two values,
    // but it will also prevent the timing attack from the hackers.
    // const isMatch = timingSafeEqual(hashedBuffer, keyBuffer);

    // Generate a salt, random bytes that will mix with hashed password
    // const salt = randomBytes(16).toString("hex");
    // Hash the password, and mix it with the salt
    // const hashedPassword = scryptSync(newpassword, salt, 64).toString("hex");

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "New password successfully applied.",
        data: [],
    });
});

// 4- DELETE /api/user/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "User " + id + " successfully deleted.",
        data: [],
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
