import { ErrorMessage, Field, Form, Formik } from "formik";

import { loginSchema } from "./validation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";
import { Lock, LogIn, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-zinc-100 font-bold">
            Vortex Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const data: any = await login(values.email, values.password);
                if (data?.user?.role === "admin") {
                  navigate("/admin/dashboard");
                } else {
                  navigate("/voter/dashboard");
                }
              } catch (error) {
                console.error("Login error:", error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                {/* Email */}
                <div>
                  <Label className="text-zinc-300 mb-2">Email</Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />

                    <Field
                      as={Input}
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Password */}
                <div>
                  <Label className="text-zinc-300 mb-2">Password</Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />

                    <Field
                      as={Input}
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-300 cursor-pointer"
                  disabled={isSubmitting}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>

                {/* Register Link */}

                <p className="text-center text-xs text-zinc-400">
                  No Account?
                  <Link
                    to="/register"
                    className="text-green-500 ml-1 hover:underline"
                  >
                    Register
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
