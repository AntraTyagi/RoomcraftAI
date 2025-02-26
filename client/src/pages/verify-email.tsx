import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Email verification failed');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center space-y-4">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Verifying your email...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 className="text-xl font-semibold text-green-600">Email Verified!</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button 
                className="w-full" 
                onClick={() => setLocation('/auth')}
              >
                Go to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="text-xl font-semibold text-destructive">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button 
                className="w-full" 
                onClick={() => setLocation('/auth')}
              >
                Back to Login
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
