
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Hourglass, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { SystemAlert } from '@/app/api/admin/alerts/route'; // Import the type


const severityIcons = {
  Critical: <AlertCircle className="h-5 w-5 text-red-600" />,
  High: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  Medium: <Info className="h-5 w-5 text-yellow-500" />,
  Low: <Info className="h-5 w-5 text-blue-500" />,
};

const statusColors: { [key: string]: string } = {
    New: 'bg-blue-500 hover:bg-blue-600',
    Investigating: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground',
    ActionRequired: 'bg-orange-500 hover:bg-orange-600',
    Resolved: 'bg-green-500 hover:bg-green-600',
    Dismissed: 'bg-gray-500 hover:bg-gray-600',
}

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function fetchAlerts() {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add auth headers if required
      const response = await fetch('/api/admin/alerts');
      if (response.status === 403) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view alerts.' });
        setError('Access Denied.');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch alerts.');
      }
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
       if (errorMessage !== 'Access Denied.') {
        toast({ variant: 'destructive', title: 'Error Fetching Alerts', description: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Placeholder for action handlers
  const handleAlertAction = (alertId: string, action: 'resolve' | 'dismiss' | 'investigate') => {
    console.log(`Performing action "${action}" on alert ${alertId}`);
    toast({ title: 'Action Triggered (Mock)', description: `Action: ${action} on alert ${alertId}. Implement backend.` });
    // TODO: Call backend API to update alert status and then re-fetch or update local state.
  };


  return (
    <div className="space-y-8">
      <PageTitle title="System Alerts" description="Review important system notifications and alerts." />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            Active System Alerts ({alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Dismissed').length})
          </CardTitle>
          <CardDescription>
            Critical or high-priority alerts requiring attention. Filter by status or severity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center p-10">
              <Hourglass className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading alerts...</p>
            </div>
          )}
          {!isLoading && error && (
             <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <Button onClick={fetchAlerts} className="mt-4" variant="secondary">Try Again</Button>
              </CardContent>
            </Card>
          )}
          {!isLoading && !error && alerts.length === 0 && (
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center bg-muted/20">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Active Alerts</h3>
              <p className="text-sm text-muted-foreground mt-2">
                All systems go! There are no active alerts requiring attention.
              </p>
            </div>
          )}
          {!isLoading && !error && alerts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className={`${alert.severity === 'Critical' ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' : ''}`}>
                    <TableCell className="text-center">
                      {severityIcons[alert.severity] || <Info className="h-5 w-5" />}
                    </TableCell>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell>
                      {alert.message}
                      {alert.details_url && (
                        <Link href={alert.details_url} target="_blank" className="ml-2 text-xs text-primary hover:underline">(Details)</Link>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="default" className={cn("text-white", statusColors[alert.status] || 'bg-gray-400')}>{alert.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                      {format(new Date(alert.created_at), 'MMM dd, yyyy - HH:mm')}
                    </TableCell>
                    <TableCell className="text-right space-x-1 space-y-1 sm:space-y-0">
                      {alert.status === 'New' && (
                        <Button variant="outline" size="sm" onClick={() => handleAlertAction(alert.id, 'investigate')}>Investigate</Button>
                      )}
                      {(alert.status === 'Investigating' || alert.status === 'ActionRequired') && (
                        <Button variant="default" size="sm" onClick={() => handleAlertAction(alert.id, 'resolve')} className="bg-green-600 hover:bg-green-700">Resolve</Button>
                      )}
                       <Button variant="ghost" size="sm" onClick={() => handleAlertAction(alert.id, 'dismiss')}>Dismiss</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
