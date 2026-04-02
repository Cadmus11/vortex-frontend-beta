import { ErrorMessage, Field, Form, Formik } from "formik";
import { loginSchema } from "./validation";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeClosed, Lock, LogIn, Mail, Shield, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useEffect } from "react";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState< boolean> (false);

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user?.role === "voter") {
      navigate("/voter/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center flex gap-2 justify-center items-center w-full  text-blue-200 font-bold">
            <Shield className="w-6 h-6"/>
            Vortex Login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Formik<LoginValues>
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setError(null);
              setSuccess(null);
              try {
                await login(values.email, values.password);
                setSuccess("Login successful! Redirecting...");
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Login failed";
                setError(message);
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

                  <div className="relative flex items-center gap-4">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />

                    <Field
                      as={Input}
                      type={showPassword? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••••••"
                      className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                    <span className="h-8 w-8 rounded-sm ring-1 p-2 ring-amber-50/30 flex justify-center items-center" onClick={()=>setShowPassword(!showPassword)}>
                  
                      {
                        showPassword? <EyeClosed/> : <Eye/> 
                      }
                    </span>
                  </div>

                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center p-2 rounded">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm text-center p-2 rounded">
                    {success}
                  </div>
                )}
                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-300 cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>

                {/* Forgot Password */}
                <p className="text-center text-xs text-zinc-400">
                  Forgot password?
                  <Link
                    to="/reset-password"
                    className="text-green-500 ml-1 hover:underline"
                  >
                    Reset
                  </Link>
                </p>

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