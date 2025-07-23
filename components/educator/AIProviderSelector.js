import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  Zap, 
  Search, 
  Brain,
  Globe,
  BookOpen,
  HelpCircle
} from 'lucide-react';

const AIProviderSelector = ({ 
  onProviderChange, 
  selectedProviders = { content: 'gemini', quiz: 'gemini', resources: 'perplexity' },
  className = "" 
}) => {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      } else {
        setError('Failed to load provider information');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const testConnections = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results);
      } else {
        setError('Failed to test provider connections');
      }
    } catch (err) {
      setError('Error testing connections');
    } finally {
      setTesting(false);
    }
  };

  const handleProviderChange = (task, provider) => {
    const newProviders = { ...selectedProviders, [task]: provider };
    if (onProviderChange) {
      onProviderChange(newProviders);
    }
  };

  const getProviderIcon = (providerKey) => {
    switch (providerKey) {
      case 'gemini':
        return <Brain className="w-5 h-5" />;
      case 'perplexity':
        return <Search className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getTaskIcon = (task) => {
    switch (task) {
      case 'content':
        return <BookOpen className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      case 'resources':
        return <Globe className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading providers...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          AI Provider Selection
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={testConnections} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Test Connections'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection">Provider Selection</TabsTrigger>
            <TabsTrigger value="comparison">Provider Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="selection" className="space-y-4">
            {/* Content Generation */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                {getTaskIcon('content')}
                Content Generation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(providers).map(([key, provider]) => (
                  <div 
                    key={`content-${key}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedProviders.content === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!provider.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => provider.available && handleProviderChange('content', key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(key)}
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <Badge variant={provider.available ? 'default' : 'secondary'}>
                        {provider.available ? 'Available' : 'Not Configured'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.slice(0, 2).map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz Generation */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                {getTaskIcon('quiz')}
                Quiz Generation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(providers).map(([key, provider]) => (
                  <div 
                    key={`quiz-${key}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedProviders.quiz === key 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!provider.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => provider.available && handleProviderChange('quiz', key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(key)}
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <Badge variant={provider.available ? 'default' : 'secondary'}>
                        {provider.available ? 'Available' : 'Not Configured'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.slice(0, 2).map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Generation */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                {getTaskIcon('resources')}
                Resource Finding
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(providers).map(([key, provider]) => (
                  <div 
                    key={`resources-${key}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedProviders.resources === key 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!provider.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => provider.available && handleProviderChange('resources', key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(key)}
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <Badge variant={provider.available ? 'default' : 'secondary'}>
                        {provider.available ? 'Available' : 'Not Configured'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.slice(0, 2).map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(providers).map(([key, provider]) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getProviderIcon(key)}
                    <h4 className="font-medium">{provider.name}</h4>
                    <Badge variant={provider.available ? 'default' : 'secondary'}>
                      {provider.available ? 'Available' : 'Not Configured'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Features:</h5>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {testResults[key] && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        {testResults[key].success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Connection Successful</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">Connection Failed</span>
                          </>
                        )}
                      </div>
                      {testResults[key].error && (
                        <p className="text-xs text-red-500 mt-1">{testResults[key].error}</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Selection Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Current Selection:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              {getTaskIcon('content')}
              <span>Content: <strong>{providers[selectedProviders.content]?.name || 'None'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              {getTaskIcon('quiz')}
              <span>Quizzes: <strong>{providers[selectedProviders.quiz]?.name || 'None'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              {getTaskIcon('resources')}
              <span>Resources: <strong>{providers[selectedProviders.resources]?.name || 'None'}</strong></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIProviderSelector; 