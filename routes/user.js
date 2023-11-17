const bcrypt = require("bcrypt");
const router = require("express").Router();
const userController = require("../controller/user");
const { User } = require("../model/user");
const { body, check } = require("express-validator");
const { isAuth } = require("../middleware/isAuth");

router.get("/login", userController.getLogin);

router.post(
    "/login",
    body("email").custom(async (_, { req }) => {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            throw new Error("Email or password are incorrect");
        }
    }),
    body("password").custom(async (_, { req }) => {
        const user = await User.findOne({ email: req.body.email });
        const password = req.body.password;

        const isPassword = await bcrypt.compare(password, user.password);

        if (!isPassword) {
            throw new Error("Email or password are incorrect");
        }
    }),
    userController.postLogin
);

router.get("/signup", userController.getSignup);
router.post(
    "/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email.")
            .custom(async (_, { req }) => {
                const email = req.body.email;
                const userExists = await User.findOne({ email: email });
                if (userExists) {
                    throw new Error(
                        "User already exists, try another email or login"
                    );
                }
            })
            .normalizeEmail(),
        body("password", "Password should be at least 6 characters long")
            .trim()
            .isLength({ min: 6 }),
        body("confirm_password").custom((value, { req }) => {
            const password = req.body.password;
            if (value !== password) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),
    ],
    userController.postSignup
);

router.post("/logout", userController.postLogout);

router.post("/transfer", userController.postTransaction);

// We can use more than one middleware for a route, in this case we are first checking if the user
// is authorized to access this route using the isAuth middleware we created.
router.get("/account", isAuth, userController.getAccount);
router.get("/transactions", isAuth, userController.getTransactions);

router.get("/profile", isAuth, userController.getProfile);
router.post(
    "/profile",
    [
        body(
            "username",
            "Username must contain only letters and numbers"
        ).isAlphanumeric(),
    ],
    isAuth,
    userController.postProfile
);

module.exports = router;
