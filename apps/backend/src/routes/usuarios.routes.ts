import { Router } from "express";
import { authGuard } from "../middlewares/authGuard.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { me, getAllUsers, registerUser, updateUsers, deleteUser } from "../controllers/user.controller.js";

const r = Router();
r.get("/me", authGuard, me);
r.get("/", authGuard, getAllUsers);
r.post("/", authGuard, requireRole(["ADMIN", "SUB_ADMIN"]), registerUser);
r.put("/:id", authGuard, updateUsers);
r.delete("/:id", authGuard, deleteUser);

export default r;
