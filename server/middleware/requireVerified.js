export default (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({ msg: "Please verify your email first." });
  }
  next();
};