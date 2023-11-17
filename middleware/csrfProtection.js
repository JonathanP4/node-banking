exports.csrfProtection = (req, res, next) => {
    if (req.csrfToken !== res.locals.csrfToken) {
        req.flash("error", "Unauthorized action");
        return res.redirect("/user/login");
    }
    next();
};
