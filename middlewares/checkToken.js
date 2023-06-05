// Import JWT library for sign and verify token
const jwt = require("jsonwebtoken");

const { createDecipheriv, createCipheriv, randomBytes } = require("crypto");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

// Instantiate new prisma client
const prisma = new PrismaClient();

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// checkToken.js is a middleware for validating access token from users
module.exports = (req, res, next) => {
    // Get the Authorization value from header
    const authHeader = req.header("Authorization");
    // Separate type and accessToken
    const [type, accessToken] = authHeader.split(" ");

    if (notContainsValue(accessToken)) {
        res.status(401).json({
            status: "401 - Unauthorized",
            message: "Token not found! Please provide a token.",
        });
        return;
    }

    // Verify the given token in try catch
    try {
        jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    } catch (error) {
        console.log("jwt error");
        res.status(403).json({
            status: "403 - Forbidden",
            message: "Invalid or expired token.",
        });
        return;
    }

    // Get the access token from request body
    const refreshToken = req.body.refreshToken;

    if (notContainsValue(refreshToken)) {
        res.status(401).json({
            status: "401 - Unauthorized",
            message: "Token not found! Please provide a token.",
        });
        return;
    }

    // Decrypt
    const [getEncMsg, getKey, getIv] = refreshToken.split(".");

    const rawKey = Buffer.from(getKey, "hex");
    const rawIv = Buffer.from(getIv, "hex");

    const decipher = createDecipheriv("aes256", rawKey, rawIv);

    const decryptedExpiryDate =
        decipher.update(getEncMsg, "hex", "utf-8") + decipher.final("utf8");

    // Get the current date
    const currentDate = new Date();

    // Get the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    // Check if a specific date is 7 days or more in the past
    const targetDate = new Date(decryptedExpiryDate); // Replace with your target date
    const isSevenDaysOrMoreAgo = targetDate < sevenDaysAgo;

    if (isSevenDaysOrMoreAgo) {
        console.log("refresh error");
        res.status(403).json({
            status: "403 - Forbidden",
            message: "Invalid or expired token.",
        });
        return;
    }

    // Create refresh token, expires in 7 days if user not active in 7 days in a row
    // Cipher
    const expiryDate = JSON.stringify(new Date().toDateString());
    const cipherKey = randomBytes(32);
    const cipherIv = randomBytes(16);

    const cipher = createCipheriv("aes256", cipherKey, cipherIv);

    // Encrypt
    const encryptedExpiryDate =
        cipher.update(expiryDate, "utf8", "hex") + cipher.final("hex");

    const newRefreshToken = `${encryptedExpiryDate}.${cipherKey.toString(
        "hex"
    )}.${cipherIv.toString("hex")}`;

    req.refreshToken = newRefreshToken;

    // Continue to next step
    next();
};
