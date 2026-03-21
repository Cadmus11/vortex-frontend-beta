import { ErrorMessage, Field, Form, Formik } from "formik";
import { registerUser } from "./auth.service";
import { registerSchema } from "./validation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function RegisterForm() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-zinc-100 font-bold">
            Vortex Register
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Formik
            initialValues={{
              email: "",
              admissionNumber: "",
              password: "",
            }}
            validationSchema={registerSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await registerUser(values);
                // user feedback hook could be added here
                navigate("/login");
              } catch (error) {
                console.error("Register error:", error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <Label className="text-zinc-300 mb-2">Email</Label>
                  <Field
                    as={Input}
                    type="email"
                    name="email"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-zinc-300 mb-2">Admission Number</Label>
                  <Field
                    as={Input}
                    name="admissionNumber"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                  <ErrorMessage
                    name="admissionNumber"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-zinc-300 mb-2">Password</Label>
                  <Field
                    as={Input}
                    type="password"
                    name="password"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                  disabled={isSubmitting}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Button>

                <p className="text-center text-xs text-zinc-400">
                  Already have an account?
                  <Link
                    to="/login"
                    className="text-green-500 ml-1 hover:underline"
                  >
                    Login
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
