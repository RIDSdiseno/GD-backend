/*import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient

interface LoginInput{
    email: string;
    password: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

async function login({email, password}: LoginInput) {
    //buscar al usuario por el correo electronico
    const usuario = await prisma.usuario.findUnique({
        where: {email}
    })
    
    if(!usuario){
        throw new Error('Usuario y/o Contraseña incorrecta');
    }
    //se verifica si la cuenta esta activa
    if(!usuario.status){
        throw new Error('La cuenta esta desactivada');
    }

    //se compara la contraseña proporcionada con la almacenada
    const isPassCorrect = await bcrypt.compare(password, usuario.passwordHash);
    if(!isPassCorrect){
        throw new Error('Usuario y/o Contraseña incorrecta')
    }
    const token = jwt.sign({
        userId: usuario.id, email: usuario.email, nivel: usuario.nivel, nombre: usuario.nombreUsuario},
        JWT_SECRET,
        {expiresIn: '1h'}// el token expira en una hora
    );

    return{
        message: 'Login Exitoso',
        token
    };
}
export {login};*/