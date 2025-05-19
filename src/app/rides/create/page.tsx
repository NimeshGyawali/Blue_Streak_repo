'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { PageTitle } from '@/components/ui/PageTitle';

const createRideSchema = z.object({
  name: z.string().min(5, { message: 'Ride name must be at least 5 characters.' }).max(100),
  startPoint: z.string().min(3, { message: 'Start point is required.' }),
  endPoint: z.string().min(3, { message: 'End point is required (can be same as start for round trips).' }),
  dateTime: z.date({
    required_error: "Ride date and time is required.",
  }),
  description: z.string().max(500, { message: 'Description must be 500 characters or less.' }).optional(),
});

export default function CreateRidePage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof createRideSchema>>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      name: '',
      startPoint: '',
      endPoint: '',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof createRideSchema>) {
    console.log('Creating Micro-Ride:', values);
    // In a real app, you'd send this data to your backend API
    toast({
      title: 'Micro-Ride Proposed!',
      description: `Your ride "${values.name}" has been submitted. It will be auto-approved and listed shortly.`,
    });
    form.reset();
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Create a Micro-Ride" description="Organize a spontaneous ride with fellow Yamaha enthusiasts." />
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>New Micro-Ride Details</CardTitle>
          <CardDescription>Fill in the details below to create your ride. Micro-Rides are user-organized and auto-approved.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ride Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunday Morning Coffee Run" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Point</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Street Cafe or specific address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Point / General Area</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Scenic Viewpoint Park or same as start" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date and Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP HH:mm") // Includes time, manual time input needed or use a date-time picker
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                          }
                          initialFocus
                        />
                        {/* Basic Time Input - consider a dedicated time picker component for better UX */}
                        <div className="p-2 border-t">
                           <Input 
                            type="time"
                            defaultValue={field.value ? format(field.value, "HH:mm") : undefined}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = field.value ? new Date(field.value) : new Date();
                              newDate.setHours(hours, minutes);
                              field.onChange(newDate);
                            }}
                           />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date and time for your ride.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Quick ride for coffee and chat, all welcome!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <PlusCircle size={18} className="mr-2" /> Create Ride
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
