import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { CheckCircle } from 'lucide-react';

const ComingSoon = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Feature Coming Soon!</CardTitle>
          <CardDescription>
            We're working hard to bring you this new feature. Stay tuned!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This premium feature is currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon; 