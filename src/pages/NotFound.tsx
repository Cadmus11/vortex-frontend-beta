import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router";


const NotFound = () => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="h-dvh w-dvw gap-4 p-8 bg-background text-foreground flex justify-center items-center">
      <div className="flex flex-col gap-4 justify-center items-center">
        <p className="text-5xl font-bold">
          404
        </p>

        <div className="space-y-3 text-center">
          <p className="text-xl font-bold tracking-tight capitalize">Page not found</p>
          <p className="text-muted-foreground text-sm">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full">
          <Button asChild size="lg" className="" >
            <Link to="/login">Go to Login</Link>
          </Button>
          <Button size="lg" onClick={handleGoBack}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound
