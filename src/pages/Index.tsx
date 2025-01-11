import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.code) {
        case 'invalid_credentials':
          return "Invalid email or password. Please check your credentials and try again.";
        case 'user_not_found':
          return "No account found with these credentials. Please sign up first.";
        case 'invalid_grant':
          return "Invalid login credentials. Please try again.";
        default:
          return error.message;
      }
    }
    return "An unexpected error occurred. Please try again.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: getErrorMessage(error),
          duration: 3000, // 3 seconds for error messages
        });
      } else {
        toast({
          title: "Success",
          description: "Logged in successfully!",
          duration: 2000, // 2 seconds for success message
          className: "bottom-4 right-4 fixed", // Position in bottom right
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F0FB]">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-lg animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1F2C]">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1F2C] mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1F2C] mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/signup" className="text-[#9b87f5] hover:text-[#7E69AB] font-medium">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Index;