// This middleware will protect routes that require being logged in to access
// if isAuth does not exist on current session the user will be prompted to login
exports.isAuth = (req, res, next) => {
    if (!req.session.isAuth) {
        return res.redirect("/user/login");
    }
    next();
};
