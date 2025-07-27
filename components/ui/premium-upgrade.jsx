import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Lock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';

// Premium Feature Button that shows original content but locked with overlay
export const PremiumFeatureButton = ({ 
  children, 
  feature, 
  className = "", 
  size = "default",
  onClick,
  ...props 
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <Button
        className={`relative overflow-hidden group ${className}`}
        size={size}
        onClick={handleClick}
        {...props}
      >
        {/* Original button content */}
        <div className="flex items-center justify-center opacity-50">
        {children}
        </div>
        
        {/* Lock overlay in corner */}
        <div className="absolute top-1 right-1">
          <div className="bg-black/60 rounded-full p-1">
            <Lock className="h-3 w-3 text-white" />
          </div>
        </div>
      </Button>
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Coming Soon!</DialogTitle>
            <DialogDescription className="text-center">
              This feature is currently under development. Stay tuned for updates!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowModal(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Coming Soon Modal Component
export const PremiumUpgradeModal = ({ 
  isOpen, 
  onClose, 
  feature = "premium" 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Coming Soon!</DialogTitle>
          <DialogDescription className="text-center">
            This feature is currently under development. Stay tuned for updates!
            </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} variant="outline">
            Close
              </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Coming Soon Badge Component
export const PremiumBadge = ({ 
  className = "", 
  children = "Coming Soon",
  ...props 
}) => {
  return (
    <Badge 
      className={`bg-gray-100 text-gray-600 ${className}`} 
      {...props}
    >
      {children}
    </Badge>
  );
};

// Default export for backward compatibility
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