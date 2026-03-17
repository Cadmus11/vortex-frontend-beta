import * as Yup from "yup"



export const loginSchema = Yup.object({

  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

})





export const registerSchema = Yup.object({

  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),

  admissionNumber: Yup.string()
    .min(5, "Admission number is too short")
    .required("Admission number is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

})